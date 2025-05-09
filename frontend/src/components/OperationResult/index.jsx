import React, { useEffect, useRef, useState } from 'react';
import { speak, stopSpeaking, isSpeaking } from '../../services/speechService';
import { playSound, setAudioEnabled, isAudioEnabled, SOUNDS } from '../../services/audioService';
import './styles.css';

const OperationResult = ({ result }) => {
  console.log('OperationResult recibió result:', result);

  const canvasRef = useRef(null);
  // Validar que result contiene todos los datos necesarios
  if (!result || !result.operation) {
    console.error('Error: result o result.operation es undefined', result);
    return <div className="error-message">Error: No se pudo cargar el resultado de la operación</div>;
  }
  
  const { firstNumber, secondNumber, operation, result: computedResult, explanation } = result;
  
  console.log('OperationResult desestructuró operation:', operation);

  const [animationFrame, setAnimationFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false); // Track if animation has played once
  const [audioEnabled, setAudioEnabledState] = useState(true); // Track audio state
  const animationRef = useRef(null);
  const animationStartTimeRef = useRef(null); // Track animation start time for better timing
  const prevResultRef = useRef(null); // Para almacenar el resultado anterior
  const soundTimeoutsRef = useRef([]); // Track sound timeouts for cleanup

  // Comprobar periódicamente si la síntesis de voz está activa
  useEffect(() => {
    const checkSpeaking = () => {
      setIsSpeakingNow(isSpeaking());
    };
    
    // Comprobar inicialmente
    checkSpeaking();
    
    // Configurar intervalo para comprobar el estado de la voz
    const interval = setInterval(checkSpeaking, 300);
    
    return () => clearInterval(interval);
  }, []);

  // Initialize audio state
  useEffect(() => {
    setAudioEnabledState(isAudioEnabled());
  }, []);

  // Update global audio state when local state changes
  useEffect(() => {
    setAudioEnabled(audioEnabled);
  }, [audioEnabled]);

  // Cleanup sound timeouts on unmount
  useEffect(() => {
    return () => {
      soundTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      soundTimeoutsRef.current = [];
    };
  }, []);

  // Reproducir explicación por voz cuando se obtiene un resultado
  useEffect(() => {
    if (explanation) {
      speak(explanation);
      setIsSpeakingNow(true);
    }
  }, [explanation]);

  // Helper function to schedule sounds with animation
  const scheduleSound = (soundName, delayMs, volume = 1.0, rate = 1.0) => {
    if (!audioEnabled) return;
    
    const timeout = setTimeout(() => {
      // Use normal volume for all sounds including POP sounds
      playSound(soundName, volume, rate);
    }, delayMs);
    
    soundTimeoutsRef.current.push(timeout);
    return timeout;
  };

  // Función para reiniciar la animación
  const restartAnimation = () => {
    if (isAnimating) return;
    
    // Limpiar cualquier animación anterior
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Clear any scheduled sounds
    soundTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    soundTimeoutsRef.current = [];
    
    // Reiniciar el estado de la animación
    setAnimationFrame(0);
    setIsAnimating(true);
    setHasPlayed(false); // Reset hasPlayed a false para permitir la nueva animación
    
    // Play restart sound
    playSound('WHOOSH', 0.7, 1.2);
    
    // Reiniciar el canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Resetear la referencia de tiempo de inicio
    animationStartTimeRef.current = null;
  };

  // Function to toggle audio
  const toggleAudio = () => {
    setAudioEnabledState(!audioEnabled);
  };

  // Detectar cambios en el resultado y reiniciar la animación
  useEffect(() => {
    // Asegurarse de que operation existe y tiene id
    if (!operation || !operation.id) {
      console.error('Error: operation undefined o sin id en useEffect de OperationResult');
      return;
    }
    
    // Crear un objeto que represente la operación actual para comparación
    const currentResult = {
      firstNumber,
      secondNumber,
      operationId: operation.id,
      computedResult
    };
    
    console.log('En useEffect, currentResult:', currentResult);
    
    // Verificar si este es un nuevo resultado comparando con el anterior
    if (prevResultRef.current) {
      const prevResult = prevResultRef.current;
      
      // Si alguno de los valores ha cambiado, reiniciar la animación
      if (
        prevResult.firstNumber !== currentResult.firstNumber ||
        prevResult.secondNumber !== currentResult.secondNumber ||
        prevResult.operationId !== currentResult.operationId ||
        prevResult.computedResult !== currentResult.computedResult
      ) {
        // Reiniciar estados para una nueva animación
        setIsAnimating(true);
        setHasPlayed(false);
        
        // Limpiar animación previa si existe
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        
        // Clear any scheduled sounds
        soundTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        soundTimeoutsRef.current = [];
        
        // Play change sound
        playSound('WHOOSH', 0.6, 1.2);
        
        // Resetear tiempo de inicio
        animationStartTimeRef.current = null;
      }
    }
    
    // Actualizar la referencia al resultado actual
    prevResultRef.current = currentResult;
  }, [firstNumber, secondNumber, operation?.id, computedResult, audioEnabled]);

  // Iniciar la animación cuando se obtiene un resultado
  useEffect(() => {
    // Si ya jugó la animación y no estamos reiniciando, no reproducir de nuevo
    if (hasPlayed && !isAnimating) return;
    
    if (!canvasRef.current) return;
    
    // Limpiar cualquier animación anterior
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Clear any scheduled sounds
    soundTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    soundTimeoutsRef.current = [];
    
    // Marcar que la animación se ha reproducido
    setHasPlayed(true);
    
    // Schedule initial sound
    if (audioEnabled) {
      playSound('WHOOSH', 0.6, 1.0);
    }
    
    // Aseguramos que el canvas tenga las dimensiones correctas desde el inicio
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Pre-renderizar el primer frame con progreso 0 para evitar titileos
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    
    // Determinar qué animación renderizar según la operación
    const renderAnimation = (progress) => {
      if (!operation || !operation.id) {
        console.error('Error: operation undefined o sin id en renderAnimation');
        return;
      }
      
      console.log('renderAnimation con operation.id:', operation.id);
      
      switch (operation.id) {
        case 'suma':
          animateAddition(ctx, firstNumber, secondNumber, computedResult, canvas.width, canvas.height, operation.color, progress);
          break;
        case 'resta':
          animateSubtraction(ctx, firstNumber, secondNumber, computedResult, canvas.width, canvas.height, operation.color, progress);
          break;
        case 'multiplicacion':
          animateMultiplication(ctx, firstNumber, secondNumber, computedResult, canvas.width, canvas.height, operation.color, progress);
          break;
        case 'division':
          animateDivision(ctx, firstNumber, secondNumber, computedResult, canvas.width, canvas.height, operation.color, progress);
          break;
        default:
          console.error('Tipo de operación desconocido:', operation.id);
          break;
      }
    };
    
    // Schedule success sound at the end of animation
    scheduleSound('SUCCESS', 3000, 0.7);
    
    // Renderizar el primer frame con progreso 0
    renderAnimation(0);
    
    // Comenzar la animación con un pequeño retraso para estabilizar la visualización
    setTimeout(() => {
      // Comenzar la animación
      const startAnimation = () => {
        let frame = 0;
        
        const animate = (timestamp) => {
          // Inicializar tiempo de inicio si es la primera vez
          if (!animationStartTimeRef.current) {
            animationStartTimeRef.current = timestamp;
          }
          
          // Calcular progreso basado en el tiempo transcurrido para animación más suave
          const elapsed = timestamp - animationStartTimeRef.current;
          const progress = Math.min(elapsed / 3000, 1); // 3 segundos para la animación completa
          
          if (!canvasRef.current) return;
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Usar la función definida arriba para renderizar el frame actual
          renderAnimation(progress);
          
          setAnimationFrame(frame);
          
          frame++;
          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          } else {
            setIsAnimating(false);
          }
        };
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      startAnimation();
    }, 50); // Un pequeño retraso de 50ms para estabilizar
    
    // Limpiar la animación cuando el componente se desmonte
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Clear any scheduled sounds
      soundTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      soundTimeoutsRef.current = [];
    };
  }, [firstNumber, secondNumber, operation, computedResult, isAnimating, hasPlayed, audioEnabled]);

  // Manejador para el botón de hablar
  const handleSpeak = () => {
    speak(explanation);
    setIsSpeakingNow(true);
  };
  
  // Manejador para el botón de detener voz
  const handleStopSpeaking = () => {
    stopSpeaking();
    setIsSpeakingNow(false);
  };

  // Función para animar suma
  const animateAddition = (ctx, num1, num2, result, width, height, color, progress) => {
    // Definir constantes para posicionamiento - mantener estas constantes fuera de cualquier condicional
    const circleRadius = 15;
    const spacing = 45; // Aumentado para dar espacio a los números
    const startX = 50;
    const firstRowY = 60; // Ajustado al quitar el título superior
    const secondRowY = 130;
    const resultRowY = 250; // Aumentado para dar más espacio desde la línea
    
    // Calcular las dimensiones máximas necesarias (incluso para elementos que aún no son visibles)
    // Esto ayuda a evitar reajustes de espacio durante la animación
    const maxRowsFirstNumber = Math.ceil(num1 / 10);
    const maxRowsSecondNumber = Math.ceil(num2 / 10);
    const maxRowsResult = Math.ceil(result / 10);
    
    // Calculate current animation section for sound effects
    const isFirstSection = progress < 0.2;
    const isSecondSection = progress >= 0.2 && progress < 0.6;
    const isLineSection = progress >= 0.6 && progress < 0.8;
    const isResultSection = progress >= 0.8;
    
    // Sound effects for different sections
    // Only trigger once per section change
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
    
    // Dibujar segundo número con animación de entrada
    const secondNumberProgress = Math.max(0, Math.min(1, (progress - 0.2) * 2));
    ctx.fillStyle = '#2196F3';
    
    for (let i = 0; i < num2; i++) {
      if (i / num2 <= secondNumberProgress) {
        const x = startX + (i % 10) * spacing;
        const y = secondRowY + Math.floor(i / 10) * spacing;
        
        // Añadir efecto de aparición
        const scale = secondNumberProgress < 1 ? 
                     Math.min(1, 3 * (secondNumberProgress - i / num2)) : 1;
        
        if (scale > 0) {
          // Dibujar la bolita
          ctx.beginPath();
          ctx.arc(x, y, circleRadius * scale, 0, 2 * Math.PI);
          ctx.fill();
          
          // Añadir número si la bolita ya está casi completa
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

  // Función para animar resta
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
      playSound('WHOOSH', 0.5, 1.1);
    }
    
    if (removingPhase && progress < 0.61 && audioEnabled) {
      playSound('SUBTRACT', 0.7, 1.0);
      
      // If result is negative, add a special sound effect
      if (isNegative) {
        scheduleSound('NEGATIVE', 300, 0.6, 0.9);
      }
    }
    
    if (resultPhase && progress < 0.81 && audioEnabled) {
      // Different sound for positive vs negative results
      if (isNegative) {
        playSound('NEGATIVE', 0.7, 1.0);
      } else {
        playSound('COUNT', 0.7, 1.0);
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
          scheduleSound('SUBTRACT', delay, 0.3, 1.5);
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
      
      // Mostrar el total del resultado arriba de las bolitas
      ctx.fillStyle = isNegative ? '#DC0000' : '#333';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Resultado: ${result}`, startX, resultRowY - 30);
        
      // Dibujar las bolitas del resultado (positivo o negativo)
      for (let i = 0; i < absResult; i++) {
        if (i / absResult <= resultProgress) {
          const x = startX + (i % 10) * spacing;
          const y = resultRowY + Math.floor(i / 10) * spacing;
          
          // Efecto de deslizamiento suave
          const slideY = y - (1 - resultProgress) * 20;
          
          // Play pop sound for each dot that appears - no limit to every 5th dot
          if (i / absResult <= resultProgress && 
              i / absResult > resultProgress - 0.05 && 
              audioEnabled) {
            const pitch = isNegative ? 0.8 : 1.0;
            playSound('POP', 0.5, pitch + (i / absResult / 5));
          }
          
          // Color de la bolita según si es resultado negativo o positivo
          ctx.fillStyle = isNegative ? '#DC0000' : '#9C27B0';
          
          // Dibujar la bolita
          ctx.beginPath();
          ctx.arc(x, slideY, circleRadius, 0, 2 * Math.PI);
          ctx.fill();
          
          // Añadir número junto a la bolita
          if (i / absResult <= resultProgress - 0.05) {
            ctx.fillStyle = isNegative ? '#FFFFFF' : '#000000'; // Color del texto según fondo
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${i+1}`, x, slideY - circleRadius - 5);
            // Restaurar color de bolitas
            ctx.fillStyle = isNegative ? '#DC0000' : '#9C27B0';
          }
        }
      }
      
      // Si el resultado es negativo, agregar una etiqueta de "negativo"
      if (isNegative && resultProgress > 0.9) {
        const labelOpacity = Math.min(1, (resultProgress - 0.9) * 10);
        ctx.fillStyle = `rgba(220, 0, 0, ${labelOpacity})`;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        
        // Colocar la etiqueta al lado de las bolitas
        const labelX = startX + (Math.min(absResult, 10) * spacing) + 10;
        const labelY = resultRowY + Math.floor(0 / 10) * spacing;
        
        ctx.fillText("← Representan números negativos", labelX, labelY);
      }
    }
    
    // Añadir texto explicativo
    if (progress > 0.9) {
      const text = `${num1} - ${num2} = ${result}`;
      ctx.font = 'bold 22px Arial';
      const textWidth = ctx.measureText(text).width;
      
      const textOpacity = Math.min(1, (progress - 0.9) * 10);
      
      // Fondo para el texto
      ctx.fillStyle = `rgba(255, 255, 255, ${textOpacity * 0.9})`;
      ctx.fillRect(width/2 - textWidth/2 - 10, 380, textWidth + 20, 35);
      ctx.strokeStyle = isNegative ? '#DC0000' : '#9C27B0';
      ctx.lineWidth = 2;
      ctx.strokeRect(width/2 - textWidth/2 - 10, 380, textWidth + 20, 35);
      
      // Texto
      ctx.fillStyle = isNegative ? `rgba(220, 0, 0, ${textOpacity})` : `rgba(51, 51, 51, ${textOpacity})`;
      ctx.textAlign = 'center';
      ctx.fillText(text, width / 2, 405);
    }
  };

  // Función para animar multiplicación
  const animateMultiplication = (ctx, num1, num2, result, width, height, color, progress) => {
    // Quitar el título y mostrar instrucción más clara
    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`Vamos a multiplicar ${num1} × ${num2}`, width / 2, 30);
    
    // Visualizar como una grilla
    const rectSize = 25;
    const padding = 5;
    const startX = (width - (num1 * (rectSize + padding))) / 2;
    const startY = 60;
    
    // Play sound effects for multiplication
    if (progress < 0.05 && audioEnabled) {
      playSound('WHOOSH', 0.7, 1.0);
    }
    
    // Dibujar grilla con animación por filas
    const rowsToShow = Math.floor(num2 * Math.min(1, progress * 1.5));
    
    // Contador para elementos totales mostrados
    let totalShown = 0;
    
    for (let i = 0; i < rowsToShow; i++) {
      // Calcular progreso para esta fila específica
      const rowProgress = Math.min(1, (progress * 1.5 * num2) - i);
      const columnsToShow = Math.floor(num1 * rowProgress);
      
      // Sound effect when new row starts
      if (i > 0 && columnsToShow === 1 && rowProgress < 0.2 && audioEnabled) {
        playSound('POP', 0.5, 1.0 + (i * 0.1));
      }
      
      for (let j = 0; j < columnsToShow; j++) {
        const x = startX + j * (rectSize + padding);
        const y = startY + i * (rectSize + padding);
        
        // Incrementar contador de elementos mostrados
        totalShown++;
        
        // Sound for each square (limit frequency to avoid audio overload)
        if (totalShown % 10 === 0 && rowProgress < 0.9 && audioEnabled) {
          playSound('POP', 0.5, 1.0 + (totalShown / (num1 * num2) / 2));
        }
        
        ctx.fillStyle = getMultiplicationColor(i, num2);
        
        // Agregar efecto de pulsación
        const pulseEffect = 1 + Math.sin(progress * 10 + i * 0.5 + j * 0.2) * 0.1;
        const currentSize = rectSize * pulseEffect;
        
        ctx.fillRect(
          x - (currentSize - rectSize) / 2, 
          y - (currentSize - rectSize) / 2, 
          currentSize, 
          currentSize
        );
        
        // Numerar cada elemento para mayor claridad
        if (rowProgress > 0.7) {
          ctx.fillStyle = 'white';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(totalShown, x + rectSize/2, y + rectSize/2 + 4);
        }
      }
    }
    
    // Mostrar las filas completadas con números
    if (progress > 0.6) {
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      
      const explanationX = startX + num1 * (rectSize + padding) + 20;
      const explanationY = startY + 20;
      
      // Mostrar explicación usando grupos
      for (let i = 0; i < rowsToShow; i++) {
        if (i < num2) {
          ctx.fillText(`${num1}`, explanationX, explanationY + i * (rectSize + padding));
        }
      }
      
      // Mostrar el signo +
      if (rowsToShow > 1) {
        const signsToShow = Math.min(rowsToShow - 1, num2 - 1);
        for (let i = 0; i < signsToShow; i++) {
          ctx.fillText(`+`, explanationX - 20, explanationY + (i + 0.5) * (rectSize + padding));
        }
      }
    }
    
    // Dibujar línea divisoria
    if (progress > 0.8) {
      const lineProgress = Math.min(1, (progress - 0.8) * 5);
      
      // Play line sound
      if (lineProgress < 0.1 && audioEnabled) {
        playSound('WHOOSH', 0.5, 0.8);
      }
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(50, startY + num2 * (rectSize + padding) + 20);
      ctx.lineTo(50 + (width - 100) * lineProgress, startY + num2 * (rectSize + padding) + 20);
      ctx.stroke();
    }
    
    // Mostrar resultado
    if (progress > 0.9) {
      const resultProgress = Math.min(1, (progress - 0.9) * 10);
      
      // Play success sound
      if (resultProgress < 0.1 && audioEnabled) {
        playSound('SUCCESS', 0.7, 1.0);
      }
      
      ctx.fillStyle = '#9C27B0';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      
      const finalY = startY + num2 * (rectSize + padding) + 50;
      
      // Calcular y mostrar el resultado correcto - Asegurarse de que se vea el resultado exacto al final
      // Animación de contador para el resultado
      const displayedResult = Math.floor(result * resultProgress);
      ctx.fillText(`= ${displayedResult}`, width / 2, finalY);
      
      // Añadir texto explicativo
      if (resultProgress > 0.9) {
        const text = `${num1} grupos de ${num2} = ${result}`;
        ctx.font = 'bold 22px Arial';
        const textWidth = ctx.measureText(text).width;
        
        // Fondo para el texto
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(width/2 - textWidth/2 - 10, finalY + 20, textWidth + 20, 35);
        ctx.strokeStyle = '#9C27B0';
        ctx.lineWidth = 2;
        ctx.strokeRect(width/2 - textWidth/2 - 10, finalY + 20, textWidth + 20, 35);
        
        // Texto
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText(text, width / 2, finalY + 45);
      }
    }
  };

  // Función para animar división
  const animateDivision = (ctx, num1, num2, result, width, height, color, progress) => {
    // Instrucción clara para niños
    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Vamos a repartir ${num1} elementos en ${num2} grupos iguales`, width / 2, 30);
    
    const circleRadius = 15;
    const spacing = 30;
    const startX = 50;
    const startY = 80;
    
    // Sound effect at start
    if (progress < 0.05 && audioEnabled) {
      playSound('WHOOSH', 0.7, 1.0);
    }
    
    // Limitar a 100 elementos máximo para visualización clara
    const totalElements = Math.min(num1, 100);
    
    // FASE 1: Mostrar todos los elementos juntos
    if (progress < 0.3) {
      const initialProgress = Math.min(1, progress * 3.33);
      const itemsToShow = Math.floor(totalElements * initialProgress);
      
      // Play pop sounds for elements appearing
      const prevItemsShown = Math.floor(totalElements * Math.max(0, (progress - 0.01) * 3.33));
      if (itemsToShow > prevItemsShown && audioEnabled) {
        playSound('POP', 0.5, 1.0 + (itemsToShow / totalElements));
      }
      
      // Mostrar elementos como caramelos o frutas para mayor atractivo visual
      ctx.fillStyle = '#4CAF50';
      for (let i = 0; i < itemsToShow; i++) {
        const col = i % 10;
        const row = Math.floor(i / 10);
        
        const x = startX + col * spacing;
        const y = startY + row * spacing;
        
        // Dibujar círculo con borde para simular caramelos
        ctx.beginPath();
        ctx.arc(x, y, circleRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Añadir número a cada elemento
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
        playSound('WHOOSH', 0.6, 1.2);
      }
      
      // Calcular cuántos elementos van en cada grupo
      const elementsPerGroup = Math.floor(num1 / num2);
      const remainder = num1 % num2;
      
      // Dibuja cajas/contenedores para los grupos primero
      if (groupingProgress > 0.1) {
        const boxProgress = Math.min(1, (groupingProgress - 0.1) * 2);
        
        // Sound for boxes appearing
        if (boxProgress < 0.1 && audioEnabled) {
          playSound('POP', 0.5, 0.8);
        }
        
        for (let g = 0; g < num2; g++) {
          const groupRow = Math.floor(g / 3);
          const groupCol = g % 3;
          
          const boxWidth = spacing * (elementsPerGroup + 1);
          const boxHeight = spacing * 3;
          const boxX = startX + groupCol * (boxWidth + spacing * 2);
          const boxY = startY + 120 + groupRow * (boxHeight + spacing);
          
          // Dibujar caja con opacidad creciente
          ctx.fillStyle = `rgba(240, 240, 240, ${boxProgress})`;
          ctx.strokeStyle = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${boxProgress})`;
          ctx.lineWidth = 2;
          
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
          ctx.fill();
          ctx.stroke();
          
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
        const boxY = startY + 120 + groupRow * (boxHeight + spacing);
        
        // Posición dentro del grupo
        const itemCol = itemInGroup % 3;
        const itemRow = Math.floor(itemInGroup / 3);
        const finalX = boxX + spacing + itemCol * spacing;
        const finalY = boxY + spacing + itemRow * spacing;
        
        // Retrasar el movimiento de cada elemento para un efecto cascada
        const delay = i / totalElements * 0.3;
        const elementProgress = Math.max(0, Math.min(1, (groupingProgress - delay) * 1.5));
        
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
          playSound('SUCCESS', 0.7, 1.0);
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

  return (
    <div className="operation-result">
      <h3 className="result-title">Resultado de la {operation?.name || 'operación'}</h3>
      
      <div className="result-display">
        <div className="result-equation" style={{ backgroundColor: operation.color }}>
          {firstNumber} {operation.symbol} {secondNumber} = {computedResult}
        </div>
      </div>
      
      <div className="visualization-container">
        <canvas 
          ref={canvasRef} 
          className="visualization-canvas" 
          width="700" 
          height="450" 
        />
      </div>
      
      <div className="explanation-box">
        <h4>Explicación:</h4>
        <p>{explanation}</p>
        
        <div className="button-container">
          {isSpeakingNow ? (
            <button 
              className="stop-button" 
              style={{ backgroundColor: '#d32f2f' }}
              onClick={handleStopSpeaking}
            >
              🔇 Detener voz
            </button>
          ) : (
            <button 
              className="speak-button"
              style={{ backgroundColor: operation.color }}
              onClick={handleSpeak}
            >
              🔊 Escuchar explicación
            </button>
          )}
          
          <button
            className="replay-button"
            style={{ backgroundColor: operation.color }}
            onClick={restartAnimation}
            disabled={isAnimating}
          >
            🔄 Repetir animación
          </button>
          
          <button
            className="audio-toggle-button"
            style={{ backgroundColor: audioEnabled ? '#4CAF50' : '#9e9e9e' }}
            onClick={toggleAudio}
          >
            {audioEnabled ? '🔊 Sonidos: Activados' : '🔇 Sonidos: Desactivados'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperationResult; 