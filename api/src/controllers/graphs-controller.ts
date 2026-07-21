import { unlink } from "node:fs/promises"
import { type Request, type Response } from "express"

import createService, { createProjectService, type ProjectSourceFile } from "@/services/graphs/create-service"

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

export async function createProject(req: Request, res: Response): Promise<void> {
  const uploadedFiles = Array.isArray(req.files) ? req.files : []
  const paths = parseStringArray(req.body.paths)
  const parsePaths = parseStringArray(req.body.parsePaths)
  const rootName = typeof req.body.rootName === "string" ? req.body.rootName : "Selected project"

  try {
    const parseFiles: ProjectSourceFile[] = uploadedFiles.map((file, index) => ({
      path: file.path,
      relativePath: parsePaths[index] ?? file.originalname,
      sourceName: parsePaths[index] ?? file.originalname,
    }))

    res.json({
      graph: createProjectService(rootName, paths, parseFiles),
    })
  } finally {
    await Promise.all(uploadedFiles.map((file) => unlink(file.path).catch(() => undefined)))
  }
}

function parseStringArray(value: unknown): string[] {
  if (typeof value !== "string") return []

  try {
    const parsedValue = JSON.parse(value) as unknown

    return Array.isArray(parsedValue) ? parsedValue.filter((item): item is string => typeof item === "string") : []
  } catch {
    return []
  }
}

export default {
  create,
  createProject,
}
