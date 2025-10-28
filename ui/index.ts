// Re-exports to enable `@soggy/ui` consumption

// styles
export * from "./components/Card"
export * from "./components/Button"
export * from "./components/IconButton"

// hooks
export * from "./hooks/useTheme"
export * from "./hooks/useAgentState"

// screens/widgets (optional convenience exports)
export { default as Boss } from "./boss" // ui/boss/index.tsx default export
// export { default as SpacedRepetitionCards } from "./widgets/spaced-repetition-cards" // default export

// widget registry (type-safe dynamic loader)
export * from "./widgets/types"
export { getWidget, listWidgets } from "./widgets/registry"
export { selectWidget } from "./widgets/selectWidget"
