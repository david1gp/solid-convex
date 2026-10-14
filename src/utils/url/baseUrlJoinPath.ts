export function baseUrlJoinPath(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/u, "")
  const normalizedPath = path.replace(/^\/+/u, "")
  if (!normalizedPath) return normalizedBase
  if (!normalizedBase) return normalizedPath
  return `${normalizedBase}/${normalizedPath}`
}
