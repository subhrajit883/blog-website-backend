import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  images: [
    {
      url: String,
      public_id: String,
    },
  ],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

export default mongoose.model("Post", postSchema);