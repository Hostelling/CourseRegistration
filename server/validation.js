function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw badRequest('INVALID_STRING', `The field "${fieldName}" must be a non-empty string.`);
  }
  return value;
}

function requireObjectBody(ctx) {
  if (typeof ctx.request.body !== 'object' || ctx.request.body === null) {
    throw badRequest('INVALID_BODY', 'The request body must be a JSON object.');
  }

    return ctx.request.body;
}


function requireCourseId(value) {
  const id = Number(value)
    if (!Number.isInteger(id) || id <= 0) {
        throw badRequest('INVALID_COURSE_ID', 'The course ID must be a positive integer.');
    }
    return id;
}

module.exports = { 
    requireString, 
    requireObjectBody, 
    requireCourseId 
};
