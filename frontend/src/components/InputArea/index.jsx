import React, { useState } from 'react';
import './styles.css';

const InputArea = ({ onSendQuestion }) => {
  const [question, setQuestion] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      onSendQuestion(question);
      setQuestion('');
    }
  };

  return (
    <div className="input-area">
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Escribe tu pregunta sobre matemáticas..."
          className="question-input"
          aria-label="Escribe tu pregunta"
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={!question.trim()}
          aria-label="Enviar pregunta"
        >
          Enviar
        </button>
      </form>
    </div>
  );
};

export default InputArea; 