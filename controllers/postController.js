import Post from "../models/Post.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Comment from "../models/Comment.js";
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
      .populate("category")
      .populate({
        path: "comments",
        match: { parentComment: null },
        populate: [
          {
            path: "author",
            select: "username",
          },
          {
            path: "replies",
            populate: {
              path: "author",
              select: "username",
            },
          },
        ],
      })
      .populate("likes", "username");
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
      returnDocument: "after",
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
      .populate("category")
      .populate({
        path: "comments",
        match: { parentComment: null }, // Only get top-level comments
        populate: [
          {
            path: "author",
            select: "username",
          },
          {
            path: "replies",
            populate: {
              path: "author",
              select: "username",
            },
          },
        ],
      })
      .populate("likes", "username");

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

export const postComment = async (req, res) => {
  try {
    const { postId, content } = req.body;
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Please Login" });
    }
    if (!content) {
      return res.status(400).json({ success: false, message: "Comment content is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const comment = await Comment.create({
      content,
      author: req.user.id,
      post: postId,
    });

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    const populatedComment = await Comment.findById(comment._id).populate("author", "username email");

    res.status(201).json({ success: true, message: "Comment added successfully", data: populatedComment });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error adding comment", data: err.message });
  }
};

export const postReply = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Please Login" });
    }
    if (!content) {
      return res.status(400).json({ success: false, message: "Reply content is required" });
    }

    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({ success: false, message: "Parent comment not found" });
    }

    const reply = await Comment.create({
      content,
      author: req.user.id,
      post: parentComment.post,
      parentComment: commentId,
    });

    // Update parent comment's replies array
    parentComment.replies.push(reply._id);
    await parentComment.save();

    const populatedReply = await Comment.findById(reply._id).populate("author", "username email");

    res.status(201).json({ success: true, message: "Reply added successfully", data: populatedReply });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error adding reply", data: err.message });
  }
};

export const postLikes = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Please Login" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const isLiked = post.likes.includes(req.user.id);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== req.user.id);
    } else {
      // Like
      post.likes.push(req.user.id);
    }

    await post.save();

    res.json({
      success: true,
      message: isLiked ? "Post unliked" : "Post liked",
      likesCount: post.likes.length,
      isLiked: !isLiked,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error toggling like", data: err.message });
  }
};

export const getLikes = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId).populate("likes", "username");
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    res.json({
      success: true,
      message: "Likes retrieved successfully",
      likesCount: post.likes.length,
      likes: post.likes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error retrieving likes", data: err.message });
  }
};

export const unLike = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Please Login" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const isLiked = post.likes.includes(req.user.id);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== req.user.id);
    } else {
      // Like
      post.likes.push(req.user.id);
    }

    await post.save();

    res.json({
      success: true,
      message: isLiked ? "Post unliked" : "Post liked",
      likesCount: post.likes.length,
      isLiked: !isLiked,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error toggling like", data: err.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Please Login" });
    }
    if (!content) {
      return res.status(400).json({ success: false, message: "Comment content is required" });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    if (comment.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    comment.content = content;
    await comment.save();
    res.json({ success: true, message: "Comment updated successfully", data: comment });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating comment", data: err.message });
  }
};

export const updateReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const { content } = req.body;
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Please Login" });
    }
    if (!content) {
      return res.status(400).json({ success: false, message: "Reply content is required" });
    }
    const reply = await Comment.findById(replyId);
    if (!reply) {
      return res.status(404).json({ success: false, message: "Reply not found" });
    }

    if (reply.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    reply.content = content;
    await reply.save();
    res.json({ success: true, message: "Reply updated successfully", data: reply });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating reply", data: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Please Login" });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    if (comment.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Remove from Post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: commentId }
    });

    // Delete all replies
    await Comment.deleteMany({ parentComment: commentId });

    await Comment.findByIdAndDelete(commentId);
    res.json({ success: true, message: "Comment deleted successfully", data: comment });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting comment", data: err.message });
  }
};

export const deleteReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Please Login" });
    }
    const reply = await Comment.findById(replyId);
    if (!reply) {
      return res.status(404).json({ success: false, message: "Reply not found" });
    }

    if (reply.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Remove from parent comment's replies
    if (reply.parentComment) {
      await Comment.findByIdAndUpdate(reply.parentComment, {
        $pull: { replies: replyId }
      });
    }

    await Comment.findByIdAndDelete(replyId);
    res.json({ success: true, message: "Reply deleted successfully", data: reply });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting reply", data: err.message });
  }
};

export const getComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Please Login" });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }
    res.json({ success: true, message: "Comment found successfully", data: comment });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error finding comment", data: err.message });
  }
};

export const getReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Please Login" });
    }
    const reply = await Comment.findById(replyId);
    if (!reply) {
      return res.status(404).json({ success: false, message: "Reply not found" });
    }
    res.json({ success: true, message: "Reply found successfully", data: reply });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error finding reply", data: err.message });
  }
};
