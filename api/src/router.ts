import { type Request, type Response, Router } from "express"

export const router = Router()

router.get("/", (_req: Request, res: Response) => {
  res.send("Hello World!")
})

export default router
