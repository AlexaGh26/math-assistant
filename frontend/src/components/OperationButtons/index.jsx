import React from 'react';
import './styles.css';

const OperationButtons = ({ onSelectOperation }) => {
  const operations = [
    { id: 'suma', name: 'Suma', symbol: '+', color: '#4CAF50', icon: '➕' },
    { id: 'resta', name: 'Resta', symbol: '-', color: '#FF5722', icon: '➖' },
    { id: 'multiplicacion', name: 'Multiplicación', symbol: '×', color: '#2196F3', icon: '✖️' },
    { id: 'division', name: 'División', symbol: '÷', color: '#9C27B0', icon: '➗' }
  ];

  const handleOperationSelect = (op) => {
    onSelectOperation(op);
  };

  return (
    <div className="operation-buttons-container">
      <h2 className="operation-title">Elige la operación matemática que quieres aprender</h2>
      <div className="operation-buttons">
        {operations.map((op) => (
          <button
            key={op.id}
            className="operation-button"
            style={{ backgroundColor: op.color }}
            onClick={() => handleOperationSelect(op)}
            aria-label={`Seleccionar operación ${op.name}`}
          >
            <span className="operation-icon">{op.icon}</span>
            <span className="operation-name">{op.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default OperationButtons; 