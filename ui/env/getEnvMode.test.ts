import { expect, test } from "bun:test"
import { getEnvMode } from "./getEnvMode.ts"

test("explicit preview mode wins over production build NODE_ENV", () => {
  const previous = { ...process.env }
  try {
    delete process.env.ENV_MODE
    process.env.NODE_ENV = "production"
    process.env.PUBLIC_ENV_MODE = "preview"
    expect(getEnvMode()).toBe("development")
    process.env.PUBLIC_ENV_MODE = "development"
    expect(getEnvMode()).toBe("development")
    process.env.PUBLIC_ENV_MODE = "production"
    expect(getEnvMode()).toBe("production")
  } finally {
    process.env.NODE_ENV = previous.NODE_ENV
    if (previous.PUBLIC_ENV_MODE === undefined) delete process.env.PUBLIC_ENV_MODE
    else process.env.PUBLIC_ENV_MODE = previous.PUBLIC_ENV_MODE
    if (previous.ENV_MODE === undefined) delete process.env.ENV_MODE
    else process.env.ENV_MODE = previous.ENV_MODE
  }
})
