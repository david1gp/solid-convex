import { accessSync, constants, lstatSync, mkdirSync } from "node:fs"
import { userInfo } from "node:os"
import { join } from "node:path"

type Options = { sharedRoot?: string }

/**
 * Resolve a tmp root every local user can write without breaking leo's existing data.
 * Order: explicit `OPENCODE_TMP_ROOT` override, then the shared `/tmp/opencode`
 * while it exists and stays writable by the current user (leo keeps his behavior
 * and checkpoint data), otherwise a private `/tmp/<username>/opencode` (mode 0700).
 * The shared root is never created here: creating it would lock out every other user.
 */
export const opencodeTmpRootGet = (environment: NodeJS.ProcessEnv = process.env, options: Options = {}): string => {
  const override = environment.OPENCODE_TMP_ROOT?.trim()
  if (override) return override
  const sharedRoot = options.sharedRoot ?? "/tmp/opencode"
  if (tmpRootIsWritableDirectory(sharedRoot)) return sharedRoot
  const root = join("/tmp", tmpUserNameGet(environment), "opencode")
  mkdirSync(root, { recursive: true, mode: 0o700 })
  return root
}

const tmpRootIsWritableDirectory = (directory: string): boolean => {
  try {
    const stat = lstatSync(directory)
    if (!stat.isDirectory() || stat.isSymbolicLink()) return false
    accessSync(directory, constants.W_OK | constants.X_OK)
    return true
  } catch {
    return false
  }
}

const tmpUserNameGet = (environment: NodeJS.ProcessEnv): string => {
  const candidate = environment.USER ?? environment.LOGNAME
  if (candidate && /^[A-Za-z0-9._-]+$/u.test(candidate)) return candidate
  try {
    const name = userInfo().username
    if (name && /^[A-Za-z0-9._-]+$/u.test(name)) return name
  } catch {
    // Fall through to the uid-based name below.
  }
  const uid = typeof process.getuid === "function" ? process.getuid() : undefined
  return `user-${uid ?? "unknown"}`
}
