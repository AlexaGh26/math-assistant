import React from 'react';

const ExamplesBar = ({ onExampleClick }) => {
  const examples = [
    "¿Cómo se hace una suma con llevadas?",
    "¿Puedes explicarme la resta?",
    "¿Cómo funcionan las multiplicaciones?",
    "¿Cuánto es 25 + 38?",
    "¿Cuánto es 42 - 17?",
    "¿Cuánto es 6 × 7?",
    "Explícame las figuras geométricas"
  ];

  return (
    <div className="examples-bar">
      <div className="examples-label">Ejemplos de preguntas:</div>
      <div className="examples-container">
        {examples.map((example, index) => (
          <button
            key={index}
            className="example-button"
            onClick={() => onExampleClick(example)}
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExamplesBar; 