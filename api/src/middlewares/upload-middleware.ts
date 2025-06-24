import multer from "multer"

export const uploadMiddleware = multer({
  dest: "uploads/",
})

export default uploadMiddleware
