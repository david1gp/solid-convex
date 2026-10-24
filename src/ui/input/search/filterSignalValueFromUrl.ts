import * as v from "valibot"

const filterValueSchema = v.pipe(v.string(), v.maxLength(500, "Only a max length of 500 is allowed"))

export function filterSignalValueFromUrl<T extends Record<string, string>>(defaultValue: T, url: URL): T {
  const filters: Partial<T> = {}

  Object.keys(defaultValue).forEach((key) => {
    const raw = url.searchParams.get(key)
    if (raw === null) return
    const parsed = v.safeParse(filterValueSchema, raw)
    if (!parsed.success) return
    filters[key as keyof T] = parsed.output as T[keyof T]
  })

  return { ...defaultValue, ...filters }
}
