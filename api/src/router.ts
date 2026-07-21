import { type Request, type Response, Router } from "express"

import uploadMiddleware from "@/middlewares/upload-middleware"

import { GraphsController } from "@/controllers"

export const router = Router()

router.get("/", (_req: Request, res: Response) => {
  res.send("Hello World!")
})

router.post("/graphs/project", uploadMiddleware.array("files"), GraphsController.createProject)

export default router
