const { badRequest, notFound, conflict} = require('./errors');

function register(db, userId, courseTitle) {
    // 1. Look up the course in the database to ensure it exists.
    const course = db.prepare('SELECT * FROM courses WHERE title = ?').get(courseTitle);
    if (!course) {
        throw notFound('COURSE_NOT_FOUND', `Course with title "${courseTitle}" does not exist.`);
    }

    // 2. Check if the user is already registered for the course.
    const existingRegistration = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').get(userId, course.id);
    if (existingRegistration) {
        throw badRequest('ALREADY_REGISTERED', `User with ID ${userId} is already registered for course ${course.title}.`);
    }

    // 3. Check if the course is full.
    const enrollmentCount = db.prepare("SELECT COUNT(*) AS count FROM enrollments WHERE course_id = ? AND status = 'enrolled'").get(course.id).count;
    if (enrollmentCount >= course.capacity) {
        throw badRequest('COURSE_FULL', `Course with title "${course.title}" is full.`);
    }

    // 4. Check if the user has already registered for 5 courses.
    const userEnrollmentCount = db.prepare("SELECT COUNT(*) AS count FROM enrollments WHERE user_id = ? AND status = 'enrolled'").get(userId).count;
    if (userEnrollmentCount >= 5) {
        throw badRequest('MAX_COURSES_REACHED', `User with ID ${userId} has already registered for the maximum of 5 courses.`);
    }

    // Checks for if the user is trying to register for a course, but they have a time conflict with another course they are already registered for.
    const conflict = db.prepare(`SELECT c.title FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ? AND e.status = 'enrolled' AND c.day_of_week = ?   AND c.start_time = ?`)
    .get(userId, course.day_of_week, course.start_time);
    if (conflict) {
        throw badRequest('TIME_CONFLICT', `User with ID ${userId} has a scheduling conflict with course "${conflict.title}".`);
    }

    // 5. Check if the user has completed all prerequisites for the course.
    const prerequisites = db.prepare('SELECT prerequisite_id FROM prerequisites WHERE course_id = ?').all(course.id).map(row => row.prerequisite_id);
    for (const prerequisiteId of prerequisites) {
        const completed = db.prepare("SELECT * FROM enrollments WHERE user_id = ? AND course_id = ? AND status = 'completed'").get(userId, prerequisiteId);
        if (!completed) {
            throw badRequest('PREREQUISITE_NOT_MET', `User with ID ${userId} has not completed prerequisite course with ID ${prerequisiteId}.`);
        }
    }

    // 6. If all checks pass, insert a new enrollment row with status 'enrolled'.
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