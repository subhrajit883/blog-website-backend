import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  images: [String],
  category: {
    type: String,
    enum: ["Fashion", "Fitness", "Food", "Trends"],
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

export default mongoose.model("Post", postSchema);