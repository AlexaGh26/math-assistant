/**
 * Servicio para interactuar con modelos de lenguaje a través del backend
 * @module ollamaService
 */

import axios from 'axios';

/**
 * Configuración básica
 */
const BACKEND_API_URL = 'http://localhost:8000/api';
const DEFAULT_MODEL = 'llama3';

/**
 * Envía una consulta al backend y devuelve la respuesta del modelo
 * @param {string} prompt - La pregunta o prompt del usuario
 * @param {string} model - El modelo a utilizar (opcional)
 * @returns {Promise<string>} - La respuesta del modelo
 */
export const generateResponse = async (prompt, model = DEFAULT_MODEL) => {
  try {
    const response = await axios.post(`${BACKEND_API_URL}/question`, {
      question: prompt,
      model: model
    }, {
      timeout: 10000
    });

    if (response.data && response.data.response) {
      return response.data.response;
    }
    
    throw new Error('Respuesta no válida del servidor');
  } catch (backendError) {
    return getFallbackResponse(prompt);
  }
};

/**
 * Obtiene la lista de modelos disponibles desde el backend
 * @returns {Promise<Array>} - Lista de modelos disponibles
 */
export const getAvailableModels = async () => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/models`, {
      timeout: 5000
    });

    if (response.data && response.data.models) {
      return response.data.models;
    }
    
    return getFallbackModels();
  } catch (error) {
    return getFallbackModels();
  }
};

/**
 * Extrae una expresión matemática del texto
 * @param {string} text - Texto de la pregunta
 * @returns {Object|null} - Objeto con los números y la operación, o null si no se encuentra
 * @private
 */
const extractMathExpression = (text) => {
  const patterns = [
    /(\d+)\s*\+\s*(\d+)/,
    /(\d+)\s*\-\s*(\d+)/,
    /(\d+)\s*(?:\*|x|×)\s*(\d+)/,
    /(\d+)\s*(?:\/|÷)\s*(\d+)/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const num1 = parseInt(match[1]);
      const num2 = parseInt(match[2]);
      let operation;
      
      if (text.includes('+')) operation = '+';
      else if (text.includes('-')) operation = '-';
      else if (text.includes('*') || text.includes('x') || text.includes('×')) operation = '*';
      else if (text.includes('/') || text.includes('÷')) operation = '/';
      
      return { num1, operation, num2 };
    }
  }
  
  const naturalPatterns = [
    /cuánto\s+es\s+(\d+)\s+(?:más|mas|suma(?:do)?)\s+(\d+)/i,
    /cuánto\s+es\s+(\d+)\s+(?:menos|resta(?:do)?)\s+(\d+)/i,
    /cuánto\s+es\s+(\d+)\s+(?:por|multiplicado por|multiplicar|x)\s+(\d+)/i,
    /cuánto\s+es\s+(\d+)\s+(?:entre|dividido por|dividir|÷)\s+(\d+)/i
  ];
  
  const operations = ['+', '-', '*', '/'];
  
  for (let i = 0; i < naturalPatterns.length; i++) {
    const match = text.match(naturalPatterns[i]);
    if (match) {
      return {
        num1: parseInt(match[1]),
        operation: operations[i],
        num2: parseInt(match[2])
      };
    }
  }
  
  return null;
};

/**
 * Proporciona respuestas predefinidas basadas en palabras clave
 * para cuando no hay conexión con el backend
 * @param {string} question - La pregunta del usuario
 * @returns {string} - Respuesta predefinida
 * @private
 */
const getFallbackResponse = (question) => {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('suma') || lowerQuestion.includes('sumar') || lowerQuestion.includes('más') || lowerQuestion.includes('mas')) {
    return 'La suma es una operación matemática que consiste en combinar dos o más números en un solo número, llamado suma o total. Por ejemplo: 5 + 3 = 8. Para sumar, juntamos las cantidades y contamos el total.';
  } 
  
  if (lowerQuestion.includes('resta') || lowerQuestion.includes('restar') || lowerQuestion.includes('menos')) {
    return 'La resta es una operación matemática que consiste en encontrar la diferencia entre dos números. Por ejemplo: 9 - 4 = 5. Para restar, quitamos una cantidad de otra y vemos cuánto queda.';
  }
  
  if (lowerQuestion.includes('multiplic') || lowerQuestion.includes('por') || lowerQuestion.includes('veces')) {
    return 'La multiplicación es una forma abreviada de sumar un número varias veces. Por ejemplo: 4 × 3 = 12, que es lo mismo que 4 + 4 + 4 = 12. Es una forma rápida de calcular sumas repetidas.';
  }
  
  if (lowerQuestion.includes('divi') || lowerQuestion.includes('entre') || lowerQuestion.includes('repartir')) {
    return 'La división es una operación que consiste en averiguar cuántas veces un número (divisor) está contenido en otro número (dividendo). Por ejemplo: 10 ÷ 2 = 5. Significa repartir en partes iguales.';
  }
  
  if (lowerQuestion.includes('fracci') || lowerQuestion.includes('quebrado')) {
    return 'Una fracción representa una parte de un todo. Tiene un numerador (arriba) que indica cuántas partes tenemos, y un denominador (abajo) que indica el total de partes en que se divide el todo. Por ejemplo, en 3/4, tenemos 3 partes de 4 en total.';
  }
  
  const mathExpression = extractMathExpression(lowerQuestion);
  if (mathExpression) {
    const { num1, operation, num2 } = mathExpression;
    let result;
    
    if (operation === '+') result = num1 + num2;
    else if (operation === '-') result = num1 - num2;
    else if (operation === '*' || operation === 'x') result = num1 * num2;
    else if (operation === '/' && num2 !== 0) result = num1 / num2;
    else if (operation === '/' && num2 === 0) return "No puedo dividir entre cero, eso no está definido en matemáticas.";
    
    if (result !== undefined) {
      if (!Number.isInteger(result)) result = parseFloat(result.toFixed(2));
      return `El resultado de ${num1} ${operation} ${num2} es ${result}.`;
    }
  }
  
  return 'Puedo ayudarte con matemáticas básicas como sumas, restas, multiplicaciones y divisiones. También puedes preguntarme sobre conceptos matemáticos o usar los botones de operaciones para practicar de forma visual e interactiva.';
};

/**
 * Proporciona una lista de modelos predeterminados si no se pueden obtener del backend
 * @returns {Array} - Lista de modelos predeterminados
 * @private
 */
const getFallbackModels = () => {
  return [
    { name: 'llama3', tag: 'llama3' },
    { name: 'mistral', tag: 'mistral' },
    { name: 'local', tag: 'local' }
  ];
}; 