import express from "express";
import type { Application, Request, Response } from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.ts";
import chatRoutes from "./routes/chat.routes.ts";
import vapiRoutes from "./routes/vapi.routes.ts";
import errorHandler from "./middleware/error-handler.middleware.ts";

const app: Application = express();

// ✅ CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// ✅ BODY PARSING
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

// ✅ FIXED VAPI ROUTE
app.use("/api/vapi", vapiRoutes);

// ✅ 404 HANDLER
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// ✅ ERROR HANDLER
app.use(errorHandler);

export default app;