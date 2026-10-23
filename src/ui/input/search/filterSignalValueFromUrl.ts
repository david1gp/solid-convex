export function filterSignalValueFromUrl<T extends Record<string, string>>(defaultValue: T, url: URL): T {
  const filters: Partial<T> = {}

  Object.keys(defaultValue).forEach((key) => {
    const value = url.searchParams.get(key)
    if (value !== null) {
      filters[key as keyof T] = value as T[keyof T]
    }
  })

  return { ...defaultValue, ...filters }
}
