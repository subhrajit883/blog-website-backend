import Category from "../models/Category.js";
import { deleteCloudinaryAsset, getImageData, getPublicIdFromImage } from "../utils/cloudinaryHelper.js";

const buildCategoryPayload = (req) => {
  const payload = { ...req.body };
  if (req.file) {
    const imageData = getImageData(req.file);
    if (imageData) {
      payload.image = imageData;
    }
  }
  return payload;
};

export const createCategory = async (req, res) => {
  try {
    const payload = buildCategoryPayload(req);
    const category = await Category.create(payload);
    res.json({success: "true", message:"Category created successfully", data: category});
  } catch (err) {
    res.status(500).json({success: "false", message:"Error creating category", data: err});
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({success: "true", message:"Categories retrieved successfully", data: categories});
  } catch (err) {
    res.status(500).json({success: "false", message:"Error retrieving categories", data: err});
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" , success: "false"});
    }

    const publicId = getPublicIdFromImage(category.image);
    if (publicId) {
      await deleteCloudinaryAsset(publicId);
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({success: "true", message: "Category deleted successfully", data: category });
  } catch (err) {
    res.status(500).json({success: "false", message: "Error deleting category", data: err });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" , success: "false"});
    }

    if (req.file) {
      const publicId = getPublicIdFromImage(category.image);
      if (publicId) {
        await deleteCloudinaryAsset(publicId);
      }
    }

    const payload = buildCategoryPayload(req);
    const updatedCategory = await Category.findByIdAndUpdate(req.params.id, payload, { returnDocument: "after" });
    res.json({success: "true", message: "Category updated successfully", data: updatedCategory });
  } catch (err) {
    res.status(500).json({success: "false", message: "Error updating category", data: err });
  }
};

