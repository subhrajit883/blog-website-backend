import Post from "../models/Post.js";
import User from "../models/User.js";

export const createPost = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Please Login" });
    }

    const { title, content, category } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ message: "Title, content, and category are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: "Authenticated user not found" });
    }

    const images = req.files ? req.files.map(file => file.path) : [];

    const post = await Post.create({
      title,
      content,
      images,
      category,
      author: user._id,
    });

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getPosts = async (req, res) => {
  const posts = await Post.find().populate("author");
  res.json(posts);
};