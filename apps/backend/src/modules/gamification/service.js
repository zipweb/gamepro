import crypto from 'node:crypto';
import { gamificationRepository } from './repository.js';
import { authRepository } from '../auth/repository.js';

const XP_RULES = {
  LESSON_COMPLETION: 25,
  COMMUNITY_POST: 15,
  COMMUNITY_COMMENT: 8,
  DAILY_LOGIN: 5
};

const LEVELS = [
  { level: 1, minXp: 0, title: 'Rookie' },
  { level: 2, minXp: 100, title: 'Learner' },
  { level: 3, minXp: 250, title: 'Focused' },
  { level: 4, minXp: 500, title: 'Skilled' },
  { level: 5, minXp: 900, title: 'Expert' },
  { level: 6, minXp: 1400, title: 'Master' }
];

function dayString(value = new Date()) {
  return new Date(value).toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const aa = new Date(`${a}T00:00:00Z`).getTime();
  const bb = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((bb - aa) / 86_400_000);
}

function getTotalXp(userId, fromDate) {
  return gamificationRepository
    .listXpEvents()
    .filter((e) => e.userId === userId && (!fromDate || Date.parse(e.createdAt) >= Date.parse(fromDate)))
    .reduce((sum, e) => sum + e.amount, 0);
}

function resolveLevel(xp) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.minXp) current = level;
  }
  const next = LEVELS.find((l) => l.minXp > current.minXp) || null;
  return { current, next };
}

function ensureBadge(userId, code, label) {
  const exists = gamificationRepository.listBadges().find((b) => b.userId === userId && b.code === code);
  if (exists) return null;
  const badge = gamificationRepository.addBadge({ id: crypto.randomUUID(), userId, code, label, createdAt: new Date().toISOString() });
  gamificationRepository.addNotification({
    id: crypto.randomUUID(),
    userId,
    type: 'badge',
    message: `New badge unlocked: ${label}`,
    createdAt: new Date().toISOString()
  });
  return badge;
}

function evaluateMilestones(userId) {
  const totalXp = getTotalXp(userId);
  if (totalXp >= 100) ensureBadge(userId, 'XP_100', '100 XP');

  const lessonEvents = gamificationRepository.listXpEvents().filter((e) => e.userId === userId && e.source === 'LESSON_COMPLETION');
  if (lessonEvents.length >= 1) ensureBadge(userId, 'FIRST_LESSON', 'First lesson completed');

  const postEvents = gamificationRepository.listXpEvents().filter((e) => e.userId === userId && e.source === 'COMMUNITY_POST');
  if (postEvents.length >= 1) ensureBadge(userId, 'FIRST_POST', 'First post');

  const streak = getStreak(userId);
  if (streak.currentStreak >= 7) ensureBadge(userId, 'STREAK_7', '7-day streak');

  const topUsers = leaderboard({ period: 'weekly', limit: 3 }).items;
  if (topUsers.some((u) => u.userId === userId)) ensureBadge(userId, 'TOP_CONTRIBUTOR', 'Top contributor');
}

function getStreak(userId) {
  const row = gamificationRepository.listDailyActivity().find((a) => a.userId === userId);
  if (!row) return { currentStreak: 0, lastActivityDate: null };
  return { currentStreak: row.streak || 0, lastActivityDate: row.lastActivityDate || null };
}

function updateStreak(userId, date = new Date()) {
  const today = dayString(date);
  const row = gamificationRepository.upsertDailyActivity(userId, today, (existing) => {
    if (!existing.lastActivityDate) return { ...existing, lastActivityDate: today, streak: 1 };
    const delta = daysBetween(existing.lastActivityDate, today);
    if (delta <= 0) return { ...existing, lastActivityDate: today };
    if (delta === 1) return { ...existing, lastActivityDate: today, streak: (existing.streak || 0) + 1 };
    return { ...existing, lastActivityDate: today, streak: 1 };
  });

  if (row.streak > 0 && (row.streak % 7 === 0 || row.streak === 3)) {
    gamificationRepository.addNotification({
      id: crypto.randomUUID(),
      userId,
      type: 'streak',
      message: `Streak milestone reached: ${row.streak} days 🔥`,
      createdAt: new Date().toISOString()
    });
  }

  return { currentStreak: row.streak, lastActivityDate: row.lastActivityDate };
}

function recordXp({ userId, source, amount, meta }) {
  if (!userId || !amount) return null;
  const event = gamificationRepository.addXpEvent({
    id: crypto.randomUUID(),
    userId,
    source,
    amount,
    meta: meta || null,
    createdAt: new Date().toISOString()
  });

  const before = getTotalXp(userId) - amount;
  const after = getTotalXp(userId);
  const beforeLevel = resolveLevel(before).current.level;
  const afterLevel = resolveLevel(after).current.level;
  if (afterLevel > beforeLevel) {
    gamificationRepository.addNotification({
      id: crypto.randomUUID(),
      userId,
      type: 'level_up',
      message: `Level up! You are now level ${afterLevel}.`,
      createdAt: new Date().toISOString()
    });
  }

  evaluateMilestones(userId);
  return event;
}

function summaryForUser(userId) {
  const xp = getTotalXp(userId);
  const { current, next } = resolveLevel(xp);
  const streak = getStreak(userId);
  const xpIntoLevel = xp - current.minXp;
  const nextLevelGap = next ? next.minXp - current.minXp : 0;
  return {
    totalXp: xp,
    level: current.level,
    levelTitle: current.title,
    streak,
    progress: {
      currentLevelMinXp: current.minXp,
      nextLevelMinXp: next?.minXp || null,
      xpIntoLevel,
      xpToNextLevel: next ? Math.max(0, next.minXp - xp) : 0,
      percentToNextLevel: nextLevelGap > 0 ? Math.round((xpIntoLevel / nextLevelGap) * 100) : 100
    },
    badges: gamificationRepository.listBadges().filter((b) => b.userId === userId)
  };
}

function leaderboard({ period = 'all', limit = 20 }) {
  let fromDate = null;
  const now = Date.now();
  if (period === 'weekly') fromDate = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (period === 'monthly') fromDate = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const users = authRepository.listUsers().filter((u) => !u.deletedAt);
  const items = users
    .map((u) => ({
      userId: u.id,
      name: u.name || u.email,
      avatarUrl: u.avatarUrl || null,
      xp: getTotalXp(u.id, fromDate)
    }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit)
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  return { period, items };
}

export const gamificationService = {
  awardLessonCompletion(userId, lessonId) {
    updateStreak(userId);
    return recordXp({ userId, source: 'LESSON_COMPLETION', amount: XP_RULES.LESSON_COMPLETION, meta: { lessonId } });
  },
  awardCommunityPost(userId, postId) {
    updateStreak(userId);
    return recordXp({ userId, source: 'COMMUNITY_POST', amount: XP_RULES.COMMUNITY_POST, meta: { postId } });
  },
  awardCommunityComment(userId, commentId) {
    updateStreak(userId);
    return recordXp({ userId, source: 'COMMUNITY_COMMENT', amount: XP_RULES.COMMUNITY_COMMENT, meta: { commentId } });
  },
  awardDailyLogin(userId) {
    const today = dayString();
    const alreadyAwardedToday = gamificationRepository
      .listXpEvents()
      .some((e) => e.userId === userId && e.source === 'DAILY_LOGIN' && dayString(e.createdAt) === today);
    const streak = updateStreak(userId);
    if (!alreadyAwardedToday) {
      recordXp({ userId, source: 'DAILY_LOGIN', amount: XP_RULES.DAILY_LOGIN });
    }
    return streak;
  },
  getSummary(userId) {
    return summaryForUser(userId);
  },
  getLeaderboard(period, limit) {
    return leaderboard({ period, limit });
  },
  getNotifications(userId) {
    return gamificationRepository
      .listNotifications()
      .filter((n) => n.userId === userId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 50);
  }
};
