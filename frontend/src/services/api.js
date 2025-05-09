// Configuración de API
const API_URL = 'http://localhost:8000/api';
const WS_URL = 'ws://localhost:8000/ws';

/**
 * Envía una pregunta al API y obtiene la respuesta
 * @param {string} question - La pregunta del usuario
 * @param {string} [model="local"] - El modelo a utilizar para procesar la pregunta
 * @returns {Promise<Object>} - Objeto con la respuesta y posible visualización
 */
export const processQuestion = async (question, model = "local") => {
  try {
    const response = await fetch(`${API_URL}/question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, model }),
    });

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene la lista de modelos disponibles del API
 * @returns {Promise<Array>} - Lista de modelos disponibles
 */
export const getAvailableModels = async () => {
  try {
    const response = await fetch(`${API_URL}/models`);
    
    if (!response.ok) {
      throw new Error(`Error al obtener modelos: ${response.status}`);
    }
    
    const data = await response.json();
    return data.models || [];
  } catch (error) {
    return [{ name: "local", tag: "local" }];
  }
};

/**
 * Configura una conexión WebSocket con el servidor
 * @returns {WebSocket} - Conexión WebSocket
 */
export const setupWebSocket = () => {
  try {
    const socket = new WebSocket(WS_URL);
    
    socket.onopen = () => {};
    
    socket.onerror = (error) => {};
    
    socket.onclose = () => {};
    
    return socket;
  } catch (error) {
    throw error;
  }
}; 