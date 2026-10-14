const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const { errorHandler, badRequest, notFound } = require('./errors');
const auth = require('./auth');
const registration = require('./registration');
const { requireObjectBody, requireString, requireCourseId } = require('./validation');

function createApp(db) {
  const app = new Koa();
  const router = new Router({ prefix: '/api' });
  const requireAuth = auth.requireAuth(db);


// Creating a route that allows you to create a new user, everyone can access this.
router.post('/login', auth.login(db));

// Creating a route that logs you out.
router.post('/logout', requireAuth, async (ctx) => {
  auth.destroySession(db, ctx.state.sessionToken);
  auth.clearSessionCookie(ctx);
  ctx.body = { message: 'Logged out successfully.' };
});

// Creating a route that allows you to get the current logged-in user, only accessible if logged in.
router.get('/me', requireAuth, async (ctx) => {
  ctx.body = { user: ctx.state.user };
});

// Creating a route that allows you to get all courses, only accessible if logged in.
router.get('/courses', requireAuth, async (ctx) => {
  const courses = db.prepare('SELECT * FROM courses').all();
  ctx.body = { courses };
});

// Creating a route that allows you to get a specific course by ID, only accessible if logged in.
router.get('/courses/:id', requireAuth, async (ctx) => {
  const courseId = requireCourseId(ctx.params.id);
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);  
  if (!course) {
    throw notFound('COURSE_NOT_FOUND', `Course with ID ${courseId} does not exist.`);
  }

  const prerequisites = db.prepare(`
    SELECT prerequisite.title
    FROM prerequisites p
    JOIN courses prerequisite ON prerequisite.id = p.prerequisite_id
    WHERE p.course_id = ?
    ORDER BY prerequisite.title
  `).all(courseId).map((row) => row.title);

  ctx.body = { course: { ...course, prerequisites } };
});

//Register for a course.
router.post('/enrollments', requireAuth, async (ctx) => {
  const body = requireObjectBody(ctx);
  const courseTitle = requireString(body.courseTitle, 'courseTitle');
  registration.register(db, ctx.state.user.id, courseTitle);
  ctx.body = { message: `User with ID ${ctx.state.user.id} successfully registered for course "${courseTitle}".` };
});

//The students enrolled courses, ordered by day and time.
router.get('/enrollments', requireAuth, async (ctx) => {
  const enrollments = db.prepare(`
    SELECT c.*
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.user_id = ? AND e.status = 'enrolled'
    ORDER BY c.day_of_week, c.start_time
  `).all(ctx.state.user.id);
  ctx.body = { enrollments };
});


// For deleting a course.
router.delete('/enrollments/:courseId', requireAuth, async (ctx) => {
  const courseId = requireCourseId(ctx.params.courseId);
  registration.drop(db, ctx.state.user.id, courseId);
  ctx.body = { message: `User with ID ${ctx.state.user.id} successfully dropped course with ID ${courseId}.` };
});

  app.use(errorHandler);
  app.use(
    bodyParser({
      enableTypes: ['json'],
      jsonLimit: '10kb',
      onerror: () => {
        throw badRequest('INVALID_JSON', 'The request body is not valid JSON.');
      },
    })
  );
  app.use(router.routes());

  return app;
}

module.exports = { createApp };
