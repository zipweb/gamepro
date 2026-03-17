import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_PATH = path.resolve(process.cwd(), 'data/lms-data.json');

function ensureFile() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_PATH)) {
    const seed = {
      tracks: [
        { id: 'track-1', name: 'Productivity Mastery', slug: 'productivity-mastery', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ],
      courses: [
        { id: 'course-1', trackId: 'track-1', title: 'Deep Focus Bootcamp', description: 'Build high-performance focus habits.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ],
      modules: [
        { id: 'module-1', courseId: 'course-1', title: 'Foundations', position: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ],
      lessons: [
        {
          id: 'lesson-1',
          moduleId: 'module-1',
          title: 'Focus Fundamentals',
          position: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          localizations: [
            { locale: 'en', provider: 'youtube', sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { locale: 'es', provider: 'dailymotion', sourceUrl: 'https://www.dailymotion.com/video/x7u5x4y' },
            { locale: 'fr', provider: 'bunny', sourceUrl: 'https://video.bunnycdn.com/play/abc/def' },
            { locale: 'pt-br', provider: 'embed', embedCode: '<iframe src="https://example.com/embed/lesson-1-ptbr"></iframe>' },
            { locale: 'pt-pt', provider: 'youtube', sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
          ]
        }
      ],
      progress: [],
      enrollments: []
    };
    fs.writeFileSync(DATA_PATH, JSON.stringify(seed, null, 2));
  }
}

function readData() {
  ensureFile();
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function stamp(entity) {
  const now = new Date().toISOString();
  return { ...entity, id: entity.id ?? crypto.randomUUID(), createdAt: entity.createdAt ?? now, updatedAt: now };
}

export const coursesRepository = {
  listTracks() {
    return readData().tracks;
  },
  createTrack(track) {
    const data = readData();
    const row = stamp(track);
    data.tracks.push(row);
    writeData(data);
    return row;
  },
  listCourses() {
    const data = readData();
    return data.courses.map((course) => ({
      ...course,
      modulesCount: data.modules.filter((m) => m.courseId === course.id).length,
      lessonsCount: data.lessons.filter((l) => data.modules.some((m) => m.id === l.moduleId && m.courseId === course.id)).length
    }));
  },
  createCourse(course) {
    const data = readData();
    const row = stamp(course);
    data.courses.push(row);
    writeData(data);
    return row;
  },
  createModule(moduleRow) {
    const data = readData();
    const row = stamp(moduleRow);
    data.modules.push(row);
    writeData(data);
    return row;
  },
  createLesson(lesson) {
    const data = readData();
    const row = stamp(lesson);
    data.lessons.push(row);
    writeData(data);
    return row;
  },
  getCourse(courseId) {
    const data = readData();
    const course = data.courses.find((c) => c.id === courseId);
    if (!course) return null;
    const modules = data.modules
      .filter((m) => m.courseId === course.id)
      .sort((a, b) => a.position - b.position)
      .map((module) => ({
        ...module,
        lessons: data.lessons.filter((l) => l.moduleId === module.id).sort((a, b) => a.position - b.position)
      }));
    return { ...course, modules };
  },
  getLesson(lessonId) {
    const data = readData();
    return data.lessons.find((l) => l.id === lessonId) ?? null;
  },
  getProgressForUser(userId) {
    return readData().progress.filter((p) => p.userId === userId);
  },
  getCompletionStats() {
    const data = readData();
    const lessonCountByCourse = new Map();
    for (const course of data.courses) {
      const moduleIds = data.modules.filter((m) => m.courseId === course.id).map((m) => m.id);
      const count = data.lessons.filter((l) => moduleIds.includes(l.moduleId)).length;
      lessonCountByCourse.set(course.id, count);
    }
    let possible = 0;
    for (const enrollment of data.enrollments || []) {
      possible += lessonCountByCourse.get(enrollment.courseId) || 0;
    }
    const completed = (data.progress || []).length;
    const rate = possible === 0 ? 0 : Math.round((completed / possible) * 100);
    return { completedLessons: completed, possibleLessons: possible, completionRate: rate };
  },
  enrollUserInAllCourses(userId) {
    const data = readData();
    const existing = new Set(data.enrollments.filter((e) => e.userId === userId).map((e) => e.courseId));
    for (const course of data.courses) {
      if (!existing.has(course.id)) {
        data.enrollments.push({ userId, courseId: course.id, enrolledAt: new Date().toISOString() });
      }
    }
    writeData(data);
    return data.enrollments.filter((e) => e.userId === userId);
  },

  markLessonComplete({ userId, lessonId }) {
    const data = readData();
    const existing = data.progress.find((p) => p.userId === userId && p.lessonId === lessonId);
    if (!existing) {
      data.progress.push({ userId, lessonId, completedAt: new Date().toISOString() });
      writeData(data);
    }
    return { ok: true };
  }
};
