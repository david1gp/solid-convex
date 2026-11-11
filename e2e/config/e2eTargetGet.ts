export type E2eTarget = "dev" | "production"

export function e2eTargetParse(value: string | undefined): E2eTarget {
  const target = value?.trim()
  if (!target) {
    throw new Error(
      "E2E_TARGET is not set. Set E2E_TARGET to one of dev|production. There is no default environment.",
    )
  }
  if (target !== "dev" && target !== "production") {
    throw new Error(
      `Invalid E2E_TARGET ${JSON.stringify(target)}. Set E2E_TARGET to one of dev|production. There is no default environment.`,
    )
  }
  return target
}

export function e2eTargetGet(environment: Record<string, string | undefined>): E2eTarget {
  return e2eTargetParse(environment.E2E_TARGET)
}
