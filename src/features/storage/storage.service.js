import cloudinary from "./providers/cloudinary.provider.js";

export const CATEGORY_MIME_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  raw: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "application/x-zip-compressed",
  ],
};

export const isValidMimeType = (mimeType, category) => {
  if (!CATEGORY_MIME_TYPES[category]) return false;

  return CATEGORY_MIME_TYPES[category].includes(mimeType);
};

export const uploadFile = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      },
    );
    uploadStream.end(buffer);
  });
};

export const deleteFile = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

export const generateSignedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    ...options,
    secure: true,
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 15 * 60,
  });
};
