import React from 'react';
import './styles.css';

// Componente principal de visualización matemática
const MathVisualization = ({ data }) => {
  if (!data) {
    return (
      <div className="empty-visualization">
        <div className="visualization-placeholder">
          <p>Haz una pregunta sobre matemáticas para ver una visualización</p>
          <p className="placeholder-examples">Ejemplos: sumas, restas, multiplicaciones</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="math-visualization">
      <div className="visual-container">
        <h3>{data.title || 'Visualización'}</h3>
        <div className="visualization-canvas">
          <p>Visualización de {data.type}</p>
          <p>{data.num1} {data.operation} {data.num2} = {data.result}</p>
        </div>
      </div>
    </div>
  );
};

export default MathVisualization; 