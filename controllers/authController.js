import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res, next) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);

    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      role: req.body.role,
      password: hashed
    });

    res.json({success: "true", message:"User registered successfully", data: user});
  } catch (err) {
    res.status(500).json({success: "false", message:"Error registering user", data: err});
  }
};

export const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      return next(error);
    }

    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) {
      const error = new Error("Wrong password");
      error.status = 400;
      return next(error);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({success: "true", message: "Login successful", data: { user, token } });
  } catch (err) {
    next(err);
  }
};

export const validateUsername = async (req, res, next) => {
  try {
    const username = req.body.username || req.query.username;

    if (!username) {
      const error = new Error("Username is required");
      error.status = 400;
      return next(error);
    }

    const user = await User.findOne({ username });
    res.json({ success: "true", username, exists: Boolean(user) , message: user ? "Username is already taken" : "Username is available",  });
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.json({success: "true", message:"Users retrieved successfully", data: users});
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      return next(error);
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({success: "true", message: "User deleted successfully", data: user });
  } catch (err) {
    res.status(500).json({success: "false", message: "Error deleting user", data: err });
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      return next(error);
    }
    const updatedData = { ...req.body };
    if (req.body.password) {
      updatedData.password = await bcrypt.hash(req.body.password, 10);
    }
    const updatedUser = await User.findByIdAndUpdate(req.params.id, updatedData, { returnDocument: "after" });
    res.json({success: "true", message: "User updated successfully", data: updatedUser });
  } catch (err) {
    res.status(500).json({success: "false", message: "Error updating user", data: err });
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      return next(error);
    }
    res.json({success: "true", message: "User retrieved successfully", data: user });
  } catch (err) {
    res.status(500).json({success: "false", message: "Error retrieving user", data: err });
  }
};