import { parse } from "dotenv"

const env = parse(await Bun.file(".env.preview").text())
const url = env.CONVEX_SELF_HOSTED_URL
if (
  !url ||
  new URL(url).hostname !== "solid-convex-backend.wonder1.de" ||
  !env.CONVEX_SELF_HOSTED_ADMIN_KEY ||
  env.CONVEX_DEPLOYMENT ||
  env.CONVEX_DEPLOY_KEY
) {
  console.error(
    "Preview Convex configuration must specify the isolated preview backend and admin key, without deployment selectors",
  )
  process.exit(1)
}
