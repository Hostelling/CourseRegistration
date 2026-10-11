app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        if (err.status) {
            ctx.status = err.status;
            ctx.body = { error: err.code, message: err.message };
        } else {
            console.error(err);
            ctx.status = 500;
            ctx.body = { error: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' };
        }
    }
});