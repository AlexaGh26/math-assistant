/**
 * Verifica si Web Speech API está disponible en el navegador
 * @returns {boolean} - true si está disponible, false si no
 */
export const isSpeechSupported = () => {
  return 'speechSynthesis' in window;
};

/**
 * Reproduce texto utilizando la API de síntesis de voz del navegador
 * @param {string} text - Texto a reproducir
 * @returns {boolean} - true si se inició la reproducción, false si hubo error
 */
export const speak = (text) => {
  if (!isSpeechSupported()) {
    console.error('Web Speech API no disponible en este navegador');
    return false;
  }
  
  // Detener cualquier habla anterior
  window.speechSynthesis.cancel();
  
  // Preprocesar el texto para evitar problemas con "undefined"
  const processedText = text.replace(/undefined/g, '');
  
  const utterance = new SpeechSynthesisUtterance(processedText);
  
  // Configurar voz y propiedades para una voz infantil
  utterance.lang = 'es-ES';  // Español
  utterance.rate = 0.9;     // Velocidad moderada para mejor comprensión
  utterance.pitch = 1.1;     // Tono más alto para simular voz infantil
  utterance.volume = 1.0;    // Volumen normal
  
  // No usamos addPauses para evitar problemas con SSML
  // Las pausas naturales ocurrirán con puntuación normal
  
  // Obtener voces disponibles
  let voices = window.speechSynthesis.getVoices();
  
  // Si las voces aún no están disponibles, esperar el evento voiceschanged
  if (voices.length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      voices = window.speechSynthesis.getVoices();
      setChildFriendlyVoice(utterance, voices);
      window.speechSynthesis.speak(utterance);
    }, { once: true });
  } else {
    setChildFriendlyVoice(utterance, voices);
    window.speechSynthesis.speak(utterance);
  }
  
  return true;
};

/**
 * Detiene cualquier reproducción de voz en curso
 * @returns {boolean} - true si se detuvo correctamente, false si ocurrió un error
 */
export const stopSpeaking = () => {
  if (!isSpeechSupported()) {
    console.error('Web Speech API no disponible en este navegador');
    return false;
  }
  
  try {
    window.speechSynthesis.cancel();
    return true;
  } catch (error) {
    console.error('Error al detener la reproducción de voz:', error);
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
  
  return window.speechSynthesis.speaking;
};

/**
 * Intenta encontrar y configurar una voz amigable para niños
 * @param {SpeechSynthesisUtterance} utterance - Objeto utterance a modificar
 * @param {Array} voices - Lista de voces disponibles
 */
const setChildFriendlyVoice = (utterance, voices) => {
  // Voces preferidas para niños (en orden de preferencia)
  const preferredVoices = [
    // Intentar encontrar voces específicas con nombres conocidos para voces infantiles
    voices.find(voice => voice.name.includes('Infantil') && voice.lang.startsWith('es')),
    voices.find(voice => voice.name.includes('Kids') && voice.lang.startsWith('es')),
    voices.find(voice => voice.name.includes('Child') && voice.lang.startsWith('es')),
    // Buscar una voz femenina en español (suelen ser más claras para niños)
    voices.find(voice => voice.lang.startsWith('es') && voice.name.includes('female')),
    // Como último recurso, cualquier voz en español
    voices.find(voice => voice.lang.startsWith('es')),
    // Si nada funciona, simplemente usar la primera voz disponible
    voices[0]
  ];
  
  // Usar la primera voz disponible en el orden de preferencia
  const selectedVoice = preferredVoices.find(voice => voice !== undefined);
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    console.log('Usando voz:', selectedVoice.name);
  }
}; 