import React from "react"
import { createRoot } from "react-dom/client"
import "./styles/globals.css"
import Boss from "./boss"

const rootEl = document.getElementById("root")!
createRoot(rootEl).render(
  <React.StrictMode>
    <Boss />
  </React.StrictMode>
)

