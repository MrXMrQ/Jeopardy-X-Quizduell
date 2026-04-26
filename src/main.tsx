import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Hier wird die Brücke zur index.html geschlagen (Element mit ID 'root')
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)