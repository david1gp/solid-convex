import { spawnSync } from "node:child_process"
import { resolve } from "node:path"
import { e2eBaseUrlGet } from "./config/e2eBaseUrlGet.ts"
import { e2eRunnerRun } from "./e2eRunnerRun.ts"

const targetArgument = process.argv[2]
if (targetArgument !== "production" && targetArgument !== "dev")
  throw new Error("Usage: bun e2e/e2eRun.ts <production|dev>")

const target: "production" | "dev" = targetArgument
const baseUrl = e2eBaseUrlGet(process.env, target)
const checkpointDirectory = "/tmp/opencode/solid-convex/e2e"

await e2eRunnerRun({
  target,
  baseUrl,
  checkpointDirectory,
  runSuite: async (suitePath, context) => {
    console.info(`E2E [${target}] ${suitePath}`)
    const result = spawnSync("bunx", ["rstest", "run", "--config", "e2e/rstest.config.ts", suitePath], {
      cwd: resolve("."),
      stdio: "inherit",
      env: {
        ...process.env,
        E2E_BASE_URL: context.baseUrl,
        E2E_TARGET: context.target,
        E2E_CHECKPOINT_PATH: context.checkpointPath,
        E2E_RUN_ID: context.runId,
      },
    })
    if (result.error) throw result.error
    if (result.status !== 0) throw new Error(`E2E suite failed (${result.status ?? result.signal}): ${suitePath}`)
  },
})
