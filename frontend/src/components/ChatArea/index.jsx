import React, { useState, useRef, useEffect } from 'react';
import { speak, stopSpeaking } from '../../services/speechService';
import { generateResponse, getAvailableModels } from '../../services/ollamaService';
import './styles.css';

const ChatArea = () => {
  const [messages, setMessages] = useState([
    { 
      sender: 'assistant', 
      text: '¡Hola! Soy Mateo Matemático. Puedes preguntarme cualquier duda sobre matemáticas o usar los botones de operaciones para practicar.' 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState([{ name: 'local', tag: 'local' }]); // Usar modelo local por defecto
  const [selectedModel, setSelectedModel] = useState('local');
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const availableModels = await getAvailableModels();
        if (availableModels && availableModels.length > 0) {
          setModels(availableModels);
          const defaultModel = availableModels.find(m => m.name === 'local') || availableModels[0];
          setSelectedModel(defaultModel.name);
          setIsBackendConnected(true);
        }
      } catch (error) {
        console.warn('No se pudieron cargar los modelos:', error);
        setIsBackendConnected(false);
      }
    };
    
    loadModels();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Detener la voz al desmontar
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    stopSpeaking();

    setMessages(prev => [...prev, { 
      sender: 'user', 
      text: inputText 
    }]);
    
    const userQuestion = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      // Contexto para la IA
      const contextPrompt = "Eres un asistente matemático educativo llamado Mateo Matemático, diseñado para ayudar a niños de primaria a aprender matemáticas de manera simple y divertida. ";
      
      // Generar respuesta
      const response = await generateResponse(contextPrompt + userQuestion, selectedModel);
      
      setMessages(prev => [...prev, { 
        sender: 'assistant', 
        text: response 
      }]);
      
      // Leer la respuesta en voz alta
      speak(response);
      
      // Marcar que pudimos conectar con éxito
      setIsBackendConnected(true);
    } catch (error) {
      console.error('Error al generar respuesta:', error);
      
      // Mensaje amigable para el usuario
      setMessages(prev => [...prev, { 
        sender: 'assistant', 
        text: 'Lo siento, tuve un problema para responder. Intentaré buscar una solución más simple a tu pregunta.' 
      }]);
      
      // Marcar que hubo problemas con el backend
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-area">
      <div className="chat-header">
        <h3>Chat con Mateo Matemático</h3>
        <div className="model-selector">
          <label>Modelo: </label>
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={isLoading}
          >
            {models.map(model => (
              <option key={model.name} value={model.name}>
                {model.name}
              </option>
            ))}
          </select>
          
          <span className={`connection-status ${isBackendConnected ? 'connected' : 'disconnected'}`}>
            {isBackendConnected ? '✓ Conectado' : '⚠ Modo local'}
          </span>
        </div>
      </div>
      
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <div className="message-bubble">
              {msg.text}
            </div>
            <div className="message-avatar">
              {msg.sender === 'assistant' ? '🤖' : '👧'}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-bubble loading">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
            <div className="message-avatar">🤖</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Haz una pregunta sobre matemáticas..."
          className="chat-input"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? 'Pensando...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
};

export default ChatArea; 