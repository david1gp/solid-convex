import { ConvexClient } from "convex/browser"
import { api } from "#convex/_generated/api.js"
import { createResult, createResultError, type PromiseResult, type Result } from "#result"
import { envBaseUrlConvexResult } from "#src/app/env/public/envBaseUrlConvexResult.ts"
import type { IdUser } from "#src/auth/convex/IdUser.ts"
import { userSessionGet, userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import type { IdFile } from "#src/file/convex/IdFile.ts"
import type { FileDataModel } from "#src/file/model/FileModel.ts"

let convexClientSingleton: ConvexClient | undefined

function clientGet(): ConvexClient | undefined {
  if (convexClientSingleton) return convexClientSingleton
  const envResult = envBaseUrlConvexResult()
  if (!envResult.success) return undefined
  try {
    convexClientSingleton = new ConvexClient(envResult.data)
    return convexClientSingleton
  } catch {
    return undefined
  }
}

export async function fileCreateClientMutation(data: FileDataModel): PromiseResult<IdFile> {
  const op = "fileCreateClientMutation"

  const token = userTokenGet()
  if (!token) {
    return createResultError(op, "Missing user token")
  }

  const session = userSessionGet()
  if (!session?.profile?.userId) {
    return createResultError(op, "Missing user session")
  }

  const client = clientGet()
  if (!client) {
    return createResultError(op, "Convex client unavailable")
  }

  try {
    const result = await client.mutation(api.file.fileCreateMutation, {
      token,
      userId: session.profile.userId as IdUser,
      username: session.profile.username,
      fileId: data.fileId,
      displayName: data.displayName,
      contentType: data.contentType,
      fileSize: data.fileSize,
      url: data.url,
      imageWidth: data.imageWidth,
      imageHeight: data.imageHeight,
      resourceId: data.resourceId,
      assignment: data.assignment,
    })

    return result as Result<IdFile>
  } catch (error) {
    return createResultError(op, "Convex mutation invocation failed", String(error))
  }
}
