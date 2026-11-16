import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface AuthMiniHeroProps extends MayHaveClass {
  headerClass?: string
  subtitleClass?: string
}

export function AuthMiniHero(p: AuthMiniHeroProps) {
  return (
    <h1 class={cn("text-4xl font-bold max-w-5xl mx-auto", p.class)}>
      <span class="text-primary">Adaptive Convex Auth</span>
      <span>
        {" "}
        is a lightweight template for <span class="text-primary">Auth</span> built for{" "}
      </span>
      <span class="text-primary">Convex</span> and <span class="text-primary">Solid.js</span>
    </h1>
  )
}
