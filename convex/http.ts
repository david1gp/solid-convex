import { httpRouter } from "convex/server"
import { addHttpRoutesAuth } from "#src/auth/convex/addHttpRoutesAuth.ts"
import { createHonoDispatcher } from "#src/auth/convex/headers/createHonoDispatcher.ts"
import { createHonoHttpAction } from "#src/auth/convex/headers/createHonoHttpAction.ts"
import { addHttpRoutesR2 } from "#src/r2/convex/addHttpRoutesR2.ts"
import { addHttpRoutesResource } from "#src/resource/convex/addHttpRoutesResource.ts"
import { addHttpRoutesMcp } from "#src/mcp/addHttpRoutesMcp.ts"
import { addHttpRoutesApiOrgTeam } from "#src/api/addHttpRoutesApiOrgTeam.ts"
import { addHttpRoutesApiProjectNoteResourceFile } from "#src/api/addHttpRoutesApiProjectNoteResourceFile.ts"
import { addHttpRoutesApiKeysProfile } from "#src/api/addHttpRoutesApiKeysProfile.ts"

const http = httpRouter()
const dispatcher = createHonoDispatcher()

addHttpRoutesAuth(dispatcher)
addHttpRoutesResource(dispatcher)
addHttpRoutesR2(dispatcher)
addHttpRoutesMcp(dispatcher)
addHttpRoutesApiOrgTeam(dispatcher)
addHttpRoutesApiProjectNoteResourceFile(dispatcher)
addHttpRoutesApiKeysProfile(dispatcher)

const dispatcherAction = createHonoHttpAction(dispatcher)
for (const method of ["GET", "POST", "OPTIONS"] as const) {
  http.route({
    pathPrefix: "/",
    method,
    handler: dispatcherAction,
  })
}

export default http
