import create from "zustand"

type ThemeMode = "dark" | "light" | "gradient"

type ThemeState = {
  mode: ThemeMode
  setMode: (m: ThemeMode) => void
  toggle: () => void
}

export const useTheme = create<ThemeState>((set, get) => ({
  mode: (typeof window !== "undefined" && (localStorage.getItem("ui:theme") as ThemeMode)) || "gradient",
  setMode: (m) => {
    if (typeof window !== "undefined") localStorage.setItem("ui:theme", m)
    set({ mode: m })
    applyMode(m)
  },
  toggle: () => {
    const next: ThemeMode = get().mode === "dark" ? "gradient" : get().mode === "gradient" ? "light" : "dark"
    if (typeof window !== "undefined") localStorage.setItem("ui:theme", next)
    set({ mode: next })
    applyMode(next)
  },
}))

function applyMode(mode: ThemeMode) {
  if (typeof document === "undefined") return
  const el = document.documentElement
  el.classList.toggle("dark", mode !== "light")
  if (mode === "gradient") {
    el.style.background = "linear-gradient(to bottom, #000000 0%, #1a0b47 100%)"
  } else if (mode === "dark") {
    el.style.background = "#000"
  } else {
    el.style.background = "#fff"
  }
}

