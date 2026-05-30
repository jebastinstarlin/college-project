// ============================================
// PURPOSE: Define routes for Vapi call endpoints
// ============================================

import { Router } from "express";
import { startCall } from "../controllers/vapi.controller.ts";
import authMiddleware from "../middleware/auth.middleware.ts";

const router = Router();

// POST /api/call — Protected — Initiate outbound call
router.post("/call", authMiddleware, startCall);

export default router;