import * as a from "valibot"
import { createResult, createResultError } from "#result"
import { type Language, languageDefault, languageSchema } from "#src/app/i18n/language.ts"
import { languageFromBrowser } from "#src/app/i18n/languageFromBrowser.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

const languageLocalStorageKey = "language"

export const languageSignal: SignalObject<Language> = createLanguageSignal()

function createLanguageSignal(): SignalObject<Language> {
  let hasLoaded = false
  const signal = createSignalObject<Language>(languageFromBrowser() ?? languageDefault)

  // Override get to from localStorage if not already loaded
  const signalGet = signal.get
  signal.get = () => {
    if (!hasLoaded) {
      const result = languageLoadFromLocalStorage()
      if (result.success) {
        signal.set(result.data)
      }
      hasLoaded = true
    }
    return signalGet()
  }

  // Override the set method to also save to localStorage
  const signalSet = signal.set
  signal.set = (value) => {
    const result = signalSet(value)
    languageSaveToLocalStorage(value)
    return result
  }

  return signal
}

export function languageLoadFromLocalStorage() {
  const op = "languageLoadFromLocalStorage"
  if (!localStorage) return createResultError(op, "localStorage not defined")
  const read = localStorage.getItem(languageLocalStorageKey)
  if (!read) return createResultError(op, "no language saved in localStorage")
  const parsing = a.safeParse(languageSchema, read)
  if (!parsing.success) {
    return createResultError(op, a.summarize(parsing.issues), read)
  }
  return createResult(parsing.output)
}

export function languageSaveToLocalStorage(language: Language) {
  if (!localStorage) return
  localStorage.setItem(languageLocalStorageKey, language)
}

import { onCleanup, onSettled as onMount } from "solid-js"

export function languageSignalRegisterHandler(signal = languageSignal) {
  function handleStorageEvent(event: StorageEvent) {
    if (event.key !== languageLocalStorageKey) return
    if (event.newValue == null) return
    const parsing = a.safeParse(languageSchema, event.newValue)
    if (parsing.success) {
      signal.set(parsing.output)
    }
  }
  onMount(() => {
    if (typeof window === "undefined") return
    window.addEventListener("storage", handleStorageEvent)
  })
  onCleanup(() => {
    if (typeof window === "undefined") return
    window.removeEventListener("storage", handleStorageEvent)
  })
}

//
//
//

export function languageSignalGet() {
  return languageSignal.get()
}
