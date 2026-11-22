import solid from "@solidjs/vite-plugin"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "PUBLIC_")
  const appHosts = env.PUBLIC_BASE_URL_APP ? [new URL(env.PUBLIC_BASE_URL_APP).hostname] : []
  const port = Number(process.env.PORT) || 5173
  if (port === 3022) throw new Error("The preview port 3022 cannot be used by the Vite dev server")

  return {
    server: {
      port,
      strictPort: Boolean(process.env.PORT),
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
