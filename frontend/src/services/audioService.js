// Audio service for managing sound effects in animations
let audioEnabled = true;

// Audio cache to prevent reloading the same sounds
const audioCache = {};

// Define sound paths
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
 * Preload all audio files
 */
const preloadSounds = () => {
  Object.values(SOUNDS).forEach(soundPath => {
    getAudio(soundPath);
  });
};

/**
 * Get or create an audio object for a sound path
 * @param {string} soundPath - Path to sound file
 * @returns {HTMLAudioElement} Audio element
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
 * Play a sound effect
 * @param {string} soundName - Name of sound from SOUNDS object
 * @param {number} volume - Volume level (0.0 to 1.0)
 * @param {number} playbackRate - Speed of playback (0.5 to 2.0)
 */
const playSound = (soundName, volume = 1.0, playbackRate = 1.0) => {
  if (!audioEnabled) return;
  
  const soundPath = SOUNDS[soundName];
  if (!soundPath) return;
  
  const audio = getAudio(soundPath);
  
  // Clone the audio to allow multiple overlapping instances
  const audioClone = audio.cloneNode();
  audioClone.volume = volume;
  audioClone.playbackRate = playbackRate;
  
  audioClone.play().catch(err => {
    console.warn('Error playing sound:', err);
  });
};

/**
 * Enable or disable audio
 * @param {boolean} enabled - Whether audio should be enabled
 */
const setAudioEnabled = (enabled) => {
  audioEnabled = enabled;
};

/**
 * Check if audio is currently enabled
 * @returns {boolean} - Whether audio is enabled
 */
const isAudioEnabled = () => audioEnabled;

export {
  playSound,
  setAudioEnabled,
  isAudioEnabled,
  preloadSounds,
  SOUNDS
}; 