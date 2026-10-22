export async function passwordHashCreate(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)
  const saltBuffer = encoder.encode(salt)

  const key = await crypto.subtle.importKey("raw", passwordBuffer, { name: "PBKDF2" }, false, ["deriveBits"])

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100_000,
      hash: "SHA-256",
    },
    key,
    256,
  )

  const hashArray = Array.from(new Uint8Array(derivedBits))
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  return hash
}
