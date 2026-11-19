import { defineConfig, loadEnv } from "vite"
import solid from "@solidjs/vite-plugin"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "PUBLIC_")
  const appHosts = env.PUBLIC_BASE_URL_APP ? [new URL(env.PUBLIC_BASE_URL_APP).hostname] : []

  return {
    server: {
      // PORT (set by managed units and dev leases), then the legacy
      // PREVIEW_WEB_PORT, then the local default. strictPort only when a
      // port was explicitly configured, so default dev never takes the
      // preview's port.
      port: Number(process.env.PORT ?? process.env.PREVIEW_WEB_PORT) || 5173,
      strictPort: Boolean(process.env.PORT ?? process.env.PREVIEW_WEB_PORT),
      host: process.env.HOST || true,
      watch: {
        ignored: ["**/.github/**", "**/data/**", "**/dist/**", "**/ops/**", "**/out/**", "**/docs/**", "**/test/**"],
      },
      allowedHosts: [
        ...appHosts,
        "localhost",
        ...(process.env.DEV_ALLOWED_HOSTS?.split(",") ?? []),
        ...(process.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS?.split(",") ?? []),
      ]
        .map((host) => host.trim())
        .filter(Boolean),
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
