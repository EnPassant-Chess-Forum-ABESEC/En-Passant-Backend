import cloudinary from "./providers/cloudinary.provider.js";

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
