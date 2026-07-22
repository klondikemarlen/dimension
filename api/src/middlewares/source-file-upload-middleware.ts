import multer from "multer"

export const sourceFileUploadMiddleware = multer({
  dest: "uploads/",
  limits: {
    fileSize: 512 * 1024,
    files: 1,
  },
})

export default sourceFileUploadMiddleware
