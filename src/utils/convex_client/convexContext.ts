import type { ConvexClient } from "convex/browser"
import { type Context, createContext } from "solid-js"

export const ConvexContext: Context<ConvexClient | null> = createContext<ConvexClient | null>(null)
