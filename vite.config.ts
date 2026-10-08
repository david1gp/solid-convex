import { defineConfig, loadEnv } from "vite"
import solid from "vite-plugin-solid"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "PUBLIC_")
  const appHosts = env.PUBLIC_BASE_URL_APP ? [new URL(env.PUBLIC_BASE_URL_APP).hostname] : []

  return {
    server: {
      port: Number(process.env.PREVIEW_WEB_PORT ?? 3016),
      strictPort: true,
      watch: {
        ignored: ["**/.github/**", "**/data/**", "**/dist/**", "**/ops/**", "**/out/**", "**/docs/**", "**/test/**"],
      },
      allowedHosts: [...appHosts, "solid-convex.dev", "app.solid-convex.com"],
      fs: {
        // Allow serving files from one level up to the project root
        allow: [".."],
      },
    },
    plugins: [solid()],
    envPrefix: "PUBLIC_",
    define: {
      development: JSON.stringify("development"),
    },
    build: {
      chunkSizeWarningLimit: 1050,
      outDir: "out",
      assetsDir: "assets",
    },
  }
})
