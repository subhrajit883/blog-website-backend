import Category from "../models/Category.js";

const buildCategoryPayload = (req) => {
  const payload = { ...req.body };
  if (req.file) {
    payload.image = req.file.path || req.file.secure_url || req.file.filename;
  }
  return payload;
};

export const createCategory = async (req, res) => {
  try {
    const payload = buildCategoryPayload(req);
    const category = await Category.create(payload);
    res.json(category);
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json(err);
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id, {returnDocument: "after"});
    res.json({ message: "Category deleted" , data: category  });
  } catch (err) {
    res.status(500).json(err);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const payload = buildCategoryPayload(req);
    const category = await Category.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.json(category);
  } catch (err) {
    res.status(500).json(err);
  }
};

