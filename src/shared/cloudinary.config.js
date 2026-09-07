import { v2 as cloudinary } from "cloudinary";

let isConfigured = false;

export const getCloudinary = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_URL } =
    process.env;
  const hasNamedCredentials = CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET;

  if (!CLOUDINARY_URL && !hasNamedCredentials)
    throw new Error("Cloudinary credentials are required");

  if (!isConfigured) {
    if (CLOUDINARY_URL) {
      cloudinary.config(true);
    } else {
      cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
      });
    }
    isConfigured = true;
  }

  return cloudinary;
};
