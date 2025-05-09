import React, { useState, useEffect, useRef } from 'react';
import './styles.css';

const NumberSelector = ({ operation, onCalculate }) => {
  const [firstNumber, setFirstNumber] = useState(null);
  const [secondNumber, setSecondNumber] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState(null);
  const prevOperationRef = useRef(null);
  
  useEffect(() => {
    if (prevOperationRef.current && prevOperationRef.current.id !== operation.id) {
      setIsResetting(true);
      
      setFirstNumber(null);
      setSecondNumber(null);
      
      setError(null);
      
      const timer = setTimeout(() => {
        setIsResetting(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    prevOperationRef.current = operation;
  }, [operation]);
  
  const numberOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  
  const validateSecondNumber = (num) => {
    if (operation.id === 'division' && num === 0) {
      return null;
    }
    return num;
  };

  const handleFirstNumberSelect = (num) => {
    setFirstNumber(firstNumber === num ? null : num);
  };

  const handleSecondNumberSelect = (num) => {
    const validatedNum = validateSecondNumber(num);
    setSecondNumber(secondNumber === num ? null : validatedNum);
  };

  const handleCalculate = () => {
    if (firstNumber === null || secondNumber === null) return;
    
    if (!operation || !operation.id) {
      setError('Error: Operación no válida');
      return;
    }
    
    let result;
    switch (operation.id) {
      case 'suma':
        result = firstNumber + secondNumber;
        break;
      case 'resta':
        result = firstNumber - secondNumber;
        break;
      case 'multiplicacion':
        result = firstNumber * secondNumber;
        break;
      case 'division':
        result = firstNumber / secondNumber;
        result = Number.isInteger(result) ? result : parseFloat(result.toFixed(2));
        break;
      default:
        result = 0;
    }
    
    let explanation = '';
    switch (operation.id) {
      case 'suma':
        explanation = `Para sumar ${firstNumber} y ${secondNumber}, juntamos ambas cantidades y obtenemos ${result}.`;
        break;
      case 'resta':
        explanation = `Para restar ${secondNumber} de ${firstNumber}, quitamos ${secondNumber} unidades de ${firstNumber} y nos quedan ${result}.`;
        break;
      case 'multiplicacion':
        explanation = `Para multiplicar ${firstNumber} por ${secondNumber}, sumamos ${secondNumber} veces el número ${firstNumber} y obtenemos ${result}.`;
        break;
      case 'division':
        explanation = `Para dividir ${firstNumber} entre ${secondNumber}, vemos cuántas veces cabe ${secondNumber} en ${firstNumber} y obtenemos ${result}.`;
        break;
      default:
        explanation = '';
    }
    
    const resultData = {
      firstNumber,
      secondNumber,
      operation,
      result,
      explanation
    };
    
    onCalculate(resultData);
  };

  const canCalculate = firstNumber !== null && secondNumber !== null;
  
  return (
    <div className="number-selector" style={{ borderColor: operation.color }}>
      <h3 className="number-selector-title">
        <span style={{ color: operation.color }}>{operation?.name || 'operación'}</span>
      </h3>
      
      {error && (
        <div className="error-message" style={{ borderColor: operation.color }}>
          {error}
        </div>
      )}
      
      <div className="number-selection-area">
        <div className="number-selectors-container">
          <div className="number-selector-column">
            <label className={isResetting ? 'resetting' : ''}>
              Primer Número: {firstNumber ? firstNumber : "Sin seleccionar"}
            </label>
            <div className="number-grid">
              {numberOptions.map((num) => (
                <button
                  key={`first-${num}`}
                  className={`number-button ${firstNumber === num ? 'selected' : ''} ${isResetting ? 'reset-animation' : ''}`}
                  onClick={() => handleFirstNumberSelect(num)}
                  style={firstNumber === num ? 
                    { backgroundColor: operation.color, color: 'white' } : 
                    { '--hover-color': operation.color }
                  }
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          
          <div className={`operation-symbol ${isResetting ? 'changing' : ''}`} style={{ color: operation.color }}>
            {operation.symbol}
          </div>
          
          <div className="number-selector-column">
            <label className={isResetting ? 'resetting' : ''}>
              Segundo Número: {secondNumber ? secondNumber : "Sin seleccionar"}
            </label>
            <div className="number-grid">
              {numberOptions.map((num) => (
                <button
                  key={`second-${num}`}
                  className={`number-button ${secondNumber === num ? 'selected' : ''} ${isResetting ? 'reset-animation' : ''}`}
                  onClick={() => handleSecondNumberSelect(num)}
                  disabled={operation.id === 'division' && num === 0}
                  style={secondNumber === num ? 
                    { backgroundColor: operation.color, color: 'white' } : 
                    { '--hover-color': operation.color }
                  }
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <button 
          className="calculate-button" 
          style={{ 
            backgroundColor: canCalculate ? operation.color : '#ccc',
            cursor: canCalculate ? 'pointer' : 'not-allowed'
          }}
          onClick={handleCalculate}
          disabled={!canCalculate}
        >
          Calcular
        </button>
      </div>
    </div>
  );
};

export default NumberSelector; 