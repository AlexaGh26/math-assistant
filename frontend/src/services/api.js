// Configuración de API
const API_URL = 'http://localhost:8000/api';
const WS_URL = 'ws://localhost:8000/ws';

/**
 * Envía una pregunta al API y obtiene la respuesta
 * @param {string} question - La pregunta del usuario
 * @returns {Promise<Object>} - Objeto con la respuesta y posible visualización
 */
export const processQuestion = async (question) => {
  try {
    const response = await fetch(`${API_URL}/question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al procesar la pregunta:', error);
    throw error;
  }
};

/**
 * Configura una conexión WebSocket con el servidor
 * @returns {WebSocket} - Conexión WebSocket
 */
export const setupWebSocket = () => {
  try {
    const socket = new WebSocket(WS_URL);
    
    socket.onopen = () => {
      console.log('Conexión WebSocket establecida');
    };
    
    socket.onerror = (error) => {
      console.error('Error en la conexión WebSocket:', error);
    };
    
    socket.onclose = () => {
      console.log('Conexión WebSocket cerrada');
    };
    
    return socket;
  } catch (error) {
    console.error('Error al configurar WebSocket:', error);
    throw error;
  }
}; 