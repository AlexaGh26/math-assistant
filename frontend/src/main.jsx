import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { preloadSounds } from './services/audioService.js'

/**
 * Prepara y carga los recursos de audio antes de iniciar la aplicación
 * para garantizar una experiencia fluida para los usuarios
 */
preloadSounds();

/**
 * Punto de entrada principal de la aplicación
 * Renderiza el componente App dentro de StrictMode para detectar problemas potenciales
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
