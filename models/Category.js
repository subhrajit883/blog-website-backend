import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    image: String,
  name: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

export default mongoose.model("Category", categorySchema);