import React, { useState, useEffect } from 'react';
import { speak, stopSpeaking } from '../../services/speechService';
import { playSound } from '../../services/audioService';
import NumberSelector from '../NumberSelector';
import OperationResult from '../OperationResult';
import './styles.css';

const LearningSteps = ({ operation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [operationResult, setOperationResult] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [practiceNumbers, setPracticeNumbers] = useState({ first: null, second: null });
  const [showVideo, setShowVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => {
    if (currentStep === 2) {
      generatePracticeQuestion();
    }
  }, [currentStep]);

  const handleCalculate = (result) => {
    setOperationResult(result);
  };

  const generatePracticeQuestion = () => {
    const max = 10;
    let first = Math.floor(Math.random() * max) + 1;
    let second = Math.floor(Math.random() * max) + 1;
    
    // Para la división, asegurarse de que sea divisible exactamente
    if (operation.id === 'division') {
      second = Math.min(second, 5); // Limitar divisor para que sea más sencillo
      first = second * (Math.floor(Math.random() * 3) + 1); // Multiplicar para que sea divisible
    }
    
    // Para la resta, asegurarse de que el resultado no sea negativo
    if (operation.id === 'resta') {
      if (second > first) {
        [first, second] = [second, first]; // Intercambiar si second > first
      }
    }
    
    // Establecer los nuevos números primero
    setPracticeNumbers({ first, second });
    
    // Usar setTimeout para asegurar que los números se actualicen antes de generar el mensaje
    setTimeout(() => {
      // Crear mensaje específico según el tipo de operación
      let mensaje = '';
      switch (operation.id) {
        case 'suma':
          mensaje = `¿Cuánto es ${first} más ${second}? ¡Usa tus deditos para contar!`;
          break;
        case 'resta':
          mensaje = `¿Cuánto es ${first} menos ${second}? ¡Puedes dibujar circulitos y tachar!`;
          break;
        case 'multiplicacion':
          mensaje = `¿Cuánto es ${first} por ${second}? ¡Piensa en ${first} grupos de ${second}!`;
          break;
        case 'division':
          mensaje = `¿Cuánto es ${first} entre ${second}? ¡Imagina repartir ${first} objetos en ${second} grupos iguales! Si te ayuda, puedes dibujar círculos o usar tarjetitas.`;
          break;
        default:
          mensaje = `¿Cuánto es ${first} ${operation.symbol} ${second}?`;
      }
      
      console.log("Reproduciendo mensaje de pregunta:", mensaje);
      speak(mensaje);
    }, 100);
  };

  const calculateExpectedResult = () => {
    const { first, second } = practiceNumbers;
    switch (operation.id) {
      case 'suma':
        return first + second;
      case 'resta':
        return first - second;
      case 'multiplicacion':
        return first * second;
      case 'division':
        return first / second;
      default:
        return 0;
    }
  };

  const handleSubmitAnswer = () => {
    const expectedResult = calculateExpectedResult();
    const userNumAnswer = Number(userAnswer);
    
    if (userNumAnswer === expectedResult) {
      setIsCorrect(true);
      
      // Primero reproducir el sonido de victoria
      console.log("Reproduciendo sonido de victoria");
      playSound('SUCCESS', 0.4, 1.0);
      
      // Esperar un momento más largo y luego decir el resultado con la voz infantil
      setTimeout(() => {
        let mensaje = '';
        switch (operation.id) {
          case 'suma':
            mensaje = `¡Yupi! ¡Lo has logrado! ${practiceNumbers.first} más ${practiceNumbers.second} es igual a ${expectedResult}. ¡Eres super inteligente! ¡Vamos a celebrar!`;
            break;
          case 'resta':
            mensaje = `¡Bravo! ¡Correcto! ${practiceNumbers.first} menos ${practiceNumbers.second} es igual a ${expectedResult}. ¡Qué bien lo has hecho! ¡Eres un campeón!`;
            break;
          case 'multiplicacion':
            mensaje = `¡Genial! ¡Acertaste! ${practiceNumbers.first} multiplicado por ${practiceNumbers.second} es igual a ${expectedResult}. ¡Qué inteligente eres!`;
            break;
          case 'division':
            mensaje = `¡Fabuloso! ¡Has acertado! ${practiceNumbers.first} dividido entre ${practiceNumbers.second} es igual a ${expectedResult}. ¡Eres un pequeño matemático!`;
            break;
          default:
            mensaje = `¡Yupi! ¡Lo has logrado! El resultado es ${expectedResult}. ¡Eres super inteligente! ¡Vamos a celebrar!`;
        }
        console.log("Reproduciendo mensaje de celebración:", mensaje);
        speak(mensaje);
      }, 1200); // Aumentar a 1200ms para asegurar que el sonido termine
      
    } else {
      setIsCorrect(false);
      playSound('SUBTRACT', 0.4, 0.8);
      setAttempts(prev => prev + 1);
      
      // Esperar un poco antes de reproducir el mensaje de error
      setTimeout(() => {
        if (attempts === 0) {
          let mensaje = '';
          switch (operation.id) {
            case 'suma':
              mensaje = `¡Uy! Intenta de nuevo amiguito. Puedes usar tus deditos para contar ${practiceNumbers.first} ${operation.symbol} ${practiceNumbers.second}. ¡Tú puedes hacerlo!`;
              break;
            case 'resta':
              mensaje = `¡Uy! Intenta de nuevo amiguito. Puedes usar tus deditos para contar ${practiceNumbers.first} ${operation.symbol} ${practiceNumbers.second}. ¡Tú puedes hacerlo!`;
              break;
            case 'multiplicacion':
              mensaje = `¡Uy! Intenta de nuevo amiguito. Puedes usar tus deditos para contar ${practiceNumbers.first} ${operation.symbol} ${practiceNumbers.second}. ¡Tú puedes hacerlo!`;
              break;
            case 'division':
              mensaje = `¡Uy! Intenta de nuevo amiguito. Para la división ${practiceNumbers.first} ${operation.symbol} ${practiceNumbers.second}, puedes dibujar ${practiceNumbers.first} círculos y repartirlos en ${practiceNumbers.second} grupos iguales. También puedes usar tarjetitas o fichas para repartirlas. ¡Tú puedes hacerlo!`;
              break;
            default:
              mensaje = `¡Uy! Intenta de nuevo amiguito. Puedes usar tus deditos para contar ${practiceNumbers.first} ${operation.symbol} ${practiceNumbers.second}. ¡Tú puedes hacerlo!`;
          }
          console.log("Reproduciendo mensaje de error:", mensaje);
          speak(mensaje);
        } else {
          // Mostrar video después del segundo intento fallido
          const mensaje = '¡No te preocupes! Vamos a ver un video divertido que te ayudará a entender mejor. ¡Préstale mucha atención!';
          console.log("Reproduciendo mensaje de video:", mensaje);
          findHelpVideo();
          setShowVideo(true);
        }
      }, 500);
    }
  };

  const goToNextStep = () => {
    setCurrentStep(prev => prev + 1);
    setUserAnswer('');
    setIsCorrect(null);
    setAttempts(0);
    
    // Esperar a que se actualice el estado antes de hablar
    setTimeout(() => {
      if (currentStep === 1) {
        const mensaje = '¡Ahora es tu turno amiguito! Vamos a practicar juntos. ¡Resuelve este ejercicio y diviértete!';
        console.log("Reproduciendo mensaje de siguiente paso:", mensaje);
        speak(mensaje);
      }
    }, 100);
  };

  const resetStep = () => {
    setUserAnswer('');
    setIsCorrect(null);
    
    // Primero generar nueva pregunta
    generatePracticeQuestion();
    
    // Esperar a que se actualice el estado antes de hablar
    setTimeout(() => {
      const mensaje = '¡Vamos con otro ejercicio! ¡Tú puedes resolverlo!';
      console.log("Reproduciendo mensaje de reinicio:", mensaje);
      speak(mensaje);
    }, 500); // Esperar más tiempo para no superponerse con el mensaje de la nueva pregunta
  };

  const findHelpVideo = () => {
    // URLs de videos educativos según la operación 
    const videoIds = {
      suma: '8m4TyXgteZs',
      resta: 'dxBUiU0J9sg',
      multiplicacion: 'WES-u3UPDRA',
      division: 'g1zna75Ph-c'
    };
    
    // Obtener el ID del video según la operación
    const videoId = videoIds[operation.id] || videoIds.suma;
    
    // Construir la URL de embed correcta
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    console.log("URL de embed generada:", embedUrl);
    
    setVideoUrl(embedUrl);
  };

  // Función para volver a la pantalla de inicio (selección de operaciones)
  const goToHome = () => {
    // Esta función es solo un placeholder que se conectará con el App
    // Para volver al inicio, se simula un clic en "Cambiar operación"
    const changeOperationButton = document.querySelector('.change-operation-button');
    if (changeOperationButton) {
      changeOperationButton.click();
      
      // Reproducir mensaje de voz para el usuario
      setTimeout(() => {
        speak('¡Volviendo a la pantalla de inicio! Puedes elegir otra operación para practicar.');
      }, 100);
    }
  };

  const renderPracticeQuestion = () => {
    if (operation.id === 'division') {
      return (
        <div className="division-layout">
          <div className="division-problem">
            <div className="practice-question">
              <span className="practice-number">{practiceNumbers.first}</span>
              <span className="practice-symbol">{operation.symbol}</span>
              <span className="practice-number">{practiceNumbers.second}</span>
              <span className="practice-equals">=</span>
              <input
                type="number"
                className="practice-input"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="?"
              />
            </div>
          </div>
          <div className="division-visualization">
            <div className="division-cake">
              {/* Representación visual de la torta dividida */}
              {Array.from({ length: practiceNumbers.second }, (_, i) => (
                <div key={i} className="cake-slice">
                  {Array.from({ length: Math.floor(practiceNumbers.first / practiceNumbers.second) }, (_, j) => (
                    <div key={j} className="cake-piece"></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="practice-question">
        <span className="practice-number">{practiceNumbers.first}</span>
        <span className="practice-symbol">{operation.symbol}</span>
        <span className="practice-number">{practiceNumbers.second}</span>
        <span className="practice-equals">=</span>
        <input
          type="number"
          className="practice-input"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="?"
        />
      </div>
    );
  };

  return (
    <div className="learning-steps-container">
      <div className="step-indicator">
        <div className={`step ${currentStep === 1 ? 'active' : ''}`}>1. Visualización</div>
        <div className="step-arrow">➡️</div>
        <div className={`step ${currentStep === 2 ? 'active' : ''}`}>2. Práctica</div>
      </div>
      
      {currentStep === 1 && (
        <div className="step-content">
          <NumberSelector 
            operation={operation} 
            onCalculate={handleCalculate} 
          />
          
          {operationResult && (
            <>
              <div className="result-area">
                <OperationResult result={operationResult} />
              </div>
              <button 
                className="next-step-button" 
                onClick={goToNextStep}
                style={{ backgroundColor: operation.color }}
              >
                Siguiente Paso ➡️
              </button>
            </>
          )}
        </div>
      )}
      
      {currentStep === 2 && (
        <div className="step-content">
          <div className="practice-container" style={{ borderColor: operation.color }}>
            <h3 className="practice-title">¡Ahora es tu turno!</h3>
            
            {showVideo ? (
              <div className="help-video-container">
                <h4>Mira este video para entender mejor:</h4>
                {videoUrl ? (
                  <>
                    <div className="video-frame-container">
                      <iframe 
                        width="560" 
                        height="315" 
                        src={videoUrl}
                        title="Video explicativo" 
                        frameBorder="0" 
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        loading="lazy"
                        onError={() => console.error("Error loading video iframe")}
                      ></iframe>
                      
                      <div className="video-fallback">
                        <h5>Si el video no se carga correctamente:</h5>
                        <p>Puedes ver el video directamente en YouTube haciendo clic en el botón de abajo</p>
                        <a 
                          href={videoUrl.replace('embed/', 'watch?v=')} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="youtube-link"
                        >
                          Ver en YouTube
                        </a>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="video-error">
                    No se pudo cargar el video. Intenta de nuevo.
                  </div>
                )}
                <button 
                  className="try-again-button" 
                  onClick={() => {
                    setShowVideo(false);
                    resetStep();
                  }}
                  style={{ backgroundColor: operation.color }}
                >
                  Intentar de nuevo
                </button>
              </div>
            ) : (
              <>
                {renderPracticeQuestion()}
                
                {isCorrect === false && (
                  <div className="hint-container">
                    <h4>Pista:</h4>
                    <div className="hint-visualization">
                      {Array.from({ length: practiceNumbers.first }).map((_, i) => (
                        <div key={i} className="hint-dot"></div>
                      ))}
                      <div className="hint-symbol">{operation.symbol}</div>
                      {Array.from({ length: practiceNumbers.second }).map((_, i) => (
                        <div key={i} className="hint-dot second"></div>
                      ))}
                    </div>
                  </div>
                )}
                
                {isCorrect === true ? (
                  <div className="success-message">
                    <h3>¡Excelente trabajo! 🎉</h3>
                    {/* Elementos celebratorios animados */}
                    <div className="celebration-elements">
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="star-burst"></div>
                    </div>
                    <div className="result-message">
                      {operation.id === 'suma' && <span>{practiceNumbers.first} + {practiceNumbers.second} = {calculateExpectedResult()}</span>}
                      {operation.id === 'resta' && <span>{practiceNumbers.first} - {practiceNumbers.second} = {calculateExpectedResult()}</span>}
                      {operation.id === 'multiplicacion' && <span>{practiceNumbers.first} × {practiceNumbers.second} = {calculateExpectedResult()}</span>}
                      {operation.id === 'division' && <span>{practiceNumbers.first} ÷ {practiceNumbers.second} = {calculateExpectedResult()}</span>}
                    </div>
                    <button 
                      className="another-question-button"
                      onClick={resetStep}
                      style={{ backgroundColor: operation.color }}
                    >
                      Otra pregunta
                    </button>
                  </div>
                ) : (
                  <button 
                    className="check-button"
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswer}
                    style={{ 
                      backgroundColor: userAnswer ? operation.color : '#ccc',
                      cursor: userAnswer ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Comprobar
                  </button>
                )}
              </>
            )}
          </div>
          
          <div className="practice-navigation">
            <button 
              className="back-button"
              onClick={() => setCurrentStep(1)}
              style={{ borderColor: operation.color, color: operation.color }}
            >
              ⬅️ Volver a Visualización
            </button>
            
            <button 
              className="home-button"
              onClick={goToHome}
              style={{ borderColor: operation.color, color: operation.color }}
            >
              🏠 Volver al Inicio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningSteps; 