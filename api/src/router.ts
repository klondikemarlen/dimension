import { type Request, type Response, Router } from "express"

import sourceFileUploadMiddleware from "@/middlewares/source-file-upload-middleware"

import { GraphsController } from "@/controllers"

export const router = Router()

router.get("/", (_req: Request, res: Response) => {
  res.send("Hello World!")
})

router.post("/graphs/source", sourceFileUploadMiddleware.single("file"), GraphsController.createSource)

export default router
