/**
 * Verifica si Web Speech API está disponible en el navegador
 * @returns {boolean} - true si está disponible, false si no
 */
export const isSpeechSupported = () => {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
};

/**
 * Reproduce texto utilizando la API de síntesis de voz del navegador
 * @param {string} text - Texto a reproducir
 * @returns {boolean} - true si se inició la reproducción, false si hubo error
 */
export const speak = (text) => {
  if (!isSpeechSupported()) {
    console.error('Web Speech API no está soportada en este navegador');
    return false;
  }
  
  try {
    // Detener cualquier voz que esté reproduciéndose
    window.speechSynthesis.cancel();
    
    // Sanitizar el texto
    const processedText = text ? text.replace(/undefined/g, '') : ''; 
    if (!processedText) {
      console.warn('Texto vacío, no hay nada que decir');
      return false;
    }
    
    // Crear el objeto utterance
    const utterance = new SpeechSynthesisUtterance(processedText);
    
    // Configurar parámetros básicos
    utterance.lang = 'es-ES';
    utterance.rate = 1.5; 
    utterance.pitch = 2;
    utterance.volume = 1.0;
    
    utterance.onstart = () => console.log('La voz comenzó a hablar');
    utterance.onend = () => console.log('La voz terminó de hablar');
    utterance.onerror = (event) => console.error('Error en la síntesis de voz:', event);
    
    let voices = window.speechSynthesis.getVoices();
    
    if (voices.length === 0) {
      window.speechSynthesis.cancel();
      
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        voices = window.speechSynthesis.getVoices();
        
        if (voices.length > 0) {
          setChildFriendlyVoice(utterance, voices);
          window.speechSynthesis.speak(utterance);
        } else {
          console.warn('No se encontraron voces disponibles después del evento voiceschanged');
          window.speechSynthesis.speak(utterance); // Intentar hablar con la voz predeterminada
        }
      }, { once: true });
    } else {
      setChildFriendlyVoice(utterance, voices);
      window.speechSynthesis.speak(utterance);
    }
    
    // Solución para el bug de Chrome donde el audio se detiene después de ~15 segundos
    const resumeSpeechEvery5Seconds = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(resumeSpeechEvery5Seconds);
        return;
      }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 5000);
    
    // Limpiar el intervalo cuando se completa la reproducción
    utterance.onend = () => {
      clearInterval(resumeSpeechEvery5Seconds);
    };
    
    return true;
  } catch (error) {
    console.error('Error al iniciar la síntesis de voz:', error);
    return false;
  }
};

/**
 * Detiene cualquier reproducción de voz en curso
 * @returns {boolean} - true si se detuvo correctamente, false si ocurrió un error
 */
export const stopSpeaking = () => {
  if (!isSpeechSupported()) {
    return false;
  }
  
  try {
    window.speechSynthesis.cancel();
    return true;
  } catch (error) {
    console.error('Error al detener la síntesis de voz:', error);
    return false;
  }
};

/**
 * Verifica si hay una voz reproduciéndose actualmente
 * @returns {boolean} - true si hay una voz reproduciéndose, false si no
 */
export const isSpeaking = () => {
  if (!isSpeechSupported()) {
    return false;
  }
  
  try {
    return window.speechSynthesis.speaking;
  } catch (error) {
    console.error('Error al verificar si la voz está hablando:', error);
    return false;
  }
};

/**
 * Intenta encontrar y configurar una voz amigable para niños
 * @param {SpeechSynthesisUtterance} utterance - Objeto utterance a modificar
 * @param {Array} voices - Lista de voces disponibles
 * @private
 */
const setChildFriendlyVoice = (utterance, voices) => {
  if (!voices || voices.length === 0) {
    console.warn('No hay voces disponibles para seleccionar');
    return;
  }
  
  let selectedVoice = null;
  
  selectedVoice = voices.find(voice => 
    voice.lang.startsWith('es') && 
    (voice.name.toLowerCase().includes('Infantil') || 
     voice.name.toLowerCase().includes('niño') || 
     voice.name.toLowerCase().includes('kids') || 
     voice.name.toLowerCase().includes('child'))
  );
  
  if (!selectedVoice) {
    selectedVoice = voices.find(voice => voice.lang.startsWith('es'));
  }
  if (!selectedVoice && voices.length > 0) {
    selectedVoice = voices[0];
  }
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  } else {
    console.warn('No se pudo seleccionar ninguna voz');
  }
}; 