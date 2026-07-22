import { unlink } from "node:fs/promises"
import { type Request, type Response } from "express"

import { createService } from "@/services/graphs/create-service"

export async function createSource(req: Request, res: Response): Promise<void> {
  const sourceFile = req.file

  if (!sourceFile) {
    res.status(400).json({ message: "A source file is required." })
    return
  }

  try {
    res.json({
      graph: createService(sourceFile.path, sourceFile.originalname),
    })
  } finally {
    await unlink(sourceFile.path).catch(() => undefined)
  }
}

export default {
  createSource,
}
