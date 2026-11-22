import { defineConfig } from "@rsbuild/core"
import { pluginBabel } from "@rsbuild/plugin-babel"
import { pluginSolid } from "@rsbuild/plugin-solid"

const publicEnvNames = [
  "PUBLIC_ENV_MODE",
  "PUBLIC_BASE_URL_SITE",
  "PUBLIC_BASE_URL_APP",
  "PUBLIC_BASE_URL_API",
  "PUBLIC_BASE_URL_CONVEX",
  "PUBLIC_BASE_URL_R2",
  "PUBLIC_OIDC_ENABLED",
  "PUBLIC_OIDC_LABEL",
  "PUBLIC_AUTHWORKS_ENABLED",
  "PUBLIC_AUTHWORKS_LABEL",
  "PUBLIC_GITHUB_CLIENT_ID",
  "PUBLIC_GOOGLE_CLIENT_ID",
  "PUBLIC_MICROSOFT_CLIENT_ID",
  "PUBLIC_POSTHOG_APP_ID",
] as const

const publicProcessEnvDefines = Object.fromEntries(
  publicEnvNames.map((name) => [`process.env.${name}`, JSON.stringify(process.env[name]) ?? "undefined"]),
)

const appHosts = process.env.PUBLIC_BASE_URL_APP ? [new URL(process.env.PUBLIC_BASE_URL_APP).hostname] : []

const portOption =
  process.argv.find((arg) => arg.startsWith("--port="))?.slice(7) ??
  (process.argv.includes("--port") ? process.argv[process.argv.indexOf("--port") + 1] : undefined)
if (process.argv.includes("dev") && Number(portOption ?? process.env.PORT) === 3022) {
  throw new Error("Port 3022 is reserved for preview; choose a different dev PORT")
}

export default defineConfig({
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: Boolean(process.env.PORT),
    host: process.env.HOST || true,
    allowedHosts: [
      "localhost",
      ...appHosts,
      ...(process.env.DEV_ALLOWED_HOSTS?.split(",") ?? []),
      ...(process.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS?.split(",") ?? []),
    ]
      .map((host) => host.trim())
      .filter(Boolean),
  },
  html: {
    template: "./rsbuild.html",
  },
  source: {
    entry: {
      index: "./src/index.tsx",
    },
    define: {
      // Expose PUBLIC_ env vars manually
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
      "import.meta.env.MODE": JSON.stringify(process.env.NODE_ENV),
      "import.meta.env.PUBLIC_ENV_MODE": JSON.stringify(process.env.PUBLIC_ENV_MODE),
      "import.meta.env.PUBLIC_BASE_URL_SITE": JSON.stringify(process.env.PUBLIC_BASE_URL_SITE),
      "import.meta.env.PUBLIC_BASE_URL_APP": JSON.stringify(process.env.PUBLIC_BASE_URL_APP),
      "import.meta.env.PUBLIC_BASE_URL_CONVEX": JSON.stringify(process.env.PUBLIC_BASE_URL_CONVEX),
      "import.meta.env.PUBLIC_BASE_URL_API": JSON.stringify(process.env.PUBLIC_BASE_URL_API),
      ...publicProcessEnvDefines,
      "import.meta.env.PUBLIC_GITHUB_CLIENT_ID": JSON.stringify(process.env.PUBLIC_GITHUB_CLIENT_ID),
      "import.meta.env.PUBLIC_GOOGLE_CLIENT_ID": JSON.stringify(process.env.PUBLIC_GOOGLE_CLIENT_ID),
      "import.meta.env.PUBLIC_MICROSOFT_CLIENT_ID": JSON.stringify(process.env.PUBLIC_MICROSOFT_CLIENT_ID),
      "import.meta.env.PUBLIC_B2_OBJECT_STORAGE_DOWNLOAD_URL": JSON.stringify(
        process.env.PUBLIC_B2_OBJECT_STORAGE_DOWNLOAD_URL,
      ),
      "import.meta.env.PUBLIC_POSTHOG_APP_ID": JSON.stringify(process.env.PUBLIC_POSTHOG_APP_ID),
    },
  },
  plugins: [
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
    }),
    pluginSolid({ solid: { moduleName: "@solidjs/web" } }),
  ],
  output: {
    distPath: {
      root: process.env.PREVIEW_BUILD_DIST || "dist",
      html: "",
      js: "assets",
      css: "assets",
      assets: "assets",
      media: "assets",
    },
    target: "web",
    overrideBrowserslist: ["last 2 versions", "not dead"],
    filename: {
      js: "[name].[contenthash:8].js",
    },
  },
  //
  // Rslib v0.4 introduces bundleless mode to preserve the source file structure:
  // https://x.com/rspack_dev/status/1889184235258548634
  //
  // lib: [
  //   {
  //     format: 'esm',
  //     bundle: false,
  //     dts: true,
  //     output: {
  //       distPath: {
  //         root: './dist/esm',
  //       },
  //     },
  //   },
  // ],
  performance: {
    // https://rsbuild.dev/config/performance/bundle-analyze
    // bundleAnalyze: {
    //   analyzerMode: "static",
    //   generateStatsFile: true,
    //   openAnalyzer: true,
    // },
    chunkSplit: {
      strategy: "split-by-experience",
      forceSplitting: {
        "@adaptive-ds/mdi": /node_modules[\\/]@adaptive-ds[\\/]mdi/,
        cn: /node_modules[\\/]cn/,
        "posthog-js": /node_modules[\\/]posthog-js/,
      },
    },
  },
})
