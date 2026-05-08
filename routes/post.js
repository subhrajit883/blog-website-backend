import express from "express";
import { createPost, getPosts, updatePost, deletePost, getPostById, searchPosts, categoryWisePosts, recentPosts } from "../controllers/postController.js";
import { authenticate, isAdmin } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/", authenticate, upload.array("image", 10), createPost);
router.get("/", getPosts);
router.get("/recent", recentPosts);
router.get("/:id", getPostById);
router.patch("/:id", authenticate, isAdmin, upload.array("image", 10), updatePost);
router.delete("/:id", authenticate, isAdmin, deletePost);
router.get("/search/:query", searchPosts);
router.get("/category/:categoryId", categoryWisePosts);

export default router;