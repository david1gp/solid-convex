import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server"
import { useContext } from "solid-js"
import { createResultError, type ResultErr } from "#result"
import { ConvexContext } from "./convexContext.js"

export function createAction<Action extends FunctionReference<"action">>(
  action: Action,
): (args: FunctionArgs<Action>) => Promise<Awaited<FunctionReturnType<Action>> | ResultErr> {
  const op = "createAction"
  const convex = useContext(ConvexContext)
  if (convex === null) {
    const error = createResultError(op, "No convex context")
    return () => Promise.resolve(error)
  }
  return (args) => {
    const fullArgs = args ?? {}
    return convex.action(action, fullArgs)
  }
}
