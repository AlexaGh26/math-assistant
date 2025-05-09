import React, { useState, useEffect } from 'react';
import OperationButtons from './components/OperationButtons/index';
import LearningSteps from './components/LearningSteps/index';
import ChatArea from './components/ChatArea/index';
import './App.css';
import { speak } from './services/speechService';
import { setGlobalVolume } from './services/audioService';

/**
 * Componente principal de la aplicación Mateo Matemático
 * Administra el estado y la lógica de la interfaz de usuario para el asistente de matemáticas
 * @returns {JSX.Element} Componente App
 */
function App() {
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [volume, setVolume] = useState(0.5);

  /**
   * Maneja la selección de una operación matemática
   * @param {Object} operation - Operación seleccionada con propiedades como name, symbol, etc.
   */
  const handleSelectOperation = (operation) => {
    if (!operation || typeof operation !== 'object' || !operation.name) {
      return;
    }
    
    setSelectedOperation(operation);
    
    const operationName = operation.name || 'operación';
    speak(`Has seleccionado ${operationName}. Vamos a aprender y practicar juntos.`);
  };

  /**
   * Alterna entre el modo práctica y el modo chat
   */
  const toggleMode = () => {
    setShowChat(!showChat);
    setSelectedOperation(null);
  };

  /**
   * Actualiza el volumen global cuando cambia el control
   */
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setGlobalVolume(newVolume);
  };

  // Establecer el volumen global al iniciar
  useEffect(() => {
    setGlobalVolume(volume);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo-container">
          <span className="logo-icon">🧮</span>
          <h1 className="app-title">Mateo Matemático</h1>
        </div>
        <div className="controls-container">
          <div className="volume-control">
            <label htmlFor="volume-slider">🔊</label>
            <input
              type="range"
              id="volume-slider"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
            />
          </div>
          <button className="mode-toggle" onClick={toggleMode}>
            {showChat ? '🔢 Modo Práctica' : '💬 Modo Chat'}
          </button>
        </div>
      </header>

      <main className="app-main">
        {showChat ? (
          <div className="chat-section">
            <ChatArea />
          </div>
        ) : (
          <div className="practice-section">
            <div className="operation-section-container">
              {!selectedOperation ? (
                <OperationButtons onSelectOperation={handleSelectOperation} />
              ) : (
                <div className="learning-area">
                  <div className="learning-header">
                    <h2 className="selected-operation-title" style={{ color: selectedOperation.color }}>
                      Aprendiendo: <span>{selectedOperation.name}</span>
                    </h2>
                    <button 
                      className="change-operation-button"
                      onClick={() => setSelectedOperation(null)}
                    >
                      Cambiar operación
                    </button>
                  </div>
                  <LearningSteps operation={selectedOperation} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Diseñado para ayudar a niños de primaria a aprender matemáticas de forma divertida e interactiva</p>
      </footer>
    </div>
  );
}

export default App;
