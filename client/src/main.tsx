import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App.tsx'
import { logError } from './app/components/logError'
import './app/styles/index.css'

createRoot(document.getElementById('root')!, {
  onCaughtError: logError,
  onUncaughtError: logError,
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
