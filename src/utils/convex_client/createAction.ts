import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server"
import { useContext } from "solid-js"
import { ConvexContext } from "./convexContext.js"

export function createAction<Action extends FunctionReference<"action">>(
  action: Action,
): (args: FunctionArgs<Action>) => Promise<Awaited<FunctionReturnType<Action>>> {
  const op = "createAction"
  const convex = useContext(ConvexContext)
  if (convex === undefined) {
    return () => Promise.reject(new Error(`${op}: No convex context`))
  }
  return (args) => {
    const fullArgs = args ?? {}
    return convex.action(action, fullArgs)
  }
}
