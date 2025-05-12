import React, { useEffect, useRef, useState } from 'react';
import { speak, stopSpeaking, isSpeaking } from '../../services/speechService';
import { playSound, setAudioEnabled, isAudioEnabled, SOUNDS } from '../../services/audioService';
import './styles.css';

const OperationResult = ({ result, isReturningToVisualization }) => {
  const canvasRef = useRef(null);
  
  if (!result || !result.operation) {
    return <div className="error-message">Error: No se pudo cargar el resultado de la operación</div>;
  }
  
  const { firstNumber, secondNumber, operation, result: computedResult, explanation } = result;

  const [animationFrame, setAnimationFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [audioEnabled, setAudioEnabledState] = useState(true);
  const animationRef = useRef(null);
  const animationStartTimeRef = useRef(null);
  const prevResultRef = useRef(null);
  const soundTimeoutsRef = useRef([]);
  const hasSpokenRef = useRef(false);

  useEffect(() => {
    return () => {
      soundTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      soundTimeoutsRef.current = [];
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      stopSpeaking();
      hasSpokenRef.current = false;
    };
  }, []);

  useEffect(() => {
    const checkSpeaking = () => {
      setIsSpeakingNow(isSpeaking());
    };
    
    checkSpeaking();
    
    const interval = setInterval(checkSpeaking, 300);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setAudioEnabledState(isAudioEnabled());
  }, []);

  useEffect(() => {
    setAudioEnabled(audioEnabled);
  }, [audioEnabled]);

  useEffect(() => {
    // Solo ejecutar cuando explanation cambie y no sea null
    if (explanation && !isReturningToVisualization && !hasSpokenRef.current) {
      hasSpokenRef.current = true;
      speak(explanation);
      setIsSpeakingNow(true);
    }

    if (!explanation) {
      hasSpokenRef.current = false;
    }
  }, [explanation]);

  // Efecto para resetear hasSpokenRef cuando cambian los números
  useEffect(() => {
    hasSpokenRef.current = false;
  }, [firstNumber, secondNumber]);

  useEffect(() => {
    if (isReturningToVisualization) {
      stopSpeaking();
      soundTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      soundTimeoutsRef.current = [];
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      hasSpokenRef.current = false;
    }
  }, [isReturningToVisualization]);

  const scheduleSound = (soundName, delayMs, volume = 1.0, rate = 1.0) => {
    if (!audioEnabled || isReturningToVisualization) return;
    
    const timeout = setTimeout(() => {
      playSound(soundName, volume, rate);
    }, delayMs);
    
    soundTimeoutsRef.current.push(timeout);
    return timeout;
  };

  const restartAnimation = () => {
    if (isAnimating) return;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    soundTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    soundTimeoutsRef.current = [];
    
    setAnimationFrame(0);
    setIsAnimating(true);
    setHasPlayed(false);
    
    playSound('WHOOSH', 0.7, 1.2);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    animationStartTimeRef.current = null;
  };

  const toggleAudio = () => {
    setAudioEnabledState(!audioEnabled);
  };

  useEffect(() => {
    if (!operation || !operation.id) {
      return;
    }
    
    const currentResult = {
      firstNumber,
      secondNumber,
      operationId: operation.id,
      computedResult
    };
    
    if (prevResultRef.current) {
      const prevResult = prevResultRef.current;
      
      if (
        prevResult.firstNumber !== currentResult.firstNumber ||
        prevResult.secondNumber !== currentResult.secondNumber ||
        prevResult.operationId !== currentResult.operationId ||
        prevResult.computedResult !== currentResult.computedResult
      ) {
        setIsAnimating(true);
        setHasPlayed(false);
        
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        
        soundTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        soundTimeoutsRef.current = [];
        
        playSound('WHOOSH', 0.6, 1.2);
        
        animationStartTimeRef.current = null;
      }
    }
    
    prevResultRef.current = currentResult;
  }, [firstNumber, secondNumber, operation?.id, computedResult, audioEnabled]);

  useEffect(() => {
    if (hasPlayed && !isAnimating) return;
    
    if (!canvasRef.current) return;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    soundTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    soundTimeoutsRef.current = [];
    
    setHasPlayed(true);
    
    if (audioEnabled) {
      playSound('WHOOSH', 0.6, 1.0);
    }
    
    renderAnimation(0);
    startAnimation();
    
  }, [isAnimating, firstNumber, secondNumber, operation?.id, computedResult, audioEnabled]);
  
  const renderAnimation = (progress) => {
    if (!operation || !operation.id) {
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Ejecutar la animación según el tipo de operación
    switch(operation.id) {
      case 'suma':
        animateAddition(ctx, firstNumber, secondNumber, computedResult, width, height, operation.color, progress);
        break;
      case 'resta':
        animateSubtraction(ctx, firstNumber, secondNumber, computedResult, width, height, operation.color, progress);
        break;
      case 'multiplicacion':
        animateMultiplication(ctx, firstNumber, secondNumber, computedResult, width, height, operation.color, progress);
        break;
      case 'division':
        animateDivision(ctx, firstNumber, secondNumber, computedResult, width, height, operation.color, progress);
        break;
      default:
        // Si no sabemos qué operación es, no hacemos nada
        break;
    }
  };
  
  const startAnimation = () => {
    if (!isAnimating) return;
    
    const animate = (timestamp) => {
      // Si es el primer frame, guardar el timestamp
      if (!animationStartTimeRef.current) {
        animationStartTimeRef.current = timestamp;
      }
      
      // Calcular el progreso (de 0 a 1) basado en el tiempo transcurrido
      const elapsed = timestamp - animationStartTimeRef.current;
      const duration = 3000; // 3 segundos para la animación completa
      let progress = Math.min(elapsed / duration, 1);
      
      // Renderizar la animación según el progreso
      renderAnimation(progress);
      
      // Actualizar el frame actual
      setAnimationFrame(prev => prev + 1);
      
      // Si la animación no ha terminado, solicitar el siguiente frame
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Al terminar la animación
        setIsAnimating(false);
        animationRef.current = null;
        // Reproducir sonido de finalización
        if (audioEnabled) {
          playSound('SUCCESS', 0.4, 0.9);
        }
      }
    };
    
    // Iniciar la animación
    animationRef.current = requestAnimationFrame(animate);
  };
  
  const animateAddition = (ctx, num1, num2, result, width, height, color, progress) => {
    // Definir constantes para posicionamiento - mantener estas constantes fuera de cualquier condicional
    const circleRadius = 15;
    const spacing = 45; // Aumentado para dar espacio a los números
    const startX = 50;
    const firstRowY = 60; // Ajustado al quitar el título superior
    const secondRowY = 130;
    const resultRowY = 250; // Aumentado para dar más espacio desde la línea
    
    const maxRowsFirstNumber = Math.ceil(num1 / 10);
    const maxRowsSecondNumber = Math.ceil(num2 / 10);
    const maxRowsResult = Math.ceil(result / 10);
    
    const isFirstSection = progress < 0.2;
    const isSecondSection = progress >= 0.2 && progress < 0.6;
    const isLineSection = progress >= 0.6 && progress < 0.8;
    const isResultSection = progress >= 0.8;
    
    if (isSecondSection && progress < 0.21 && audioEnabled) {
      playSound('POP', 0.6, 1.2);
    }
    
    if (isLineSection && progress < 0.61 && audioEnabled) {
      playSound('WHOOSH', 0.5, 0.8);
    }
    
    if (isResultSection && progress < 0.81 && audioEnabled) {
      playSound('ADD', 0.7, 1.0);
    }
    
    // Play sound for each result circle that appears
    if (isResultSection && audioEnabled) {
      // Calculate number of result dots visible in previous and current frame
      const prevDotsVisible = Math.floor((progress - 0.01) * 5 * result);
      const currentDotsVisible = Math.floor(progress * 5 * result);
      
      // If new dots appeared, play sound for each one (not limited to every 5th dot)
      if (currentDotsVisible > prevDotsVisible) {
        playSound('POP', 0.5, 1.0 + (currentDotsVisible / result / 2));
      }
    }
    
    // Dibujar primer número (siempre visible desde el principio)
    ctx.fillStyle = '#4CAF50';
    for (let i = 0; i < num1; i++) {
      const x = startX + (i % 10) * spacing;
      const y = firstRowY + Math.floor(i / 10) * spacing;
      
      // Dibujar la bolita
      ctx.beginPath();
      ctx.arc(x, y, circleRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Añadir número al lado de la bolita
      ctx.fillStyle = '#000';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${i+1}`, x, y - circleRadius - 5);
      
      // Volver al color original para la próxima bolita
      ctx.fillStyle = '#4CAF50';
      
      // Añadir efecto de brillo
      if (progress < 0.3 && Math.random() > 0.7) {
        ctx.fillStyle = '#97DC8F';
        ctx.beginPath();
        ctx.arc(x, y, circleRadius * 0.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#4CAF50';
      }
    }
    
    // Dibujar signo +
    ctx.fillStyle = color;
    ctx.font = 'bold 30px Arial';
    ctx.fillText('+', width / 2, 100);
    
    const secondNumberProgress = Math.max(0, Math.min(1, (progress - 0.2) * 2));
    ctx.fillStyle = '#2196F3';
    
    for (let i = 0; i < num2; i++) {
      if (i / num2 <= secondNumberProgress) {
        const x = startX + (i % 10) * spacing;
        const y = secondRowY + Math.floor(i / 10) * spacing;
        
        const scale = secondNumberProgress < 1 ? 
                     Math.min(1, 3 * (secondNumberProgress - i / num2)) : 1;
        
        if (scale > 0) {
          ctx.beginPath();
          ctx.arc(x, y, circleRadius * scale, 0, 2 * Math.PI);
          ctx.fill();
          
          if (scale > 0.7) {
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${num1+i+1}`, x, y - circleRadius - 5);
            ctx.fillStyle = '#2196F3';
          }
        }
      }
    }
    
    // Dibujar línea horizontal siempre (incluso cuando progress es 0)
    // para evitar reajustes bruscos del layout
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    
    if (secondNumberProgress >= 1) {
      // Animación de la línea cuando el segundo número está completo
      const lineProgress = Math.min(1, (progress - 0.7) * 3);
      ctx.beginPath();
      ctx.moveTo(50, 200);
      ctx.lineTo(50 + (width - 100) * lineProgress, 200);
      ctx.stroke();
    } else {
      // Línea invisible para mantener el espacio (stroke transparente)
      ctx.strokeStyle = 'rgba(0,0,0,0)';
      ctx.beginPath();
      ctx.moveTo(50, 200);
      ctx.lineTo(width - 50, 200);
      ctx.stroke();
    }
    
    // Calcular área para resultado
    const resultArea = {
      top: 200, // después de la línea
      bottom: resultRowY + (maxRowsResult * spacing) + 30, // espacio para resultado completo + margen
    };
    
    // Reservar espacio para el resultado siempre (incluso antes de mostrarlo)
    // y dibujar el resultado solo cuando sea el momento
    const resultProgress = Math.max(0, Math.min(1, (progress - 0.8) * 5));
    
    if (resultProgress > 0) {
      ctx.fillStyle = '#9C27B0';
      for (let i = 0; i < result; i++) {
        if (i / result <= resultProgress) {
          const x = startX + (i % 10) * spacing;
          const y = resultRowY + Math.floor(i / 10) * spacing;
          
          // Reducir el efecto de rebote para evitar titilación
          const bounceEffect = Math.sin((progress * 10) - (i * 0.1)) * 2;
          
          // Dibujar la bolita
          ctx.beginPath();
          ctx.arc(x, y + bounceEffect, circleRadius, 0, 2 * Math.PI);
          ctx.fill();
          
          // Añadir número al lado de cada bolita del resultado
          if (i / result <= resultProgress - 0.05) { // Pequeño retraso para que aparezca después de la bolita
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${i+1}`, x, y + bounceEffect - circleRadius - 5);
            ctx.fillStyle = '#9C27B0';
          }
        }
      }
    }
    
    // Añadir texto explicativo con fondo
    if (progress > 0.5) {
      const text = `${num1} + ${num2} = ${num1 + num2}`;
      ctx.font = 'bold 22px Arial';
      const textWidth = ctx.measureText(text).width;
      
      // Fondo para el texto
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(width/2 - textWidth/2 - 10, 340, textWidth + 20, 35);
      ctx.strokeStyle = '#9C27B0';
      ctx.lineWidth = 2;
      ctx.strokeRect(width/2 - textWidth/2 - 10, 340, textWidth + 20, 35);
      
      // Texto
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.fillText(text, width / 2, 365);
    }
  };

  const animateSubtraction = (ctx, num1, num2, result, width, height, color, progress) => {
    // Definir constantes para posicionamiento
    const circleRadius = 15;
    const spacing = 45; // Aumentado para dar espacio a los números
    const startX = 50;
    const firstRowY = 80;
    const resultRowY = 250;
    
    // Comprobar si el resultado es negativo
    const isNegative = result < 0;
    const absResult = Math.abs(result);
    
    // Calculate current animation section for sound effects
    const initialPhase = progress < 0.3;
    const markingPhase = progress >= 0.3 && progress < 0.6;
    const removingPhase = progress >= 0.6 && progress < 0.8;
    const resultPhase = progress >= 0.8;
    
    // Sound effects for animation phases
    if (markingPhase && progress < 0.31 && audioEnabled) {
      playSound('WHOOSH', 0.4, 1.1);
    }
    
    if (removingPhase && progress < 0.61 && audioEnabled) {
      playSound('SUBTRACT', 0.4, 1.0);
      
      // If result is negative, add a special sound effect
      if (isNegative) {
        scheduleSound('NEGATIVE', 300, 0.4, 0.9);
      }
    }
    
    if (resultPhase && progress < 0.81 && audioEnabled) {
      // Different sound for positive vs negative results
      if (isNegative) {
        playSound('NEGATIVE', 0.4, 1.0);
      } else {
        playSound('COUNT', 0.5, 1.0);
      }
    }
    
    // Dibujar primer número con números junto a las bolitas
    for (let i = 0; i < num1; i++) {
      const x = startX + (i % 10) * spacing;
      const y = firstRowY + Math.floor(i / 10) * spacing;
      
      // Todos comienzan del mismo color
      ctx.fillStyle = '#4CAF50';
      
      // Bolitas que se restarán cambian de color gradualmente
      if (i >= num1 - num2 && progress > 0.3) {
        const fadeOutProgress = Math.min(1, (progress - 0.3) * 2);
        ctx.fillStyle = fadeColor('#4CAF50', '#FFEB3B', fadeOutProgress);
      }
      
      // Dibujar la bolita
      ctx.beginPath();
      ctx.arc(x, y, circleRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Añadir número junto a la bolita
      ctx.fillStyle = '#000';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${i+1}`, x, y - circleRadius - 5);
      
      // Volver al color original
      ctx.fillStyle = '#4CAF50';
      
      // Marcar con X los elementos que se quitan con animación
      if (i >= num1 - num2 && progress > 0.5) {
        const xProgress = Math.min(1, (progress - 0.5) * 2);
        
        // Play sound when X appears (with small delay between each)
        if (xProgress > 0 && xProgress < 0.1 && audioEnabled) {
          const delay = (i - (num1 - num2)) * 50;
          scheduleSound('SUBTRACT', delay, 0.2, 1.5);
        }
        
        ctx.strokeStyle = '#FF5722';
        ctx.lineWidth = 2;
        
        // Dibujar la X progresivamente
        if (xProgress > 0) {
          ctx.beginPath();
          ctx.moveTo(x - 10, y - 10);
          ctx.lineTo(x - 10 + 20 * xProgress, y - 10 + 20 * xProgress);
          ctx.stroke();
        }
        
        if (xProgress > 0.5) {
          const secondLineProgress = Math.min(1, (xProgress - 0.5) * 2);
          ctx.beginPath();
          ctx.moveTo(x + 10, y - 10);
          ctx.lineTo(x + 10 - 20 * secondLineProgress, y - 10 + 20 * secondLineProgress);
          ctx.stroke();
        }
      }
    }
    
    // Actualizar total mientras se restan elementos
    if (progress > 0.5) {
      const subtractedAmount = Math.min(num2, Math.floor(num2 * Math.min(1, (progress - 0.5) * 2)));
      const currentTotal = num1 - subtractedAmount;
      
      // Sound effect when total changes
      if (subtractedAmount > 0 && subtractedAmount <= num2 && audioEnabled) {
        if (Math.floor(subtractedAmount / num2 * 10) !== Math.floor((subtractedAmount - 0.1) / num2 * 10)) {
          playSound('COUNT', 0.4, 1.0 + (subtractedAmount / num2 / 2));
        }
      }
    }
    
    // Dibujar símbolo de resta
    ctx.fillStyle = color;
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('-', width / 2, 150);
    
    // Dibujar número que se resta (num2)
    const num2Progress = Math.min(1, progress * 2);
    if (num2Progress > 0.3) {
      // No mostrar el número en amarillo sobre la línea roja
    }
    
    // Dibujar línea de resultado siempre (con opacidad 0 al inicio)
    const lineProgress = Math.min(1, (progress - 0.7) * 3);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    
    if (progress > 0.7) {
      ctx.beginPath();
      ctx.moveTo(50, 200);
      ctx.lineTo(50 + (width - 100) * lineProgress, 200);
      ctx.stroke();
    } else {
      // Línea invisible para mantener el espacio
      ctx.strokeStyle = 'rgba(0,0,0,0)';
      ctx.beginPath();
      ctx.moveTo(50, 200);
      ctx.lineTo(width - 50, 200);
      ctx.stroke();
    }
    
    // Gestionar la visualización del resultado según sea positivo o negativo
    if (progress > 0.8) {
      const resultProgress = Math.min(1, (progress - 0.8) * 5);
      
      ctx.fillStyle = isNegative ? '#DC0000' : '#333';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Resultado: ${result}`, startX, resultRowY - 30);
        
      for (let i = 0; i < absResult; i++) {
        if (i / absResult <= resultProgress) {
          const x = startX + (i % 10) * spacing;
          const y = resultRowY + Math.floor(i / 10) * spacing;
          
          const slideY = y - (1 - resultProgress) * 20;
          
          if (i / absResult <= resultProgress && 
              i / absResult > resultProgress - 0.05 && 
              audioEnabled) {
            const pitch = isNegative ? 0.8 : 1.0;
            playSound('POP', 0.5, pitch + (i / absResult / 5));
          }
          
          ctx.fillStyle = isNegative ? '#DC0000' : '#9C27B0';
          
          ctx.beginPath();
          ctx.arc(x, slideY, circleRadius, 0, 2 * Math.PI);
          ctx.fill();
          
          if (i / absResult <= resultProgress - 0.05) {
            ctx.fillStyle = isNegative ? '#FFFFFF' : '#000000'; // Color del texto según fondo
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${i+1}`, x, slideY - circleRadius - 5);
            ctx.fillStyle = isNegative ? '#DC0000' : '#9C27B0';
          }
        }
      }
      
      if (isNegative && resultProgress > 0.9) {
        const labelOpacity = Math.min(1, (resultProgress - 0.9) * 10);
        ctx.fillStyle = `rgba(220, 0, 0, ${labelOpacity})`;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        
        const labelX = startX + (Math.min(absResult, 10) * spacing) + 10;
        const labelY = resultRowY + Math.floor(0 / 10) * spacing;
        
        ctx.fillText("← Representan números negativos", labelX, labelY);
      }
    }
    
    if (progress > 0.9) {
      const text = `${num1} - ${num2} = ${result}`;
      ctx.font = 'bold 22px Arial';
      const textWidth = ctx.measureText(text).width;
      
      const textOpacity = Math.min(1, (progress - 0.9) * 10);
      
      ctx.fillStyle = `rgba(255, 255, 255, ${textOpacity * 0.9})`;
      ctx.fillRect(width/2 - textWidth/2 - 10, 380, textWidth + 20, 35);
      ctx.strokeStyle = isNegative ? '#DC0000' : '#9C27B0';
      ctx.lineWidth = 2;
      ctx.strokeRect(width/2 - textWidth/2 - 10, 380, textWidth + 20, 35);
      
      ctx.fillStyle = isNegative ? `rgba(220, 0, 0, ${textOpacity})` : `rgba(51, 51, 51, ${textOpacity})`;
      ctx.textAlign = 'center';
      ctx.fillText(text, width / 2, 405);
    }
  };

  const animateMultiplication = (ctx, num1, num2, result, width, height, color, progress) => {
    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = '#333';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Vamos a multiplicar ${num1} × ${num2}`, width / 2, 35);
    
    const rectSize = Math.min(30, Math.max(15, 300 / Math.max(num1, num2)));
    const padding = 10;
    const startX = (width - (num1 * (rectSize + padding))) / 2;
    const startY = 80;
    
    if (progress < 0.05 && audioEnabled) {
      playSound('WHOOSH', 0.4, 1.0);
    }
    
    const rowsToShow = Math.floor(num2 * Math.min(1, progress * 1.5));
    
    let totalShown = 0;
    
    for (let i = 0; i < rowsToShow; i++) {
      const rowProgress = Math.min(1, (progress * 1.5 * num2) - i);
      const columnsToShow = Math.floor(num1 * rowProgress);
      
      // Sound effect when new row starts
      if (i > 0 && columnsToShow === 1 && rowProgress < 0.2 && audioEnabled) {
        playSound('POP', 0.5, 1.0 + (i * 0.1));
      }
      
      for (let j = 0; j < columnsToShow; j++) {
        const x = startX + j * (rectSize + padding);
        const y = startY + i * (rectSize + padding);
        
        totalShown++;
        
        if (totalShown % 10 === 0 && rowProgress < 0.9 && audioEnabled) {
          playSound('POP', 0.5, 1.0 + (totalShown / (num1 * num2) / 2));
        }
        
        ctx.fillStyle = getMultiplicationColor(i, num2);
        
        const pulseEffect = 1 + Math.sin(progress * 10 + i * 0.5 + j * 0.2) * 0.05;
        const currentSize = rectSize * pulseEffect;
        
        ctx.fillRect(
          x - (currentSize - rectSize) / 2, 
          y - (currentSize - rectSize) / 2, 
          currentSize, 
          currentSize
        );
        
        if (rowProgress > 0.7) {
          ctx.fillStyle = 'white';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(totalShown, x + rectSize/2, y + rectSize/2 + 4);
        }
      }
    }
    
    if (progress > 0.6) {
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      
      const explanationX = startX + num1 * (rectSize + padding) + 20;
      const explanationY = startY + 20;
      
      for (let i = 0; i < rowsToShow; i++) {
        if (i < num2) {
          ctx.fillText(`${num1}`, explanationX, explanationY + i * (rectSize + padding));
        }
      }
      
      if (rowsToShow > 1) {
        const signsToShow = Math.min(rowsToShow - 1, num2 - 1);
        for (let i = 0; i < signsToShow; i++) {
          ctx.fillText(`+`, explanationX - 20, explanationY + (i + 0.5) * (rectSize + padding));
        }
      }
    }
    
    if (progress > 0.8) {
      const lineProgress = Math.min(1, (progress - 0.8) * 5);
      
      if (lineProgress < 0.1 && audioEnabled) {
        playSound('WHOOSH', 0.5, 0.8);
      }
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(width/2 - 150, startY + num2 * (rectSize + padding) + 20);
      ctx.lineTo(width/2 + 150 * lineProgress, startY + num2 * (rectSize + padding) + 20);
      ctx.stroke();
    }
    
    if (progress > 0.9) {
      const resultProgress = Math.min(1, (progress - 0.9) * 10);
      
      if (resultProgress < 0.1 && audioEnabled) {
        playSound('SUCCESS', 0.4, 1.0);
      }
      
      ctx.fillStyle = '#9C27B0';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      
      const finalY = startY + num2 * (rectSize + padding) + 50;
      
      if (resultProgress > 0.9) {
        ctx.save();
        
        const text = `${num1} grupos de ${num2} = ${result}`;
        ctx.font = 'bold 22px Arial';
        const textWidth = ctx.measureText(text).width;
        
        const boxWidth = textWidth + 40;
        const boxHeight = 40;
        const boxX = width/2 - boxWidth/2;
        const boxY = finalY - 10;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = '#9C27B0';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText(text, width / 2, boxY + boxHeight/2 + 7);
        
        ctx.restore();
      }
    }
  };

  const animateDivision = (ctx, num1, num2, result, width, height, color, progress) => {
    ctx.clearRect(0, 0, width, height);
    
    // Determinar si es un caso especial (dividir un número menor por uno mayor)
    const isSpecialCase = num1 < num2;
    
    // Instrucción clara para niños adaptada según el caso
    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    
    if (isSpecialCase) {
      ctx.fillText(`Vamos a dividir ${num1} entre ${num2}`, width / 2, 30);
    } else {
      ctx.fillText(`Vamos a repartir ${num1} elementos en ${num2} grupos iguales`, width / 2, 30);
    }
    
    const circleRadius = 15;
    const spacing = 30;
    const startX = 50;
    const startY = 80;
    
    // Sound effect at start
    if (progress < 0.05 && audioEnabled) {
      playSound('WHOOSH', 0.4, 1.0);
    }
    
    // Limitar a 100 elementos máximo para visualización clara
    const totalElements = Math.min(num1, 100);
    
    // Caso especial: número menor dividido por número mayor
    if (isSpecialCase) {
      // FASE 1: Mostrar la cantidad total
      if (progress < 0.3) {
        const initialProgress = Math.min(1, progress * 3.33);
        
        // Mostrar el número que vamos a dividir
        ctx.fillStyle = '#4CAF50';
        const centerX = width / 2;
        const centerY = height / 3;
        const numRadius = 30;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, numRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        if (initialProgress > 0.7) {
          ctx.fillStyle = 'white';
          ctx.font = 'bold 18px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${num1}`, centerX, centerY + 6);
          
          // Texto explicativo
          const textOpacity = Math.min(1, (initialProgress - 0.7) * 3);
          ctx.fillStyle = `rgba(51, 51, 51, ${textOpacity})`;
          ctx.font = '18px Arial';
          ctx.fillText(`Tenemos ${num1} para dividir entre ${num2}`, width / 2, centerY + 80);
        }
      }
      // FASE 2: Mostrar el divisor y el proceso
      else if (progress < 0.7) {
        const phaseProgress = Math.min(1, (progress - 0.3) * 2.5);
        
        // Dibujar el número a dividir
        ctx.fillStyle = '#4CAF50';
        const centerX = width / 2;
        const centerY = height / 3;
        const numRadius = 30;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, numRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${num1}`, centerX, centerY + 6);
        
        // Mostrar el divisor
        if (phaseProgress > 0.2) {
          const divisorOpacity = Math.min(1, (phaseProgress - 0.2) * 2);
          
          ctx.fillStyle = `rgba(33, 150, 243, ${divisorOpacity})`;
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`÷ ${num2}`, centerX, centerY + 80);
          
          // Dibujar una torta dividida en el número de partes del divisor
          if (phaseProgress > 0.4) {
            const pieProgress = Math.min(1, (phaseProgress - 0.4) * 1.7);
            
            // Colores para la torta
            const pieColors = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107'];
            
            // Posición de la torta
            const pieX = width / 4;
            const pieY = centerY + 140;
            const pieRadius = 60;
            
            // Dibujar la torta (círculo dividido en 'num2' partes)
            drawPieChart(
              ctx, 
              pieX, 
              pieY, 
              pieRadius, 
              num2,           // El divisor es el número total de partes
              num1,           // El dividendo es el número de partes seleccionadas
              pieColors, 
              pieProgress, 
              true            // Mostrar etiquetas
            );
            
            // Texto explicativo para la torta
            if (pieProgress > 0.8) {
              const textOpacity = Math.min(1, (pieProgress - 0.8) * 5);
              ctx.fillStyle = `rgba(33, 33, 33, ${textOpacity})`;
              ctx.font = '14px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(`La torta se divide en ${num2} partes`, pieX, pieY + pieRadius + 25);
              ctx.fillText(`y tomamos ${num1} partes`, pieX, pieY + pieRadius + 45);
            }
            
            // Explicación visual: fracción (a la derecha de la torta)
            const fractionOpacity = Math.min(1, (phaseProgress - 0.4) * 2);
            
            // Ubicar la fracción a la derecha de la torta
            const fractionX = width * 3/4;
            const fractionY = pieY;
            
            // Dibujar línea de fracción
            ctx.strokeStyle = `rgba(33, 150, 243, ${fractionOpacity})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(fractionX - 30, fractionY);
            ctx.lineTo(fractionX + 30, fractionY);
            ctx.stroke();
            
            // Numerador
            ctx.fillStyle = `rgba(33, 150, 243, ${fractionOpacity})`;
            ctx.font = 'bold 28px Arial';
            ctx.fillText(`${num1}`, fractionX, fractionY - 10);
            
            // Denominador
            ctx.fillText(`${num2}`, fractionX, fractionY + 30);
            
            // Texto explicativo para la fracción
            if (pieProgress > 0.8) {
              const textOpacity = Math.min(1, (pieProgress - 0.8) * 5);
              ctx.fillStyle = `rgba(33, 33, 33, ${textOpacity})`;
              ctx.font = '14px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(`Esto es lo mismo que la fracción`, fractionX, fractionY + 60);
              ctx.fillText(`${num1}/${num2} = ${result}`, fractionX, fractionY + 80);
            }
          }
        }
      }
      // FASE 3: Mostrar el resultado
      else {
        const resultProgress = Math.min(1, (progress - 0.7) * 3.33);
        
        // Play sound for result
        if (resultProgress < 0.1 && audioEnabled) {
          playSound('SUCCESS', 0.4, 1.0);
        }
        
        // Dibujar el número a dividir
        ctx.fillStyle = '#4CAF50';
        const centerX = width / 2;
        const centerY = height / 4;  // Movido más arriba para dar más espacio
        const numRadius = 30;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, numRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${num1}`, centerX, centerY + 6);
        
        // Divisor
        ctx.fillStyle = `rgba(33, 150, 243, 1)`;
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`÷ ${num2}`, centerX, centerY + 80);
        
        // Dibujar representación visual con torta completa
        if (resultProgress > 0.2) {
          const pieProgress = Math.min(1, (resultProgress - 0.2) * 2);
          
          // Colores para la torta
          const pieColors = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', 
                           '#FF9800', '#FF5722', '#F44336', '#E91E63', '#9C27B0'];
          
          // Posición y tamaño de la torta
          const pieRadius = 70;
          
          // Dibujar la torta en el centro
          drawPieChart(
            ctx, 
            centerX, 
            centerY + 180,
            pieRadius, 
            num2,           // El divisor es el número total de partes
            num1,           // El dividendo es el número de partes seleccionadas
            pieColors, 
            pieProgress, 
            true            // Mostrar etiquetas
          );
          
          // Texto explicativo sobre la torta
          if (pieProgress > 0.8) {
            const textOpacity = Math.min(1, (pieProgress - 0.8) * 5);
            ctx.fillStyle = `rgba(33, 33, 33, ${textOpacity})`;
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${num1} partes de ${num2} = ${result} de una torta completa`, 
                        centerX, centerY + 170 + pieRadius + 30);
          }
        }
        
        // Explicación visual con ejemplos concretos
        if (resultProgress > 0.4) {
          const visualOpacity = Math.min(1, (resultProgress - 0.4) * 1.7);
          
          ctx.fillStyle = `rgba(51, 51, 51, ${visualOpacity})`;
          ctx.font = '18px Arial';
          ctx.textAlign = 'center';
          
          const midY = centerY + 300;
          
          // Título explicativo
          ctx.font = 'bold 20px Arial';
          ctx.fillStyle = `rgba(33, 33, 33, ${visualOpacity})`;
          ctx.fillText(`Cuando dividimos un número más pequeño`, width / 2, midY);
          ctx.fillText(`entre uno más grande:`, width / 2, centerY + 320);
          
          // Explicación con ejemplos claros
          ctx.font = '18px Arial';
          ctx.fillStyle = `rgba(33, 33, 33, ${visualOpacity})`;
          
          // Ejemplo 1: Cómo entender la división
          const example1Y = midY + 50;
          // ctx.fillText(`Preguntamos: ¿cuántas veces cabe ${num2} en ${num1}?`, width / 2, example1Y);
          
          // Ejemplo 2: Equivalencia con fracción
          const example2Y = example1Y + 30;
          // ctx.fillText(`Es como escribir la fracción ${num1}/${num2} = ${result}`, width / 2, example2Y);
        }
        
        // Mostrar resultado final con animación
        if (resultProgress > 0.6) {
          const formulaProgress = Math.min(1, (resultProgress - 0.6) * 2.5);
          
          // Formula visual clara
          const formula = `${num1} ÷ ${num2} = ${result}`;
          const formulaOpacity = formulaProgress;
          
          // Para la fórmula
          ctx.font = 'bold 24px Arial';
          const formulaWidth = ctx.measureText(formula).width;
          
          // Calcular posición más abajo para evitar sobreposición
          const formulaY = height - 90;
          
          // Fondo para la fórmula
          ctx.fillStyle = `rgba(255, 255, 255, ${formulaOpacity * 0.9})`;
          ctx.fillRect(width/2 - formulaWidth/2 - 15, formulaY - 25, formulaWidth + 30, 40);
          ctx.strokeStyle = '#9C27B0';
          ctx.lineWidth = 2;
          ctx.strokeRect(width/2 - formulaWidth/2 - 15, formulaY - 25, formulaWidth + 30, 40);
          
          // Texto de la fórmula
          ctx.fillStyle = `rgba(156, 39, 176, ${formulaOpacity})`;
          ctx.textAlign = 'center';
          ctx.fillText(formula, width / 2, formulaY + 5);
          
          // Explicación adicional
          if (formulaProgress > 0.8) {
            const explProgress = Math.min(1, (formulaProgress - 0.8) * 5);
            
            // Formato el resultado para mostrar solo 2 decimales si es necesario
            const formattedResult = Number.isInteger(result) ? result : Math.round(result * 100) / 100;
            
            const explanation = `${num1} cabe ${formattedResult} veces en ${num2}`;
            
            ctx.font = 'bold 20px Arial';
            const explWidth = ctx.measureText(explanation).width;
            
            // Posicionar más abajo para evitar sobreposición
            const explY = height - 30;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${explProgress * 0.9})`;
            ctx.fillRect(width/2 - explWidth/2 - 15, explY - 25, explWidth + 30, 40);
            ctx.strokeStyle = '#9C27B0';
            ctx.strokeRect(width/2 - explWidth/2 - 15, explY - 25, explWidth + 30, 40);
            
            ctx.fillStyle = `rgba(33, 33, 33, ${explProgress})`;
            ctx.fillText(explanation, width / 2, explY + 5);
          }
        }
      }
    }
    // Caso normal: número mayor dividido por número menor
    else {
      // FASE 1: Mostrar todos los elementos juntos
      if (progress < 0.3) {
        const initialProgress = Math.min(1, progress * 3.33);
        const itemsToShow = Math.floor(totalElements * initialProgress);
        
        // Play pop sounds for elements appearing
        const prevItemsShown = Math.floor(totalElements * Math.max(0, (progress - 0.01) * 3.33));
        if (itemsToShow > prevItemsShown && audioEnabled) {
          playSound('POP', 0.5, 1.0 + (itemsToShow / totalElements));
        }
        
        ctx.fillStyle = '#4CAF50';
        for (let i = 0; i < itemsToShow; i++) {
          const col = i % 10;
          const row = Math.floor(i / 10);
          
          const x = startX + col * spacing;
          const y = startY + row * spacing;
          
          ctx.beginPath();
          ctx.arc(x, y, circleRadius, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${i+1}`, x, y + 3);
          ctx.fillStyle = '#4CAF50';
        }
        
        // Mostrar texto explicativo
        if (initialProgress > 0.7) {
          ctx.fillStyle = color;
          ctx.font = '18px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Tenemos ${num1} elementos`, width / 2, startY + Math.ceil(totalElements / 10) * spacing + 30);
          
          // Segundo mensaje animado
          const secondTextOpacity = Math.min(1, (initialProgress - 0.7) * 3);
          ctx.fillStyle = `rgba(51, 51, 51, ${secondTextOpacity})`;
          ctx.fillText(`Los vamos a repartir en ${num2} grupos iguales`, width / 2, startY + Math.ceil(totalElements / 10) * spacing + 60);
          
          // Sound for explanation
          if (initialProgress > 0.9 && initialProgress < 0.92 && audioEnabled) {
            playSound('WHOOSH', 0.5, 0.8);
          }
        }
      } 
      // FASE 2: Agrupar los elementos con animación clara
      else {
        const groupingProgress = Math.min(1, (progress - 0.3) * 1.4);
        
        // Sound for grouping phase
        if (groupingProgress < 0.05 && audioEnabled) {
          playSound('WHOOSH', 0.4, 1.2);
        }
        
        // Calcular cuántos elementos van en cada grupo
        const elementsPerGroup = Math.floor(num1 / num2);
        const remainder = num1 % num2;
        
        // Dibuja torta para visualizar la división
        if (groupingProgress > 0.1 && groupingProgress < 0.4) {
          const pieProgress = Math.min(1, (groupingProgress - 0.1) * 3.3);
          
          // Dibujar primero una torta completa que representa el total (num1)
          const centerX = width / 2;
          const centerY = startY + 50;
          const pieRadius = 70;
          
          // Colores para la torta
          const pieColors = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', 
                           '#FF9800', '#FF5722', '#F44336', '#E91E63', '#9C27B0'];
          
          // Título para la torta
          ctx.fillStyle = `rgba(33, 33, 33, ${pieProgress})`;
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Tenemos ${num1} porciones de torta para dividir en ${num2} grupos`, 
                     centerX, centerY - pieRadius - 20);
          
          // Dibujar la torta completa con num1 porciones
          ctx.beginPath();
          ctx.arc(centerX, centerY, pieRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#4CAF50';
          ctx.fill();
          
          // Dividir la torta en num1 porciones (ángulos)
          const sliceAngle = (Math.PI * 2) / num1;
          
          for (let i = 0; i < num1 * pieProgress; i++) {
            // Calcular ángulos para cada porción
            const startAngle = i * sliceAngle - Math.PI/2;
            const endAngle = startAngle + sliceAngle;
            
            // Dibujar líneas divisorias
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
              centerX + Math.cos(startAngle) * pieRadius,
              centerY + Math.sin(startAngle) * pieRadius
            );
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Añadir números a algunas porciones (cada 5 porciones si hay muchas)
            if (i % Math.max(1, Math.floor(num1 / 10)) === 0) {
              const textAngle = startAngle + sliceAngle / 2;
              const textRadius = pieRadius * 0.7;
              const textX = centerX + Math.cos(textAngle) * textRadius;
              const textY = centerY + Math.sin(textAngle) * textRadius;
              
              ctx.fillStyle = 'white';
              ctx.font = 'bold 14px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`${i+1}`, textX, textY);
            }
          }
          
          // Mostrar explicación de lo que vamos a hacer
          if (pieProgress > 0.7) {
            const textOpacity = Math.min(1, (pieProgress - 0.7) * 3.3);
            ctx.fillStyle = `rgba(33, 33, 33, ${textOpacity})`;
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Ahora vamos a dividir estas ${num1} porciones en ${num2} grupos iguales`, 
                       centerX, centerY + pieRadius + 25);
            
            // Segunda línea de explicación
            if (remainder === 0) {
              ctx.fillText(`Cada grupo tendrá exactamente ${elementsPerGroup} porciones`, 
                         centerX, centerY + pieRadius + 50);
            } else {
              ctx.fillText(`Cada grupo tendrá ${elementsPerGroup} porciones y sobrarán ${remainder}`, 
                         centerX, centerY + pieRadius + 50);
            }
          }
        }
        
        // Dibuja cajas/contenedores para los grupos primero
        if (groupingProgress > 0.4) {
          const boxProgress = Math.min(1, (groupingProgress - 0.4) * 1.7);
          
          // Sound for boxes appearing
          if (boxProgress < 0.1 && audioEnabled) {
            playSound('POP', 0.5, 0.8);
          }
          
          // Ajustar posición de inicio para que aparezca debajo de la torta
          const boxStartY = startY + 170;
          
          for (let g = 0; g < num2; g++) {
            const groupRow = Math.floor(g / 3);
            const groupCol = g % 3;
            
            const boxWidth = spacing * (elementsPerGroup + 1);
            const boxHeight = spacing * 3;
            const boxX = startX + groupCol * (boxWidth + spacing * 2);
            const boxY = boxStartY + groupRow * (boxHeight + spacing);
            
            // Dibujar caja con opacidad creciente
            ctx.fillStyle = `rgba(240, 240, 240, ${boxProgress})`;
            ctx.strokeStyle = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${boxProgress})`;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
            ctx.fill();
            ctx.stroke();
            
            // Dibujar mini torta en cada grupo
            if (boxProgress > 0.7) {
              const miniPieRadius = 20;
              const miniPieX = boxX + boxWidth / 2;
              const miniPieY = boxY - miniPieRadius - 10;
              
              // Colores para las mini tortas
              const miniPieColors = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107'];
              
              // Solo dibujar la mini torta si hay elementos para este grupo
              if (g < num2 - 1 || (g === num2 - 1 && remainder > 0)) {
                // Determinar cuántas porciones para este grupo
                const porciones = g === num2 - 1 ? elementsPerGroup + remainder : elementsPerGroup;
                
                // Dibujar mini torta
                drawPieChart(
                  ctx, 
                  miniPieX, 
                  miniPieY, 
                  miniPieRadius,
                  porciones,         // Cada mini torta tiene elementsPerGroup partes
                  porciones,         // Todas las partes están seleccionadas
                  miniPieColors,
                  boxProgress,
                  false              // No mostrar etiquetas en las mini tortas
                );
              }
            }
            
            // Añadir etiqueta al grupo
            if (boxProgress > 0.5) {
              ctx.fillStyle = `rgba(51, 51, 51, ${boxProgress})`;
              ctx.font = 'bold 14px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(`Grupo ${g+1}`, boxX + boxWidth/2, boxY - 10);
            }
          }
        }
        
        // Mover elementos a sus grupos correspondientes
        for (let i = 0; i < totalElements; i++) {
          const groupIndex = Math.min(Math.floor(i / elementsPerGroup), num2 - 1);
          const itemInGroup = i - (groupIndex * elementsPerGroup);
          
          // Si hay un resto, distribuirlo equitativamente
          let adjustedGroupIndex = groupIndex;
          if (groupIndex === num2 - 1 && itemInGroup >= elementsPerGroup + remainder) {
            continue; // Skip excess elements
          }
          
          // Calcular posición inicial (todos juntos)
          const initialCol = i % 10;
          const initialRow = Math.floor(i / 10);
          const initialX = startX + initialCol * spacing;
          const initialY = startY + initialRow * spacing;
          
          // Calcular posición final (en grupos)
          const groupRow = Math.floor(adjustedGroupIndex / 3);
          const groupCol = adjustedGroupIndex % 3;
          
          const boxWidth = spacing * (elementsPerGroup + 1);
          const boxHeight = spacing * 3;
          const boxX = startX + groupCol * (boxWidth + spacing * 2);
          
          // Ajustar boxY para que aparezca debajo de la torta
          const boxY = startY + 170 + groupRow * (boxHeight + spacing);
          
          // Posición dentro del grupo
          const itemCol = itemInGroup % 3;
          const itemRow = Math.floor(itemInGroup / 3);
          const finalX = boxX + spacing + itemCol * spacing;
          const finalY = boxY + spacing + itemRow * spacing;
          
          // Retrasar el movimiento de cada elemento para un efecto cascada
          const delay = i / totalElements * 0.3;
          const elementProgress = Math.max(0, Math.min(1, (groupingProgress - delay - 0.4) * 1.5));
          
          // Interpolar entre posición inicial y final
          const x = initialX + (finalX - initialX) * elementProgress;
          const y = initialY + (finalY - initialY) * elementProgress;
          
          // Sound for every 5th element moving
          if (elementProgress > 0 && elementProgress < 0.1 && i % 5 === 0 && audioEnabled) {
            playSound('POP', 0.5, 0.8 + (i / totalElements));
          }
          
          // Colorear cada grupo diferente
          const colors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#795548', '#009688'];
          const targetColor = colors[adjustedGroupIndex % colors.length];
          
          // Transición de color
          const currentColor = fadeColor('#4CAF50', targetColor, elementProgress);
          ctx.fillStyle = currentColor;
          
          // Dibujar el elemento
          ctx.beginPath();
          ctx.arc(x, y, circleRadius, 0, 2 * Math.PI);
          ctx.fill();
          
          // Añadir número a cada elemento
          if (elementProgress > 0.5) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${i+1}`, x, y + 3);
          }
        }
        
        // Mostrar resultado y explicación
        if (groupingProgress > 0.85) {
          const resultOpacity = Math.min(1, (groupingProgress - 0.85) * 6.67);
          
          // Play sound for result
          if (resultOpacity < 0.1 && audioEnabled) {
            playSound('SUCCESS', 0.4, 1.0);
          }
          
          // Texto de explicación
          ctx.fillStyle = `rgba(51, 51, 51, ${resultOpacity})`;
          ctx.font = 'bold 22px Arial';
          ctx.textAlign = 'center';
          
          // Formula visual clara
          const formula = `${num1} ÷ ${num2} = ${result}`;
          
          // Explicación adaptada a niños
          let explanation;
          if (num1 % num2 === 0) {
            explanation = `Cada grupo tiene exactamente ${result} elementos`;
          } else {
            explanation = `Cada grupo tiene ${Math.floor(result)} elementos y sobran ${num1 % num2}`;
          }
          
          // Fondo para los textos
          if (resultOpacity > 0.3) {
            // Para la fórmula
            const formulaWidth = ctx.measureText(formula).width;
            ctx.fillStyle = `rgba(255, 255, 255, ${resultOpacity * 0.9})`;
            ctx.fillRect(width/2 - formulaWidth/2 - 10, height - 80, formulaWidth + 20, 35);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(width/2 - formulaWidth/2 - 10, height - 80, formulaWidth + 20, 35);
            
            // Para la explicación
            const explanationWidth = ctx.measureText(explanation).width;
            ctx.fillStyle = `rgba(255, 255, 255, ${resultOpacity * 0.9})`;
            ctx.fillRect(width/2 - explanationWidth/2 - 10, height - 40, explanationWidth + 20, 35);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(width/2 - explanationWidth/2 - 10, height - 40, explanationWidth + 20, 35);
          }
          
          // Textos
          ctx.fillStyle = `rgba(51, 51, 51, ${resultOpacity})`;
          ctx.font = 'bold 22px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(formula, width/2, height - 55);
          
          ctx.font = 'bold 18px Arial';
          ctx.fillText(explanation, width/2, height - 15);
        }
      }
    }
  };

  // Función para mezclar colores durante la transición
  const fadeColor = (color1, color2, progress) => {
    // Convertir colores hexadecimales a RGB
    const hex2rgb = (hex) => {
      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);
      return [r, g, b];
    };
    
    // Si alguno de los colores no es hexadecimal, devolverlo directamente
    if (!color1.startsWith('#') || !color2.startsWith('#')) {
      return progress < 0.5 ? color1 : color2;
    }
    
    const [r1, g1, b1] = hex2rgb(color1);
    const [r2, g2, b2] = hex2rgb(color2);
    
    const r = Math.round(r1 + (r2 - r1) * progress);
    const g = Math.round(g1 + (g2 - g1) * progress);
    const b = Math.round(b1 + (b2 - b1) * progress);
    
    return `rgb(${r},${g},${b})`;
  };

  // Función para obtener colores para la multiplicación
  const getMultiplicationColor = (rowIndex, totalRows) => {
    // Crear un degradado de colores para cada fila
    const baseHue = 120; // Verde
    const hueRange = 240; // Hasta púrpura
    
    const hue = baseHue + (hueRange * rowIndex / totalRows);
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Función auxiliar para dibujar un gráfico circular (torta) para la visualización de división
  const drawPieChart = (ctx, centerX, centerY, radius, parts, selectedParts, colors, progress, showLabels = true) => {
    const totalAngle = Math.PI * 2;
    const anglePerPart = totalAngle / parts;
    
    // Fondo de la torta completa (círculo gris claro)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, totalAngle);
    ctx.fillStyle = '#f0f0f0';
    ctx.fill();
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Dibuja las divisiones de la torta
    for (let i = 0; i < parts; i++) {
      const startAngle = i * anglePerPart - Math.PI/2;
      const endAngle = startAngle + anglePerPart;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.strokeStyle = '#777';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Animación de las partes seleccionadas
    const partsToShow = Math.min(selectedParts, Math.floor(selectedParts * progress * 1.5));
    const partialProgress = (selectedParts * progress * 1.5) - Math.floor(selectedParts * progress * 1.5);
    
    for (let i = 0; i < partsToShow; i++) {
      const startAngle = i * anglePerPart - Math.PI/2;
      const endAngle = startAngle + anglePerPart;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      // Alternar colores para mejor visualización
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
    }
    
    // Mostrar la parte parcial final
    if (partialProgress > 0 && partsToShow < selectedParts) {
      const startAngle = partsToShow * anglePerPart - Math.PI/2;
      const endAngle = startAngle + (anglePerPart * partialProgress);
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      ctx.fillStyle = colors[partsToShow % colors.length];
      ctx.fill();
    }
    
    // Etiquetas para las secciones
    if (showLabels && progress > 0.7) {
      ctx.fillStyle = '#333';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      for (let i = 0; i < parts; i++) {
        const angle = i * anglePerPart + (anglePerPart / 2) - Math.PI/2;
        const labelRadius = radius * 0.75;
        const x = centerX + Math.cos(angle) * labelRadius;
        const y = centerY + Math.sin(angle) * labelRadius;
        
        // Etiqueta con el número de parte
        ctx.fillText(`${i+1}`, x, y);
      }
      
      // Etiqueta en el centro
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`${selectedParts}/${parts}`, centerX, centerY);
    }
  };

  return (
    <div className="operation-result-container" style={{ borderColor: operation.color }}>
      <div className="result-header" style={{ backgroundColor: operation.color }}>
        <h3>Resultado: {computedResult}</h3>
        <div className="controls">
          <button 
            className={`control-button ${audioEnabled ? 'active' : 'inactive'}`}
            onClick={toggleAudio}
            title={audioEnabled ? "Desactivar sonido" : "Activar sonido"}
          >
            {audioEnabled ? '🔊' : '🔇'}
          </button>
          <button 
            className="control-button"
            onClick={restartAnimation}
            disabled={isAnimating}
            title="Repetir animación"
          >
            🔄
          </button>
        </div>
      </div>
      
      <div className="result-content">
        <div className="result-text">
          <p className="explanation">{explanation}</p>
          <div className="expression">
            <span className="number">{firstNumber}</span>
            <span className="operation-symbol" style={{ color: operation.color }}>{operation.symbol}</span>
            <span className="number">{secondNumber}</span>
            <span className="equals">=</span>
            <span className="result-number" style={{ color: operation.color }}>{computedResult}</span>
          </div>
        </div>
        
        <div className="result-visualization">
          <canvas 
            ref={canvasRef} 
            width="550" 
            height="600" 
            className="visualization-canvas"
          />
        </div>
      </div>
    </div>
  );
};

export default OperationResult; 