import { rename, rm } from "node:fs/promises"

export async function previewDistSwap(current: string, next: string, backup: string) {
  await rm(backup, { recursive: true, force: true })
  let hadCurrent = false
  try {
    await rename(current, backup)
    hadCurrent = true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
  }
  try {
    await rename(next, current)
  } catch (error) {
    if (hadCurrent) await rename(backup, current)
    throw error
  }
  await rm(backup, { recursive: true, force: true })
}
