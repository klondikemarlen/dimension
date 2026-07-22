import {
  projectFilesFromDirectory,
  projectFilesFromInput,
  projectNameForFiles,
  type LocalProjectFile,
  type ProjectDirectoryHandle,
} from "./project-folder-service.ts"

export type FolderSelection =
  | { kind: "selected"; rootName: string; files: LocalProjectFile[] }
  | { kind: "canceled" }
  | { kind: "unsupported" }
  | { kind: "failed"; message: string }
type NativeDirectoryPicker = () => Promise<ProjectDirectoryHandle>
export type FolderSelectionProgress = (rootName: string, fileCount: number) => void | Promise<void>

export function nativeDirectoryPicker(browserWindow: Window): NativeDirectoryPicker | undefined {
  const picker = (browserWindow as Window & { showDirectoryPicker?: NativeDirectoryPicker }).showDirectoryPicker

  return picker ? () => picker.call(browserWindow) : undefined
}

export async function selectNativeDirectory(
  picker: NativeDirectoryPicker,
  onProgress?: FolderSelectionProgress,
): Promise<FolderSelection> {
  try {
    const directory = await picker()
    await onProgress?.(directory.name, 0)
    const files = await projectFilesFromDirectory(directory, (fileCount) => onProgress?.(directory.name, fileCount))

    return { kind: "selected", rootName: directory.name, files }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return { kind: "canceled" }

    return {
      kind: "failed",
      message: error instanceof Error ? error.message : "Dimension could not open that local folder.",
    }
  }
}

export function selectionFromFolderInput(files: FileList | null): FolderSelection {
  if (!files?.length) return { kind: "canceled" }

  return {
    kind: "selected",
    rootName: projectNameForFiles(files),
    files: projectFilesFromInput(files),
  }
}

export function selectFolderInput(input: HTMLInputElement | undefined): Promise<FolderSelection> {
  if (!input) return Promise.resolve({ kind: "unsupported" })

  const { promise, resolve } = Promise.withResolvers<FolderSelection>()
  const settle = (selection: FolderSelection): void => {
    input.removeEventListener("change", changed)
    input.removeEventListener("cancel", canceled)
    input.value = ""
    resolve(selection)
  }
  const changed = (): void => settle(selectionFromFolderInput(input.files))
  const canceled = (): void => settle({ kind: "canceled" })

  input.addEventListener("change", changed)
  input.addEventListener("cancel", canceled)
  input.click()

  return promise
}
