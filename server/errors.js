function createError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}


async function errorHandler(ctx, next) {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      error: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred.',
    };
  }
}


function unauthenticated(message = 'You must be logged in.') {
  return createError(401, 'UNAUTHENTICATED', message);
}


function badRequest(code, message) {
  return createError(400, code, message);
}

function notFound(message = 'The requested resource was not found.') {
  return createError(404, 'NOT_FOUND', message);
}


module.exports = { errorHandler, badRequest, unauthenticated };