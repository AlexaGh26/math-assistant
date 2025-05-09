import React, { useState } from 'react';
import OperationButtons from './components/OperationButtons/index';
import NumberSelector from './components/NumberSelector/index';
import OperationResult from './components/OperationResult/index';
import ChatArea from './components/ChatArea/index';
import './App.css';
import { speak } from './services/speechService';

function App() {
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [operationResult, setOperationResult] = useState(null);
  const [showChat, setShowChat] = useState(false);

  // Función para manejar la selección de operación
  const handleSelectOperation = (operation) => {
    console.log('handleSelectOperation recibió:', operation);
    
    if (!operation || typeof operation !== 'object' || !operation.name) {
      console.error('Error: Operación inválida recibida', operation);
      return;
    }
    
    setSelectedOperation(operation);
    setOperationResult(null); // Resetear resultado al cambiar de operación
    
    // Proporcionar retroalimentación por voz con verificación adicional
    const operationName = operation.name || 'operación';
    speak(`Harás una ${operationName}. Ahora elige los números para realizar la operación.`);
  };

  // Función para manejar el cálculo
  const handleCalculate = (result) => {
    setOperationResult(result);
  };

  // Función para cambiar entre el modo práctica y el chat
  const toggleMode = () => {
    setShowChat(!showChat);
    setSelectedOperation(null);
    setOperationResult(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo-container">
          <span className="logo-icon">🧮</span>
          <h1 className="app-title">Mateo Matemático</h1>
        </div>
        <button className="mode-toggle" onClick={toggleMode}>
          {showChat ? '🔢 Modo Práctica' : '💬 Modo Chat'}
        </button>
      </header>

      <main className="app-main">
        {showChat ? (
          // Sección de Chat
          <div className="chat-section">
            <ChatArea />
          </div>
        ) : (
          // Sección de Práctica con Operaciones
          <div className="practice-section">
            <div className="operation-section-container">
              <OperationButtons onSelectOperation={handleSelectOperation} />
              
              {selectedOperation && (
                <div className="operation-area">
                  <NumberSelector 
                    operation={selectedOperation} 
                    onCalculate={handleCalculate} 
                  />
                </div>
              )}
            </div>
            
            {operationResult && (
              <div className="result-area">
                <OperationResult result={operationResult} />
              </div>
            )}
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
