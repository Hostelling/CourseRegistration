const { badRequest, notFound, conflict} = require('./errors');

function register(db, userId, courseTitle) {
    // 1. Look up the course in the database to ensure it exists.
    const course = db.prepare('SELECT * FROM courses WHERE title = ?').get(courseTitle);
    if (!course) {
        throw notFound('COURSE_NOT_FOUND', `Course with title "${courseTitle}" does not exist.`);
    }

    // 2. Check if the user is already registered for the course.
    const existingRegistration = db.prepare("SELECT * FROM enrollments WHERE user_id = ? AND course_id = ? AND status = 'enrolled'").get(userId, course.id);
    if (existingRegistration) {
        throw badRequest('ALREADY_REGISTERED', `You have already registered for ${course.title}.`);
    }

    // 3.Check if the user has already completed the course.
    const completedCourse = db.prepare("SELECT * FROM enrollments WHERE user_id = ? AND course_id = ? AND status = 'completed'").get(userId, course.id);
    if (completedCourse) {
        throw badRequest('ALREADY_COMPLETED', `You have already completed ${course.title}.`);
    }

    // 4. Check if the course is full.
    const enrollmentCount = db.prepare("SELECT COUNT(*) AS count FROM enrollments WHERE course_id = ? AND status = 'enrolled'").get(course.id).count;
    if (enrollmentCount >= course.capacity) {
        throw badRequest('COURSE_FULL', `"${course.title}" is full.`);
    }

    // 5. Check if the user has already registered for 5 courses.
    const userEnrollmentCount = db.prepare("SELECT COUNT(*) AS count FROM enrollments WHERE user_id = ? AND status = 'enrolled'").get(userId).count;
    if (userEnrollmentCount >= 5) {
        throw badRequest('MAX_COURSES_REACHED', `You already registered for the maximum of 5 courses.`);
    }

    // 6. Checks for if the user is trying to register for a course, but they have a time conflict with another course they are already registered for.
    const conflict = db.prepare(`SELECT c.title FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ? AND e.status = 'enrolled' AND c.day_of_week = ?   AND c.start_time = ?`)
    .get(userId, course.day_of_week, course.start_time);
    if (conflict) {
        throw badRequest('TIME_CONFLICT', `You have a scheduling conflict with course "${conflict.title}".`);
    }

    // 7. Check if the user has completed all prerequisites for the course.
    const missingPrerequisite = db.prepare(`
      SELECT prereq.title FROM prerequisites p
      JOIN courses prereq ON prereq.id = p.prerequisite_id 
      LEFT JOIN enrollments e ON e.course_id = p.prerequisite_id 
      AND e.user_id = ? AND e.status = 'completed'
      WHERE p.course_id = ? AND e.course_id IS NULL
      LIMIT 1
    `).get(userId, course.id);

    if (missingPrerequisite) {
        throw badRequest(
            'PREREQUISITE_NOT_MET',
            `You have not completed the prerequisite course "${missingPrerequisite.title}" for "${course.title}".`
        );
    }

    // 8. If all checks pass, insert a new enrollment row with status 'enrolled'.
    db.prepare("INSERT INTO enrollments (user_id, course_id, status) VALUES (?, ?, 'enrolled')").run(userId, course.id);
}



function drop(db, userId, courseId) {
    // Check to see if the user has the course.
    const existingRegistration = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').get(userId, courseId);
    if (!existingRegistration) {
        throw badRequest('NOT_REGISTERED', `User with ID ${userId} is not registered for course with ID ${courseId}.`);
    }

    // Delete the enrollment row
    db.prepare('DELETE FROM enrollments WHERE user_id = ? AND course_id = ?').run(userId, courseId);
    }

module.exports = { 
    register, 
    drop 
};