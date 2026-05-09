import express from "express";
import { register, login, validateUsername, getUsers, deleteUser, forgotPassword, resetPassword } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/validate-username", validateUsername);
router.get("/users", getUsers);
router.delete("/users/:id", deleteUser);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:resetToken", resetPassword);

export default router;