import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server"
import { useContext } from "solid-js"
import { createResultError, type ResultErr } from "#result"
import { ConvexContext } from "./convexContext.js"

export function mutationCreate<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation,
): (args?: FunctionArgs<Mutation>) => Promise<FunctionReturnType<Mutation> | ResultErr> {
  const op = "mutationCreate"
  const convex = useContext(ConvexContext)
  if (convex === null) {
    const error = createResultError(op, "No convex context")
    return () => Promise.resolve(error)
  }
  return (args) => {
    const fullArgs = args ?? {}
    return convex.mutation(mutation, fullArgs)
  }
}
