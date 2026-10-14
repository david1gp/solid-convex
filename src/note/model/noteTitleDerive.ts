export function noteTitleDerive(content: string): string {
  const lines = content.split(/\r?\n/)
  for (const rawLine of lines) {
    const trimmed = rawLine.trim()
    if (trimmed.length === 0) continue
    const stripped = trimmed.replace(/^#+\s*/, "").trim()
    if (stripped.length > 0) return stripped
  }
  return "Untitled"
}
