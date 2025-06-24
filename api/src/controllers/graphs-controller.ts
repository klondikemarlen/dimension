import { type Request, type Response } from "express"

import createService from "@/services/graphs/create-service"

export async function create(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({
      message: "No file uploaded",
    })
    return
  }

  const graph = createService(req.file.path)

  res.json({
    graph,
  })
}

export default {
  create,
}
