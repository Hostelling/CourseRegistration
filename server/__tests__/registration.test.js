const { openDatabase } = require('../db');
const { register, drop } = require('../registration');
const { requireAuth } = require('../auth');

const MON = 1, TUE = 2;

let db;
let student;
let other;

function addUser(name) {
  return db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name, `${name}@example.com`, 'not-used').lastInsertRowid;
}

function addCourse(title, { day = MON, start = '09:00', capacity = 10, prerequisites = [] } = {}) {
  const id = db
    .prepare(
      'INSERT INTO courses (title, description, day_of_week, start_time, capacity) VALUES (?, ?, ?, ?, ?)'
    )
    .run(title, `${title} description`, day, start, capacity).lastInsertRowid;
  for (const prerequisiteId of prerequisites) {
    db.prepare('INSERT INTO prerequisites (course_id, prerequisite_id) VALUES (?, ?)').run(
      id,
      prerequisiteId
    );
  }
  return id;
}

function addEnrollment(userId, courseId, status) {
  db.prepare('INSERT INTO enrollments (user_id, course_id, status) VALUES (?, ?, ?)').run(
    userId,
    courseId,
    status
  );
}

const enrollmentCount = () => db.prepare('SELECT COUNT(*) AS n FROM enrollments').get().n;

const statusOf = (userId, courseId) =>
  db.prepare('SELECT status FROM enrollments WHERE user_id = ? AND course_id = ?').get(userId, courseId)
    ?.status;

// Asserts the registration is refused with the given error and adds no row.
function expectRefused(userId, courseId, { status, code }) {
  const before = enrollmentCount();
  let error;
  try {
    register(db, userId, courseId);
  } catch (err) {
    error = err;
  }
  expect(error).toBeDefined();
  expect(error.code).toBe(code);
  expect(error.status).toBe(status);
  expect(enrollmentCount()).toBe(before);
  return error;
}

function expectDropRefused(userId, courseId, { status, code }) {
  const before = enrollmentCount();
  let error;
  try {
    drop(db, userId, courseId);
  } catch (err) {
    error = err;
  }
  expect(error).toBeDefined();
  expect(error.code).toBe(code);
  expect(error.status).toBe(status);
  expect(enrollmentCount()).toBe(before);
  return error;
}

beforeEach(() => {
  db = openDatabase(':memory:');
  student = addUser('student');
  other = addUser('other');
});

afterEach(() => {
  db.close();
});

describe('refused registrations', () => {
  test('not logged in: the auth middleware refuses a request with no session', async () => {
    addCourse('Algebra');
    const before = enrollmentCount();
    const ctx = { cookies: { get: () => undefined, set: jest.fn() }, state: {} };
    const next = jest.fn();

    await expect(requireAuth(db)(ctx, next)).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    });
    expect(next).not.toHaveBeenCalled();
    expect(enrollmentCount()).toBe(before);
  });

  test('a course that does not exist is refused', () => {
    expectRefused(student, 999, { status: 400, code: 'COURSE_NOT_FOUND' });
  });

  test('the student cannot register for the same course twice', () => {
    const algebra = addCourse('Algebra');
    addEnrollment(student, algebra, 'enrolled');

    expectRefused(student, algebra, { status: 400, code: 'ALREADY_REGISTERED' });
  });

  test('a full course is refused', () => {
    const algebra = addCourse('Algebra', { capacity: 1 });
    addEnrollment(other, algebra, 'enrolled');

    expectRefused(student, algebra, { status: 400, code: 'COURSE_FULL' });
  });

  test('the student cannot enroll in more than five courses', () => {
    for (let index = 0; index < 5; index += 1) {
      const start = `${String(index + 8).padStart(2, '0')}:00`;
      const course = addCourse(`Course ${index}`, { day: index + 1, start });
      addEnrollment(student, course, 'enrolled');
    }
    const additionalCourse = addCourse('Additional course', { day: 6, start: '14:00' });

    expectRefused(student, additionalCourse, { status: 400, code: 'MAX_COURSES_REACHED' });
  });

  test('a course at the same time on the same day is refused', () => {
    const algebra = addCourse('Algebra', { day: MON, start: '09:00' });
    const biology = addCourse('Biology', { day: MON, start: '09:00' });
    addEnrollment(student, algebra, 'enrolled');

    expectRefused(student, biology, { status: 400, code: 'TIME_CONFLICT' });
  });

  test('a course with an uncompleted prerequisite is refused', () => {
    const prerequisite = addCourse('Intro to Programming');
    const algorithms = addCourse('Algorithms', { prerequisites: [prerequisite] });

    expectRefused(student, algorithms, { status: 400, code: 'PREREQUISITE_NOT_MET' });
  });

  test('a course is allowed when its prerequisite is completed', () => {
    const prerequisite = addCourse('Intro to Programming');
    const algorithms = addCourse('Algorithms', { prerequisites: [prerequisite] });
    addEnrollment(student, prerequisite, 'completed');

    register(db, student, algorithms);

    expect(statusOf(student, algorithms)).toBe('enrolled');
  });
});

describe('successful registrations and drops', () => {
  test('a course at the same time on a different day is allowed', () => {
    const algebra = addCourse('Algebra', { day: MON, start: '09:00' });
    const biology = addCourse('Biology', { day: TUE, start: '09:00' });
    register(db, student, algebra);

    register(db, student, biology);

    expect(statusOf(student, biology)).toBe('enrolled');
  });

  test('a course at a different time on the same day is allowed', () => {
    const algebra = addCourse('Algebra', { day: MON, start: '09:00' });
    const biology = addCourse('Biology', { day: MON, start: '10:00' });
    register(db, student, algebra);

    register(db, student, biology);

    expect(statusOf(student, biology)).toBe('enrolled');
  });

  test('dropping an enrolled course removes the enrollment', () => {
    const algebra = addCourse('Algebra');
    addEnrollment(student, algebra, 'enrolled');

    drop(db, student, algebra);

    expect(statusOf(student, algebra)).toBeUndefined();
  });

  test('dropping a course the student is not registered for is refused', () => {
    const algebra = addCourse('Algebra');

    expectDropRefused(student, algebra, { status: 400, code: 'NOT_REGISTERED' });
  });

});
