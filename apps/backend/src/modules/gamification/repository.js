import fs from 'node:fs';
import path from 'node:path';

const DATA_PATH = path.resolve(process.cwd(), 'data/gamification.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({
      xpEvents: [],
      badges: [],
      notifications: [],
      dailyActivity: []
    }, null, 2));
  }
}

function readData() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

export const gamificationRepository = {
  listXpEvents() {
    return readData().xpEvents;
  },
  addXpEvent(event) {
    const data = readData();
    data.xpEvents.push(event);
    writeData(data);
    return event;
  },
  listBadges() {
    return readData().badges;
  },
  addBadge(row) {
    const data = readData();
    data.badges.push(row);
    writeData(data);
    return row;
  },
  listNotifications() {
    return readData().notifications;
  },
  addNotification(row) {
    const data = readData();
    data.notifications.push(row);
    writeData(data);
    return row;
  },
  listDailyActivity() {
    return readData().dailyActivity;
  },
  upsertDailyActivity(userId, day, mutate) {
    const data = readData();
    const idx = data.dailyActivity.findIndex((a) => a.userId === userId);
    if (idx === -1) {
      data.dailyActivity.push(mutate({ userId, day, streak: 1, lastActivityDate: day }));
    } else {
      data.dailyActivity[idx] = mutate(data.dailyActivity[idx]);
    }
    writeData(data);
    return data.dailyActivity.find((a) => a.userId === userId);
  }
};
