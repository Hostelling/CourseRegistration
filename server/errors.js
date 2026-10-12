function createError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// message for if you're not logged in.
function unauthenticated(message = 'You must be logged in.') {
  return createError(401, 'UNAUTHENTICATED', message);
}

// message for if you don't have permission to do something.
function badRequest(code, message) {
  const error = createError(400, message);
  error.code = code;
  return error;
}

async function errorHandler(ctx, next) {
   try {
    await next();
  } catch (err) {
    if (err.status) {
      // One of our errors: send its status, code and message.
      ctx.status = err.status;
      ctx.body = { error: err.code || 'ERROR', message: err.message };
    } else {
      // A real bug: log it here, tell the client as little as possible.
      console.error(err);
      ctx.status = 500;
      ctx.body = { error: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' };
    }
  }
}