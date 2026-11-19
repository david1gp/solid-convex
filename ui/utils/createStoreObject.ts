import { createStore, type StoreSetter } from "solid-js"

export function createStoreObject(
  store?: object | undefined,
  options?: { name?: string | undefined } | undefined,
): { get: object; set: StoreSetter<object> } {
  const [get, set] = createStore(store ?? {}, options)
  return { get, set }
}
