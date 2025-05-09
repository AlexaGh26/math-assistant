/**
 * Servicio para gestionar los efectos de sonido en la aplicación
 * @module audioService
 */

// Constantes y estado
let audioEnabled = true;
let globalVolume = 0.5; // Valor de volumen global entre 0.0 y 1.0
const audioCache = {};

/**
 * Definición de rutas a archivos de sonido
 */
const SOUNDS = {
  POP: '/sounds/pop.mp3',
  WHOOSH: '/sounds/whoosh.mp3',
  CLAP: '/sounds/clap.mp3',
  SUCCESS: '/sounds/success.mp3',
  SUBTRACT: '/sounds/subtract.mp3',
  NEGATIVE: '/sounds/negative.mp3',
  COUNT: '/sounds/count.mp3',
  ADD: '/sounds/add.mp3'
};

/**
 * Precarga todos los archivos de audio al iniciar la aplicación
 * para mejorar la experiencia del usuario evitando retrasos
 */
const preloadSounds = () => {
  Object.values(SOUNDS).forEach(soundPath => {
    getAudio(soundPath);
  });
};

/**
 * Obtiene o crea un objeto de audio para una ruta de sonido
 * @param {string} soundPath - Ruta al archivo de sonido
 * @returns {HTMLAudioElement} Elemento de audio
 * @private
 */
const getAudio = (soundPath) => {
  if (!audioCache[soundPath]) {
    const audio = new Audio(soundPath);
    audio.preload = 'auto';
    audioCache[soundPath] = audio;
  }
  return audioCache[soundPath];
};

/**
 * Reproduce un efecto de sonido
 * @param {string} soundName - Nombre del sonido del objeto SOUNDS
 * @param {number} volume - Nivel de volumen (0.0 a 1.0)
 * @param {number} playbackRate - Velocidad de reproducción (0.5 a 2.0)
 */
const playSound = (soundName, volume = 1.0, playbackRate = 1.0) => {
  if (!audioEnabled) return;
  
  const soundPath = SOUNDS[soundName];
  if (!soundPath) return;
  
  const audio = getAudio(soundPath);
  
  const audioClone = audio.cloneNode();
  audioClone.volume = volume * globalVolume; // Ajustar volumen según volumen global
  audioClone.playbackRate = playbackRate;
  
  audioClone.play().catch(err => {});
};

/**
 * Activa o desactiva el audio en toda la aplicación
 * @param {boolean} enabled - Si el audio debe estar habilitado
 */
const setAudioEnabled = (enabled) => {
  audioEnabled = enabled;
};

/**
 * Establece el nivel de volumen global para todos los sonidos
 * @param {number} volume - Nivel de volumen entre 0.0 y 1.0
 */
const setGlobalVolume = (volume) => {
  globalVolume = Math.max(0, Math.min(1, volume)); // Asegurar que está entre 0 y 1
};

/**
 * Verifica si el audio está actualmente habilitado
 * @returns {boolean} - Si el audio está habilitado
 */
const isAudioEnabled = () => audioEnabled;

export {
  playSound,
  setAudioEnabled,
  setGlobalVolume,
  isAudioEnabled,
  preloadSounds,
  SOUNDS
}; 