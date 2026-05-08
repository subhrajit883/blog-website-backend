import Post from "../models/Post.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import { deleteCloudinaryAssets, getImageData, getPublicIdFromImage } from "../utils/cloudinaryHelper.js";

export const createPost = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Please Login" });
    }

    const { title, content, category } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ message: "Title, content, and category are required", success: "false" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: "User not found", success: "false" });
    }
    // if (user.role !== "admin") {
    //   return res.status(403).json({ message: "Only admin can create posts" });
    // }

    const images = req.files
      ? req.files.map(getImageData).filter(Boolean)
      : [];

    // If no images provided, use category's image
    if (images.length === 0) {
      const categoryDoc = await Category.findById(category);
      if (categoryDoc?.image) {
        images.push(categoryDoc.image);
      }
    }

    const post = await Post.create({
      title,
      content,
      images,
      category,
      author: user._id,
    });

    res.status(201).json({ success: "true", message: "Post created successfully", data: post });

  } catch (err) {
    res.status(500).json(err);
  }
};

export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author")
      .populate("category");

    res.json({ success: "true", message: "Posts retrieved successfully", data: posts });
  } catch (err) {
    res.status(500).json(err);
  }
};

export const updatePost = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Please Login" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found", success: "false" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can update posts", success: "false" });
    }

    const updatePayload = {
      ...req.body,
    };

    if (req.files && req.files.length > 0) {
      const oldPublicIds = (post.images || [])
        .map(getPublicIdFromImage)
        .filter(Boolean);
      if (oldPublicIds.length > 0) {
        await deleteCloudinaryAssets(oldPublicIds);
      }

      updatePayload.images = req.files
        .map(getImageData)
        .filter(Boolean);
    }

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    })
      .populate("author")
      .populate("category");

    res.json({ success: "true", message: "Post updated successfully", data: updatedPost });
  } catch (err) {
    res.status(500).json({ success: "false", message: "Error updating post", data: err });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author")
      .populate("category");
    if (!post) {
      return res.status(404).json({ message: "Post not found", success: "false" });
    }
    res.json({ success: "true", message: "Post retrieved successfully", data: post });
  } catch (err) {
    res.status(500).json({ success: "false", message: "Error retrieving post", data: err });
  }
};

export const deletePost = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Please Login", success: "false" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found", success: "false" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can delete posts", success: "false" });
    }

    const publicIds = (post.images || [])
      .map(getPublicIdFromImage)
      .filter(Boolean);
    if (publicIds.length > 0) {
      await deleteCloudinaryAssets(publicIds);
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: "true", message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: "false", message: "Error deleting post", data: err });
  }
};

export const searchPosts = async (req, res) => {
  try {

    const { query } = req.params;

    if (!query) {
      return res.status(400).json({
        message: "Search query is required",
        success: false,
      });
    }

    const posts = await Post.find({
      $or: [
        {
          title: {
            $regex: query,
            $options: "i",
          },
        },
        {
          content: {
            $regex: query,
            $options: "i",
          },
        },
      ],
    })
      .populate("author")
      .populate("category");

    res.json({
      success: true,
      message: "Search results retrieved successfully",
      data: posts,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: "Error searching posts",
      data: err,
    });

  }
};

export const categoryWisePosts = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const posts = await Post.find({ category: categoryId })
      .populate("author")
      .populate("category");

    res.json({ success: "true", message: "Posts retrieved successfully", data: posts });
  } catch (err) {
    res.status(500).json({ success: "false", message: "Error retrieving posts", data: err });
  }
};

export const recentPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author")
      .populate("category")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ success: "true", message: "Recent posts retrieved successfully", data: posts });
  } catch (err) {
    res.status(500).json({ success: "false", message: "Error retrieving recent posts", data: err });
  }
};