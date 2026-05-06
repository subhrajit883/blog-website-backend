import express from "express";
import { createPost, getPosts } from "../controllers/postController.js";
import { authenticate } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/", authenticate, upload.array("image", 10), createPost);
router.get("/", getPosts);

export default router;