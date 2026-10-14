import * as a from "valibot"

export const noteDataSchema = a.object({
  content: a.optional(a.string(), ""),
})

export type NoteData = a.InferOutput<typeof noteDataSchema>
