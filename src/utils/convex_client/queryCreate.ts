import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server"
import { type Accessor, createRenderEffect, createSignal, useContext } from "solid-js"
import { createResultError, type ResultErr } from "#result"
import { ConvexContext } from "./convexContext.js"

type QueryArgs<Query extends FunctionReference<"query">> =
  | FunctionArgs<Query>
  | "skip"
  | undefined
  | Accessor<FunctionArgs<Query> | "skip" | undefined>
type QueryResult<Query extends FunctionReference<"query">> = FunctionReturnType<Query> | ResultErr | undefined

export function queryCreate<Query extends FunctionReference<"query">>(
  query: Query,
  ...argsRest: [args?: QueryArgs<Query>]
): () => QueryResult<Query> {
  const op = "queryCreate"
  const convex = useContext(ConvexContext)
  if (convex === null) {
    const error = createResultError(op, "No convex context")
    return () => error
  }

  const rawArgs = argsRest.length > 0 ? argsRest[0] : ({} as FunctionArgs<Query>)
  const [result, setResult] = createSignal<QueryResult<Query>>(undefined, { equals: false })
  let subscriptionId = 0
  const getArgs: Accessor<FunctionArgs<Query> | "skip" | undefined> =
    typeof rawArgs === "function" ? (rawArgs as Accessor<FunctionArgs<Query> | "skip" | undefined>) : () => rawArgs

  // Subscribe immediately, but avoid writes during the initial owned render.
  createRenderEffect(
    () => getArgs(),
    (fullArgs) => {
      const currentSubscriptionId = ++subscriptionId
      if (currentSubscriptionId > 1) setResult(undefined)
      if (fullArgs === undefined || fullArgs === "skip") {
        return
      }
      let subscribing = true
      const deliver = (value: QueryResult<Query>) => {
        const apply = () => {
          if (currentSubscriptionId === subscriptionId) setResult(value)
        }
        if (subscribing) queueMicrotask(apply)
        else apply()
      }
      const unsubscriber = convex.onUpdate(
        query,
        fullArgs,
        (nextResult) => {
          deliver(nextResult)
        },
        (error) => {
          const message = error instanceof Error ? error.message : String(error)
          deliver(createResultError(op, message))
        },
      )
      subscribing = false
      return () => {
        if (currentSubscriptionId === subscriptionId) subscriptionId += 1
        unsubscriber()
      }
    },
  )

  return result
}
