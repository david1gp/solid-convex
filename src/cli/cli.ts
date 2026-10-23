type Route = { method: "GET" | "POST"; path: string }

const routes: Record<string, Route> = {
  "orgs.list": { method: "GET", path: "/api/orgs" },
  "orgs.get": { method: "GET", path: "/api/orgs/get" },
  "orgs.page": { method: "GET", path: "/api/orgs/page" },
  "orgs.handle-available": { method: "GET", path: "/api/orgs/handle-available" },
  "orgs.create": { method: "POST", path: "/api/orgs/create" },
  "orgs.update": { method: "POST", path: "/api/orgs/update" },
  "orgs.members.list": { method: "GET", path: "/api/orgs/members" },
  "orgs.members.get": { method: "GET", path: "/api/orgs/members/get" },
  "orgs.members.create": { method: "POST", path: "/api/orgs/members/create" },
  "orgs.members.update": { method: "POST", path: "/api/orgs/members/update" },
  "orgs.members.delete": { method: "POST", path: "/api/orgs/members/delete" },
  "orgs.leave": { method: "POST", path: "/api/orgs/leave" },
  "orgs.invites.list": { method: "GET", path: "/api/orgs/invites" },
  "orgs.invites.get": { method: "GET", path: "/api/orgs/invites/get" },
  "orgs.invites.initiate": { method: "POST", path: "/api/orgs/invites/initiate" },
  "orgs.invites.resend": { method: "POST", path: "/api/orgs/invites/resend" },
  "orgs.invites.accept": { method: "POST", path: "/api/orgs/invites/accept" },
  "orgs.invites.dismiss": { method: "POST", path: "/api/orgs/invites/dismiss" },
  "teams.list": { method: "GET", path: "/api/teams" },
  "teams.get": { method: "GET", path: "/api/teams/get" },
  "teams.create": { method: "POST", path: "/api/teams/create" },
  "teams.update": { method: "POST", path: "/api/teams/update" },
  "projects.list": { method: "GET", path: "/api/projects" },
  "projects.get": { method: "GET", path: "/api/projects/get" },
  "projects.create": { method: "POST", path: "/api/projects/create" },
  "projects.update": { method: "POST", path: "/api/projects/update" },
  "notes.list": { method: "GET", path: "/api/notes" },
  "notes.get": { method: "GET", path: "/api/notes/get" },
  "notes.create": { method: "POST", path: "/api/notes/create" },
  "notes.update": { method: "POST", path: "/api/notes/update" },
  "resources.list": { method: "GET", path: "/api/resources/list" },
  "resources.get": { method: "GET", path: "/api/resources/get" },
  "resources.delete-preview": { method: "GET", path: "/api/resources/delete-preview" },
  "resources.files": { method: "GET", path: "/api/resources/files" },
  "resources.create": { method: "POST", path: "/api/resources/create" },
  "resources.update": { method: "POST", path: "/api/resources/update" },
  "resources.delete": { method: "POST", path: "/api/resources/delete" },
  "resources.file-add": { method: "POST", path: "/api/resources/file-add" },
  "resources.file-remove": { method: "POST", path: "/api/resources/file-remove" },
  "files.list": { method: "GET", path: "/api/files/list" },
  "files.get": { method: "GET", path: "/api/files/get" },
  "files.create": { method: "POST", path: "/api/files/create" },
  "files.edit": { method: "POST", path: "/api/files/edit" },
  "files.delete": { method: "POST", path: "/api/files/delete" },
  "r2.upload-url": { method: "GET", path: "/api/r2/uploadUrl" },
  "keys.list": { method: "GET", path: "/api/keys" },
  "keys.create": { method: "POST", path: "/api/keys/create" },
  "keys.rename": { method: "POST", path: "/api/keys/rename" },
  "keys.revoke": { method: "POST", path: "/api/keys/revoke" },
  "keys.rotate": { method: "POST", path: "/api/keys/rotate" },
  "profile.update": { method: "POST", path: "/api/profile/update" },
  "password.change-request": { method: "POST", path: "/api/password/change-request" },
  "password.change-confirm": { method: "POST", path: "/api/password/change-confirm" },
  "email.change-request": { method: "POST", path: "/api/email/change-request" },
  "email.change-confirm": { method: "POST", path: "/api/email/change-confirm" },
}

function usage() {
  console.log(
    "Usage: bun run cli -- --baseUrl <api-base> --key <bearer-token> <command> [JSON object | --field value ...]\nExample: bun run cli -- --baseUrl http://localhost:3241 --key TOKEN orgs.list --orgHandle acme\nCommands: " +
      Object.keys(routes).join(", "),
  )
}

async function main() {
  const argv = process.argv.slice(2)
  if (argv.includes("--help") || argv.includes("-h")) {
    usage()
    return
  }
  let baseUrl = "",
    key = ""
  const args: string[] = []
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--baseUrl") baseUrl = argv[++i] ?? ""
    else if (argv[i] === "--key") key = argv[++i] ?? ""
    else args.push(argv[i]!)
  }
  const command = args.shift()
  if (!baseUrl || !key || !command || !routes[command]) {
    usage()
    process.stderr.write("Missing credentials or unknown command.\n")
    process.exitCode = 2
    return
  }
  let input: Record<string, unknown> = {}
  try {
    if (args[0]?.startsWith("{")) input = JSON.parse(args.shift()!)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`)
    process.exitCode = 2
    return
  }
  while (args.length) {
    const name = args.shift()!
    if (!name.startsWith("--")) {
      process.stderr.write(`Expected flag, got ${name}\n`)
      process.exitCode = 2
      return
    }
    const value = args.shift()
    if (value === undefined) {
      process.stderr.write(`Missing value for ${name}\n`)
      process.exitCode = 2
      return
    }
    input[name.slice(2)] = value
  }
  const route = routes[command]!
  const url = new URL(route.path, baseUrl)
  if (route.method === "GET")
    for (const [name, value] of Object.entries(input))
      url.searchParams.set(name, typeof value === "string" ? value : JSON.stringify(value))
  const headers = {
    Authorization: `Bearer ${key}`,
    ...(route.method === "POST" ? { "Content-Type": "application/json" } : {}),
  }
  const response = await fetch(url, {
    method: route.method,
    headers,
    ...(route.method === "POST" ? { body: JSON.stringify(input) } : {}),
  })
  const text = await response.text()
  let result: unknown
  try {
    result = text ? JSON.parse(text) : null
  } catch {
    result = text
  }
  if (!response.ok) {
    process.stderr.write(`${JSON.stringify(result)}\n`)
    process.exitCode = 1
    return
  }
  console.log(JSON.stringify(result, null, 2))
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : error}\n`)
  process.exitCode = 1
})
