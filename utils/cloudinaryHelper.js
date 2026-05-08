import { cloudinary } from "../config/cloudinary.js";

const extractPublicId = (url) => {
  if (!url) return null;
  const parts = url.split("/upload/");
  if (parts.length > 1) {
    const afterUpload = parts[1];
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    return withoutVersion.replace(/\.[^.]+$/, "");
  }

  const lastSegment = url.split("/").pop();
  if (!lastSegment) return null;
  return lastSegment.replace(/\.[^.]+$/, "");
};

export const getImageData = (file) => {
  if (!file) return null;
  const url = file.path || file.secure_url || file.url || file.filename;
  if (!url) return null;
  const public_id = file.filename || file.public_id || extractPublicId(url);
  return {
    url,
    public_id,
  };
};

export const getPublicIdFromImage = (image) => {
  if (!image) return null;
  if (typeof image === "string") {
    return extractPublicId(image);
  }
  return image.public_id || extractPublicId(image.url);
};

export const deleteCloudinaryAsset = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { invalidate: true });
};

export const deleteCloudinaryAssets = async (publicIds) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) return;
  const deletions = publicIds.filter(Boolean).map((id) => deleteCloudinaryAsset(id));
  await Promise.all(deletions);
};
