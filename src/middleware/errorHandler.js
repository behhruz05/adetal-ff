// 404 — topilmagan route
export const notFound = (req, res, next) => {
  res.status(404).json({ message: `Topilmadi - ${req.originalUrl}` });
};

// Global xatolarni ushlovchi
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose noto'g'ri ObjectId
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resurs topilmadi (noto'g'ri ID)";
  }

  // Mongoose validatsiya xatosi
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Dublikat (unique) xatosi
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Bu ${field} allaqachon band`;
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
