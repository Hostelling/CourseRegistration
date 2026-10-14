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

// Creates an error for unauthenticated access.
function unauthenticated(message = 'You must be logged in.') {
  return createError(401, 'UNAUTHENTICATED', message);
}

// Creates an error for bad requests.
function badRequest(code, message) {
  return createError(400, code, message);
}

// Creates an error for not found resources.
function notFound(code, message) {
  return createError(404, code, message);
}


module.exports = { 
  errorHandler, 
  badRequest, 
  unauthenticated, 
  notFound, 
   };