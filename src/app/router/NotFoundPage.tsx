import { Link } from "@tanstack/solid-router"
import { SetPageTitle } from "#ui/static/meta/SetPageTitle.tsx"

export function NotFoundPage() {
  return (
    <main class="mx-auto flex max-w-xl flex-col gap-4 p-8">
      <SetPageTitle title="Not found · Solid Convex" />
      <h1 class="text-2xl font-semibold">Page not found</h1>
      <p>Sorry, we couldn't find the page you're looking for.</p>
      <Link to="/" class="underline">
        Go home
      </Link>
    </main>
  )
}
