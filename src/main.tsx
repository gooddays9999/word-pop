import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('未找到根节点 #root，页面无法启动')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
