import { expect, test } from "bun:test"

test("Vite production build does not reject the preview port", async () => {
  const code = 'const c = (await import("./vite.config.ts")).default; c({mode:"production",command:"build"})'
  const child = Bun.spawn(["bun", "--no-env-file", "-e", code], {
    env: { ...process.env, PORT: "3022" },
    stdout: "ignore",
    stderr: "ignore",
  })
  expect(await child.exited).toBe(0)
})

for (const config of ["rsbuild", "vite"]) {
  for (const port of [undefined, "5555", "3022"]) {
    test(`${config} dev port ${port ?? "defaults"} resolves safely`, async () => {
      const code =
        config === "rsbuild"
          ? 'process.argv.push("dev"); const c = (await import("./rsbuild.config.ts")).default; console.log(JSON.stringify(c.server))'
          : 'const c = (await import("./vite.config.ts")).default; console.log(JSON.stringify(c({mode:"development",command:"serve"}).server))'
      const env = { ...process.env }
      delete env.PORT
      if (port) env.PORT = port
      const child = Bun.spawn(["bun", "--no-env-file", "-e", code], { env, stdout: "pipe", stderr: "pipe" })
      const output = await new Response(child.stdout).text()
      const status = await child.exited
      if (port === "3022") {
        expect(status).not.toBe(0)
        return
      }
      expect(status).toBe(0)
      const server = JSON.parse(output)
      expect(server.port).toBe(port ? Number(port) : 5173)
      expect(server.strictPort).toBe(Boolean(port))
    })
  }
}
