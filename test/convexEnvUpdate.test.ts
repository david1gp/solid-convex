import { afterEach, expect, test } from "bun:test"
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { parse } from "dotenv"

const root = resolve(import.meta.dir, "..")
const require = createRequire(import.meta.url)
const dotenvPath = require.resolve("dotenv")
const fixtures: string[] = []
const productionTarget =
  "CONVEX_SELF_HOSTED_URL=https://synthetic-target.invalid\nCONVEX_SELF_HOSTED_ADMIN_KEY=synthetic-admin-secret\n"
const excludedKeys = [
  "CONVEX_DEPLOY_KEY",
  "CONVEX_DEPLOYMENT",
  "CONVEX_DEPLOYMENT_TOKEN",
  "CONVEX_SELF_HOSTED_URL",
  "CONVEX_SELF_HOSTED_ADMIN_KEY",
  "CONVEX_SELF_HOSTED_EXTRA",
  ...["", "PUBLIC_", "NEXT_PUBLIC_", "VITE_", "REACT_APP_", "EXPO_PUBLIC_"].flatMap((prefix) => [
    `${prefix}CONVEX_URL`,
    `${prefix}CONVEX_SITE_URL`,
  ]),
]

afterEach(() => {
  for (const fixture of fixtures.splice(0)) rmSync(fixture, { recursive: true, force: true })
})

function fixtureCreate(contents: string, environment = "development", failure = "0") {
  const dir = mkdtempSync(join(tmpdir(), "adaptive-convex-env-test-"))
  fixtures.push(dir)
  mkdirSync(join(dir, "ops/convex"), { recursive: true })
  mkdirSync(join(dir, "bin"))
  mkdirSync(join(dir, "tmp"))
  symlinkSync(join(root, "node_modules"), join(dir, "node_modules"))
  for (const file of ["env_update.bash", "envPayloadEncode.ts"]) {
    copyFileSync(join(root, "ops/convex", file), join(dir, "ops/convex", file))
  }
  writeFileSync(join(dir, `.env.${environment}`), contents, { mode: 0o600 })
  writeFileSync(
    join(dir, "fakeConvex.cjs"),
    `
    const fs = require('node:fs');
    const { parse } = require(${JSON.stringify(dotenvPath)});
    const args = process.argv.slice(2);
    const record = { args };
    if (args[0] === 'env' && args[1] === 'set') {
      const path = args[args.indexOf('--from-file') + 1];
      record.uploadFile = path;
      record.mode = fs.statSync(path).mode & 0o777;
      record.payload = parse(fs.readFileSync(path, 'utf8'));
    }
    fs.appendFileSync(process.env.RECORDS, JSON.stringify(record) + '\\n');
    if (process.env.CLI_FAILURE !== '0') {
      console.log('synthetic-secret-from-cli');
      console.error('synthetic-secret-from-cli');
      process.exit(Number(process.env.CLI_FAILURE));
    }
  `,
  )
  writeFileSync(
    join(dir, "bin/bun"),
    `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$@" >> "$ARGUMENTS"
if [[ "$1" == convex ]]; then
  shift
  exec ${JSON.stringify(process.execPath)} "$FAKE_CLI" "$@"
fi
exec ${JSON.stringify(process.execPath)} "$@"
`,
    { mode: 0o700 },
  )
  const env = {
    ...process.env,
    PATH: `${join(dir, "bin")}:${process.env.PATH}`,
    TMPDIR: join(dir, "tmp"),
    FAKE_CLI: join(dir, "fakeConvex.cjs"),
    RECORDS: join(dir, "records"),
    ARGUMENTS: join(dir, "arguments"),
    CLI_FAILURE: failure,
  }
  return {
    dir,
    run: (target = environment) => {
      const result = Bun.spawnSync(["bash", join(dir, "ops/convex/env_update.bash"), target], { cwd: dir, env })
      return { code: result.exitCode, output: result.stdout.toString() + result.stderr.toString() }
    },
    records: () => {
      if (!readdirSync(dir).includes("records")) return []
      return readFileSync(join(dir, "records"), "utf8")
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line))
    },
    clean: () => expect(readdirSync(join(dir, "tmp"))).toEqual([]),
  }
}

test("uploads the existing parser's exact effective strings in one private, explicitly targeted development batch", () => {
  const fixture = fixtureCreate(
    [
      "# ignored",
      ...excludedKeys.map((key) => `${key}=synthetic-excluded-secret`),
      "INVALID-KEY=ignored",
      "not an assignment",
      "export EMPTY=",
      " SPACE = ' padded synthetic secret ' ",
      "HASH=tag#tail",
      "INLINE=plain # retained by the existing parser",
      "EQUALS=one=two",
      "SINGLE=can't",
      "BACKTICK=prefix'`suffix",
      'DOUBLE=say "yes"',
      String.raw`LITERAL=\n\r\t\path`,
      "MIXED=prefix'`\"suffix",
      "DUP=first",
      "DUP=last",
      "FINAL=without-final-newline",
    ].join("\n"),
  )
  const result = fixture.run()
  expect(result.code).toBe(0)
  const records = fixture.records()
  expect(records).toHaveLength(1)
  const record = records[0]
  expect(record.args).toEqual([
    "env",
    "set",
    "--force",
    "--from-file",
    record.uploadFile,
    `--env-file=${fixture.dir}/ops/convex/../../.env.development`,
  ])
  expect(record.mode).toBe(0o600)
  expect(record.payload).toEqual({
    EMPTY: "",
    SPACE: " padded synthetic secret ",
    HASH: "tag#tail",
    INLINE: "plain # retained by the existing parser",
    EQUALS: "one=two",
    SINGLE: "can't",
    BACKTICK: "prefix'`suffix",
    DOUBLE: 'say "yes"',
    LITERAL: String.raw`\n\r\t\path`,
    MIXED: "prefix'`\"suffix",
    DUP: "last",
    FINAL: "without-final-newline",
  })
  const argumentsLog = readFileSync(join(fixture.dir, "arguments"), "utf8")
  for (const value of ["synthetic-excluded-secret", ...Object.values(record.payload)]) {
    if (!value) continue
    expect(result.output).not.toContain(value)
    expect(argumentsLog).not.toContain(value)
  }
  fixture.clean()
})

test("production preflight succeeds before one explicitly production-targeted upload", () => {
  const fixture = fixtureCreate(`${productionTarget}VALUE=production-value\n`, "production")
  expect(fixture.run().code).toBe(0)
  const records = fixture.records()
  expect(records).toHaveLength(1)
  expect(records[0].args).toEqual([
    "env",
    "set",
    "--force",
    "--from-file",
    records[0].uploadFile,
    `--env-file=${fixture.dir}/ops/convex/../../.env.production`,
  ])
  expect(records[0].payload).toEqual({ VALUE: "production-value" })
  fixture.clean()
})

test("production retains non-empty URL and admin-key preflight before any Bun or Convex call", () => {
  for (const contents of [
    "VALUE=synthetic-secret\n",
    'CONVEX_SELF_HOSTED_URL=""\nCONVEX_SELF_HOSTED_ADMIN_KEY=synthetic-admin-secret\nVALUE=synthetic-secret\n',
    "CONVEX_SELF_HOSTED_URL=https://synthetic.invalid\nVALUE=synthetic-secret\n",
    "CONVEX_SELF_HOSTED_URL=https://synthetic.invalid\nCONVEX_SELF_HOSTED_ADMIN_KEY=''\nVALUE=synthetic-secret\n",
  ]) {
    const fixture = fixtureCreate(contents, "production")
    const result = fixture.run()
    expect(result.code).toBe(3)
    expect(result.output).toContain("must define a non-empty CONVEX_SELF_HOSTED_")
    expect(result.output).not.toContain("synthetic-secret")
    expect(result.output).not.toContain("synthetic-admin-secret")
    expect(fixture.records()).toEqual([])
    expect(readdirSync(fixture.dir)).not.toContain("arguments")
    fixture.clean()
  }
})

test("empty eligible sets for both supported targets succeed without running Bun or Convex", () => {
  for (const environment of ["development", "production"]) {
    const fixture = fixtureCreate(
      `${productionTarget}# comment\n${excludedKeys.map((key) => `${key}=excluded`).join("\n")}\n`,
      environment,
    )
    expect(fixture.run().code).toBe(0)
    expect(fixture.records()).toEqual([])
    expect(readdirSync(fixture.dir)).not.toContain("arguments")
    fixture.clean()
  }
})

test("unrepresentable strings fail before any remote call without partial payloads or value leakage", () => {
  const fixture = fixtureCreate('VALID=synthetic-first-secret\nUNSUPPORTED=" a\'`"#synthetic-secret "\n')
  const result = fixture.run()
  expect(result.code).not.toBe(0)
  expect(result.output).toContain("Cannot encode environment key exactly: UNSUPPORTED")
  expect(result.output).not.toContain("synthetic-secret")
  expect(result.output).not.toContain("synthetic-first-secret")
  expect(fixture.records()).toEqual([])
  fixture.clean()
})

test("only the last duplicate assignment must be encodable", () => {
  const fixture = fixtureCreate('DUP=" a\'`"#unsupported "\nDUP=last\n')
  expect(fixture.run().code).toBe(0)
  expect(fixture.records()[0].payload).toEqual({ DUP: "last" })
  fixture.clean()
})

test("CLI failure propagates its exit status, hides CLI output, and removes the payload", () => {
  const fixture = fixtureCreate("VALUE=synthetic-secret\n", "development", "23")
  const result = fixture.run()
  expect(result.code).toBe(23)
  expect(result.output).toContain("Convex env sync failed")
  expect(result.output).not.toContain("synthetic-secret")
  expect(fixture.records()).toHaveLength(1)
  const argumentsLog = readFileSync(join(fixture.dir, "arguments"), "utf8")
  expect(argumentsLog).not.toContain("synthetic-secret")
  fixture.clean()
})

test("missing files and unsupported targets fail without invoking Bun or Convex", () => {
  const fixture = fixtureCreate("VALUE=local\n")
  for (const target of ["", "invalid", "preview", "staging"]) expect(fixture.run(target).code).toBe(1)
  rmSync(join(fixture.dir, ".env.development"))
  expect(fixture.run().code).toBe(2)
  expect(fixture.records()).toEqual([])
  expect(readdirSync(fixture.dir)).not.toContain("arguments")
  fixture.clean()
})

test("the encoder validates complete stdin pairs before output, including multiline and malformed input", () => {
  const helper = join(root, "ops/convex/envPayloadEncode.ts")
  const encode = (input: string) =>
    Bun.spawnSync([process.execPath, helper], { stdin: Buffer.from(input), cwd: tmpdir() })
  const valid = encode("MULTILINE\0line one\nline two\0LITERAL\0\\n\\r\0CR\0a\rb\0CRLF\0a\r\nb\0")
  expect(valid.exitCode).toBe(0)
  expect(parse(valid.stdout.toString())).toEqual({
    MULTILINE: "line one\nline two",
    LITERAL: String.raw`\n\r`,
    CR: "a\rb",
    CRLF: "a\r\nb",
  })
  for (const input of [
    "KEY\0value",
    "KEY\0",
    "INVALID-KEY\0value\0",
    "GOOD\0valid\0BAD\0 a'`\"#secret \0",
    "GOOD\0valid\0BAD\0apostrophe ' plus backtick ` plus # and literal \\n\0",
  ]) {
    const invalid = encode(input)
    expect(invalid.exitCode).not.toBe(0)
    expect(invalid.stdout.toString()).toBe("")
    expect(invalid.stderr.toString()).not.toContain("#secret")
  }
  expect(encode("").exitCode).toBe(0)
  expect(encode("").stdout.toString()).toBe("")
})
