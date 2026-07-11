import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles.css'

const hideSplashScreen = () => {
  const splash = document.getElementById('app-splash-screen')
  if (!splash) return

  splash.classList.add('app-splash-screen--hidden')
  window.setTimeout(() => splash.remove(), 450)
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
      return
    }

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister())
    }).catch(() => {})

    if ('caches' in window) {
      window.caches.keys().then((keys) => {
        keys.forEach((key) => window.caches.delete(key))
      }).catch(() => {})
    }
  })
}

if (document.readyState === 'complete') {
  hideSplashScreen()
} else {
  window.addEventListener('load', hideSplashScreen, { once: true })
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
