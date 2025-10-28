import create from "zustand"

type AgentStatus = "idle" | "running" | "success" | "error"

type AgentContext = {
  id?: string
  name?: string
  lastRunAt?: string
}

type AgentState = {
  status: AgentStatus
  context: AgentContext
  setStatus: (s: AgentStatus) => void
  setContext: (c: Partial<AgentContext>) => void
  run: () => Promise<void>
}

export const useAgentState = create<AgentState>((set, get) => ({
  status: "idle",
  context: {},
  setStatus: (s) => set({ status: s }),
  setContext: (c) => set({ context: { ...get().context, ...c } }),
  run: async () => {
    set({ status: "running" })
    try {
      await new Promise((res) => setTimeout(res, 1000))
      set({ status: "success", context: { ...get().context, lastRunAt: new Date().toISOString() } })
    } catch (e) {
      set({ status: "error" })
    }
  },
}))

