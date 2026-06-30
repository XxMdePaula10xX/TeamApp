import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { initAuthListener } from '@/store/authStore'
import './index.css'

// Inicia o listener de sessão do Firebase antes de renderizar.
initAuthListener()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)

// Remove a splash inicial (definida no index.html) com um fade suave.
const splash = document.getElementById('splash')
if (splash) {
  // Pequeno atraso garante o 1º paint do app antes do fade.
  setTimeout(() => {
    splash.classList.add('splash--hidden')
    splash.addEventListener('transitionend', () => splash.remove(), { once: true })
  }, 350)
}
