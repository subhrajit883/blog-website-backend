import express from "express";
import upload from "../middleware/upload.js";
import { authenticate, isAdmin } from "../middleware/auth.js";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../controllers/categoryController.js";

const router = express.Router();

router.post("/", authenticate, isAdmin, upload.single("image"), createCategory);
router.get("/", getCategories);
router.delete("/:id", authenticate, isAdmin, deleteCategory);
router.put("/:id", authenticate, isAdmin, upload.single("image"), updateCategory);

export default router;