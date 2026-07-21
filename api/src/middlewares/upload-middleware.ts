import multer from "multer"

export const uploadMiddleware = multer({
  dest: "uploads/",
  limits: {
    fileSize: 512 * 1024,
    files: 500,
    fieldSize: 2 * 1024 * 1024,
  },
})

export default uploadMiddleware
