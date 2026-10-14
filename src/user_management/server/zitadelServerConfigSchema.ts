import * as v from "valibot"

export const zitadelServerConfigSchema = v.object({
  baseUrl: v.pipe(v.string(), v.url()),
  token: v.pipe(v.string(), v.minLength(1)),
  organizationId: v.pipe(v.string(), v.minLength(1)),
  projectId: v.pipe(v.string(), v.minLength(1)),
})

export type ZitadelServerConfig = v.InferOutput<typeof zitadelServerConfigSchema>
