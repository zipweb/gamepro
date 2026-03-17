import { coursesRepository } from './repository.js';
import { gamificationService } from '../gamification/service.js';

const SUPPORTED = ['en', 'es', 'fr', 'pt-br', 'pt-pt'];

function normalizeLocale(value) {
  if (!value) return 'en';
  const lower = value.toLowerCase();
  if (SUPPORTED.includes(lower)) return lower;
  if (lower.startsWith('pt-br')) return 'pt-br';
  if (lower.startsWith('pt-pt') || lower === 'pt') return 'pt-pt';
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('fr')) return 'fr';
  return 'en';
}

function detectLocale(manualLang, acceptLanguage) {
  if (manualLang) return normalizeLocale(manualLang);
  const first = (acceptLanguage ?? '').split(',')[0];
  return normalizeLocale(first);
}

function resolveLocalization(localizations, locale) {
  const selected = localizations.find((l) => normalizeLocale(l.locale) === locale);
  return selected || localizations.find((l) => normalizeLocale(l.locale) === 'en') || localizations[0] || null;
}

function withCourseProgress(course, userId) {
  if (!userId) return { ...course, progress: { completedLessons: 0, totalLessons: course.modules.flatMap((m) => m.lessons).length, percentage: 0 } };
  const completions = coursesRepository.getProgressForUser(userId);
  const lessonIds = new Set(course.modules.flatMap((m) => m.lessons.map((l) => l.id)));
  const completed = completions.filter((p) => lessonIds.has(p.lessonId)).length;
  const total = lessonIds.size;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { ...course, progress: { completedLessons: completed, totalLessons: total, percentage } };
}

export const coursesService = {
  listCourses() {
    return coursesRepository.listCourses();
  },
  getCourse(courseId, userId) {
    const course = coursesRepository.getCourse(courseId);
    if (!course) return null;
    return withCourseProgress(course, userId);
  },
  getLesson({ lessonId, lang, acceptLanguage }) {
    const lesson = coursesRepository.getLesson(lessonId);
    if (!lesson) return null;
    const locale = detectLocale(lang, acceptLanguage);
    const localization = resolveLocalization(lesson.localizations ?? [], locale);
    return {
      ...lesson,
      selectedLanguage: locale,
      localization,
      availableLanguages: (lesson.localizations ?? []).map((l) => l.locale)
    };
  },
  completeLesson({ userId, lessonId }) {
    const result = coursesRepository.markLessonComplete({ userId, lessonId });
    gamificationService.awardLessonCompletion(userId, lessonId);
    return result;
  },
  listTracks() {
    return coursesRepository.listTracks();
  },
  createTrack(input) {
    return coursesRepository.createTrack(input);
  },
  createCourse(input) {
    return coursesRepository.createCourse(input);
  },
  createModule(input) {
    return coursesRepository.createModule(input);
  },
  createLesson(input) {
    return coursesRepository.createLesson(input);
  }
};
