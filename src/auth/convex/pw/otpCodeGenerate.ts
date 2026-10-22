export function otpCodeGenerate(): string {
  let otp = ""
  const randomBytes = crypto.getRandomValues(new Uint8Array(6))
  for (let i = 0; i < 6; i++) {
    const randomByte = randomBytes[i]!
    otp += (randomByte % 10).toString()
  }
  return otp
}
