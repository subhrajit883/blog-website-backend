import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";


export const register = async (req, res, next) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);

    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      role: req.body.role,
      password: hashed
    });

    res.json({ success: true, message: "User registered successfully", data: user });

  } catch (err) {
    res.status(500).json({ success: false, message: "Error registering user", data: err });
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error("Please provide email and password");
      error.status = 400;
      return next(error);
    }

    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("Invalid credentials");
      error.status = 401;
      return next(error);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error("Invalid credentials");
      error.status = 401;
      return next(error);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Remove password from user object
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ success: true, message: "Login successful", data: { user: userObj, token } });
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
    res.json({ success: true, username, exists: Boolean(user), message: user ? "Username is already taken" : "Username is available" });

  } catch (err) {
    next(err);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.json({ success: true, message: "Users retrieved successfully", data: users });

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
    res.json({ success: true, message: "User deleted successfully", data: user });

  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting user", data: err });
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
    res.json({ success: true, message: "User updated successfully", data: updatedUser });

  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating user", data: err });
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
    res.json({ success: true, message: "User retrieved successfully", data: user });

  } catch (err) {
    res.status(500).json({ success: false, message: "Error retrieving user", data: err });
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      const error = new Error("User not found with this email");
      error.status = 404;
      return next(error);
    }

    const resetToken = user.getResetPasswordToken();

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `
  <h1>You have requested a password reset</h1>

  <p>Please click the button below to reset your password:</p>

  <a 
    href="${resetUrl}"
    target="_blank"
    rel="noopener noreferrer"
    style="
      display:inline-block;
      padding:12px 24px;
      background:#2563eb;
      color:white;
      text-decoration:none;
      border-radius:8px;
      font-weight:bold;
    "
  >
    Reset Password
  </a>

  <p>If you did not request this, please ignore this email.</p>
`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        html: message,
      });

      res.json({ success: true, message: "Email sent" });

    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      const error = new Error("Email could not be sent");
      error.status = 500;
      return next(error);
    }
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      const error = new Error("Invalid or expired token");
      error.status = 400;
      return next(error);
    }

    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ success: true, message: "Password reset successful" });

  } catch (err) {
    next(err);
  }
};
