const {  } = require('./errors');

function register(db, userUd, courseId) {
    // 1. Look up the course in the database to ensure it exists.
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
    if (!course) {
        throw badRequest('COURSE_NOT_FOUND', `Course with ID ${courseId} does not exist.`);
    }

    // 2. Check if the user is already registered for the course.
    const existingRegistration = db.prepare('SELECT * FROM registrations WHERE user_id = ? AND course_id = ?').get(userId, courseId);
    if (existingRegistration) {
        throw badRequest('ALREADY_REGISTERED', `User with ID ${userId} is already registered for course with ID ${courseId}.`);
    }

    // 3. Insert the enrollment row
    db.prepare('INSERT INTO registrations (user_id, course_id) VALUES (?, ?)').run(userId, courseId);
    }


function drop(db, userId, courseId) {
    // Check to see if the user has the course.
    const existingRegistration = db.prepare('SELECT * FROM registrations WHERE user_id = ? AND course_id = ?').get(userId, courseId);
    if (!existingRegistration) {
        throw badRequest('NOT_REGISTERED', `User with ID ${userId} is not registered for course with ID ${courseId}.`);
    }

    // Delete the enrollment row
    db.prepare('DELETE FROM registrations WHERE user_id = ? AND course_id = ?').run(userId, courseId);
    }

module.exports = { 
    register, 
    drop 
};