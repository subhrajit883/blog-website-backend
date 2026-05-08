import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  image: {
    url: String,
    public_id: String,
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
}, { timestamps: true });

export default mongoose.model("Category", categorySchema);