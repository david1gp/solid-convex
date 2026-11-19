import { createEffect, createStore, type Store, type StoreSetter } from "solid-js"

export function createLocalStore<T extends object>(initState: T, storageKey: string): [Store<T>, StoreSetter<T>] {
  const [state, setState] = createStore<T>(initState as T extends Function ? never : T)
  if (localStorage[storageKey]) setState(() => JSON.parse(localStorage[storageKey]) as T)
  createEffect(
    () => JSON.stringify(state),
    (value) => {
      localStorage[storageKey] = value
    },
  )
  return [state, setState]
}
