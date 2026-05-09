import express from "express";
import { createPost, getPosts, updatePost, deletePost, getPostById, searchPosts, categoryWisePosts, recentPosts, postComment, postReply, postLikes, getLikes, updateComment, updateReply, deleteComment, deleteReply, getComment, getReply, unLike } from "../controllers/postController.js";
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

// Comment, Reply, and Like routes
router.post("/comment", authenticate, postComment);
router.post("/reply/:commentId", authenticate, postReply);
router.post("/like/:postId", authenticate, postLikes);
router.get("/like/:postId", getLikes);
router.put("/comment/:commentId", authenticate, updateComment);
router.put("/replyupdate/:replyId", authenticate, updateReply);
router.delete("/comment/:commentId", authenticate, deleteComment);
router.delete("/reply/:replyId", authenticate, deleteReply);
router.get("/comment/:commentId", authenticate, getComment);
router.get("/reply/:replyId", authenticate, getReply);
router.put("/unlike/:postId", authenticate, unLike);

export default router;