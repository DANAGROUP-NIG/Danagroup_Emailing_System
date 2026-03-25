// Suppress known BullMQ/ioredis "Connection is closed" unhandled rejections
// that fire during test teardown when app.close() shuts down Redis connections.
process.on("unhandledRejection", (reason: unknown) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  if (msg === "Connection is closed.") return;
  throw reason;
});
