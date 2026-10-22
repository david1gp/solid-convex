export function enableAuthworks(): boolean {
  return process.env.PUBLIC_AUTHWORKS_ENABLED === "true"
}
