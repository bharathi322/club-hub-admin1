import fs from "fs";
import path from "path";
export function fileToMeta(file) {
  if (!file) return null;

  return {
    label: file.fieldname || "",
    originalName: file.originalname || "",
    fileName: file.filename || "",
    mimeType: file.mimetype || "",
    size: file.size || 0,
    url: `/uploads/${file.filename}`,
  };
}

// delete file
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("File deleted:", filePath);
    }
  } catch (error) {
    console.error("Delete file error:", error.message);
  }
};

// get file URL
export const getFileUrl = (filename) => {
  return `/uploads/${filename}`;
};