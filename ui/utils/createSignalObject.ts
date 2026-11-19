import { type Accessor, createSignal, type Setter } from "solid-js"

//
// https://www.reddit.com/r/solidjs/comments/17r9dgm/signal_gettersetter_naming_convention/
//

export type SetterSimplified<T> = (t: T) => void

export type SignalObject<T> = { get: Accessor<T>; set: SetterSimplified<T> }

/**
 * Solid 2: `createSignal(fn)` creates a *derived* (writable memo) signal and a setter
 * argument that is a function is treated as an updater. A plain value therefore uses a
 * plain signal; a function value is wrapped so it is stored, not invoked.
 */
export function createSignalObject<T>(v: T): SignalObject<T> {
  const [get, set] = typeof v === "function" ? createSignal<T>(() => v) : createSignal<T>(v as Exclude<T, Function>)
  const setValue = set as Setter<T>
  return { get, set: (value) => setValue(() => value) }
}
