// Don't silently swallow unhandled rejections
process.on('unhandledRejection', e => {
    throw e;
});
