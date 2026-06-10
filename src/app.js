import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";

import swaggerSpec from "./config/swagger.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
// CORS — har qanday origin (port)ga ruxsat. credentials bilan ishlashi uchun
// kelgan origin aks ettiriladi ("*" credentials bilan ishlamaydi).
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Yuklangan fayllar (rasm/video) — statik
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Swagger hujjati — http://localhost:PORT/api-docs
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Instagram API Docs",
    swaggerOptions: { persistAuthorization: true },
  })
);
// Xom JSON spetsifikatsiya
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

// Sog'liq tekshiruvi
app.get("/", (req, res) => {
  res.json({
    message: "📸 Instagram API ishlayapti",
    version: "1.0.0",
    docs: "/api-docs",
  });
});

// API route'lari
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

// Xato boshqaruvi
app.use(notFound);
app.use(errorHandler);

export default app;
