import { parse } from "dotenv"

// Use the directly declared dotenv dependency's default, Convex-compatible parser.
// stdin is UTF-8 key\0value\0 pairs; NUL is framing, not a value character.

function envPayloadEncode(input: string) {
  const op = "envPayloadEncode"
  const fail = (errorMessage: string) => ({ success: false as const, op, errorMessage })
  if (input === "") return { success: true as const, data: "" }
  if (!input.endsWith("\0")) return fail("Invalid environment pair framing")
  const fields = input.slice(0, -1).split("\0")
  if (fields.length % 2 !== 0) return fail("Invalid environment pair framing")

  const values = new Map<string, string>()
  for (let index = 0; index < fields.length; index += 2) {
    const key = fields[index]
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return fail("Invalid environment key")
    values.set(key, fields[index + 1]) // Match the old per-key loop's last write.
  }

  const lines: string[] = []
  for (const [key, value] of values) {
    const candidates = [`'${value}'`, `\`${value}\``, `"${value}"`, `"${value.replace(/\r/g, "\\r")}"`, value]
    const encoded = candidates.find((candidate) => {
      const parsed = parse(`${key}=${candidate}\n`)
      return Object.keys(parsed).length === 1 && Object.hasOwn(parsed, key) && parsed[key] === value
    })
    if (encoded === undefined) return fail(`Cannot encode environment key exactly: ${key}`)
    lines.push(`${key}=${encoded}\n`)
  }

  const payload = lines.join("")
  const parsed = parse(payload)
  if (
    Object.keys(parsed).length !== values.size ||
    [...values].some(([key, value]) => !Object.hasOwn(parsed, key) || parsed[key] !== value)
  ) {
    return fail("Environment payload failed exact round-trip validation")
  }
  return { success: true as const, data: payload }
}

let input: string
try {
  input = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(await Bun.stdin.arrayBuffer())
} catch {
  console.error("error: Cannot read environment pairs")
  process.exit(1)
}

const result = envPayloadEncode(input)
if (!result.success) {
  console.error(`error: ${result.errorMessage}`)
  process.exit(1)
}

// Validate every pair and the combined payload before emitting any bytes.
try {
  await Bun.write(Bun.stdout, result.data)
} catch {
  console.error("error: Cannot write environment payload")
  process.exit(1)
}
