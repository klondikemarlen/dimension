import { unlink } from "node:fs/promises"
import { type Request, type Response } from "express"

import { createProjectService, type ProjectSourceFile } from "@/services/graphs/create-service"

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
  createProject,
}
