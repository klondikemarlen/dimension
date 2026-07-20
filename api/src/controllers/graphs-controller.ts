import { unlink } from "node:fs/promises"
import { type Request, type Response } from "express"

import createService from "@/services/graphs/create-service"

export async function create(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({
      message: "No file uploaded",
    })
    return
  }

  const uploadPath = req.file.path

  try {
    const graph = createService(uploadPath, req.file.originalname)

    res.json({
      graph,
    })
  } catch {
    res.status(422).json({
      message: "The source importer could not parse that file.",
    })
  } finally {
    await unlink(uploadPath).catch(() => undefined)
  }
}

export default {
  create,
}
