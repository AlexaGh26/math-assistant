from fastapi import FastAPI, WebSocket, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import json
import asyncio
import re
import random
import requests
from typing import Optional, List, Dict, Any, Tuple, Union

# Configuración de la aplicación
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434/api"

# Datos de conocimiento matemático
MATH_TOPICS = {
    "suma": {
        "responses": [
            "La suma es una operación matemática que consiste en añadir dos o más números para obtener un resultado total. Se representa con el símbolo +.",
            "Cuando sumamos, estamos combinando cantidades para obtener un total. Es una de las operaciones básicas de la aritmética."
        ],
        "examples": ["24 + 35 = 59", "8 + 7 = 15", "45 + 38 = 83"],
    },
    "resta": {
        "responses": [
            "La resta es una operación que consiste en quitar una cantidad de otra para averiguar la diferencia entre ambas. Se representa con el símbolo -.",
            "Restar significa encontrar la diferencia entre dos números. Es la operación inversa a la suma."
        ],
        "examples": ["45 - 23 = 22", "32 - 15 = 17", "50 - 25 = 25"],
    },
    "multiplicacion": {
        "responses": [
            "La multiplicación es una operación matemática que consiste en sumar un número tantas veces como indica otro número. Se representa con el símbolo ×.",
            "Multiplicar significa repetir la suma de un número una cantidad determinada de veces, lo que nos permite abreviar el proceso de suma repetida."
        ],
        "examples": ["3 × 4 = 12", "5 × 6 = 30", "2 × 7 = 14"],
    }
}

# -------------------- ENDPOINTS API REST --------------------

@app.post("/api/question")
async def process_question(data: dict) -> Dict[str, Any]:
    """
    Endpoint para procesar preguntas de matemáticas.
    
    Args:
        data: Diccionario con los campos 'question' y 'model'
        
    Returns:
        Diccionario con la respuesta, estado y origen de la respuesta
    """
    question = data.get("question", "")
    model = data.get("model", "local")
    
    if model != "local":
        try:
            ollama_response = await query_ollama(question, model)
            return {
                "response": ollama_response,
                "status": "success",
                "source": "ollama"
            }
        except Exception as e:
            print(f"Error al usar Ollama: {e}")
    
    response, visualization = generate_response(question)
    
    return {
        "response": response,
        "visualization": visualization,
        "status": "success",
        "source": "local"
    }

@app.get("/api/models")
async def get_models() -> Dict[str, Any]:
    """
    Endpoint para obtener los modelos disponibles.
    
    Returns:
        Diccionario con la lista de modelos y el estado de la operación
    """
    models = [{"name": "local", "tag": "local"}]
    
    try:
        ollama_models = await get_ollama_models()
        if ollama_models:
            models.extend(ollama_models)
        return {"models": models, "status": "success"}
    except Exception as e:
        print(f"Error al obtener modelos de Ollama: {e}")
        return {"models": models, "status": "partial", "error": str(e)}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """
    Conexión WebSocket para comunicación en tiempo real.
    
    Args:
        websocket: Conexión WebSocket
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            data_json = json.loads(data)
            
            question = data_json.get("question", "")
            response, visualization = generate_response(question)
            
            await websocket.send_json({
                "response": response,
                "visualization": visualization
            })
    except Exception as e:
        print(f"Error en WebSocket: {e}")
    finally:
        try:
            await websocket.close()
        except:
            pass

# -------------------- PROCESAMIENTO DE TEXTO --------------------

def detect_topic(text: str) -> Optional[str]:
    """
    Detecta el tema matemático principal en un texto.
    
    Args:
        text: Texto a analizar
        
    Returns:
        Nombre del tema detectado o None si no se detecta ninguno
    """
    patterns = {
        "suma": ["sum", "mas", r"\+", "agreg", "junt", "añad", "adicion"],
        "resta": ["rest", "menos", "quitar", "diferencia", "sustrae", r"\-", "sacar"],
        "multiplicacion": ["multip", "por", "veces", r"\*", "producto", "tabla"]
    }
    
    for topic, words in patterns.items():
        for word in words:
            if re.search(word, text):
                return topic
    
    return None

def extract_math_expression(text: str) -> Optional[str]:
    """
    Extrae una expresión matemática del texto.
    
    Args:
        text: Texto del que extraer la expresión
        
    Returns:
        Expresión matemática encontrada o None si no se encuentra ninguna
    """
    match = re.search(r"(\d+)\s*([\+\-\*\/])\s*(\d+)", text)
    if match:
        return match.group(0)
    return None

# -------------------- PROCESAMIENTO MATEMÁTICO --------------------

def process_math_expression(expr: str) -> Tuple[str, Optional[Dict[str, Any]]]:
    """
    Procesa una expresión matemática y calcula su resultado.
    
    Args:
        expr: Expresión matemática a evaluar
        
    Returns:
        Tuple con el texto de respuesta y la visualización (o None)
    """
    try:
        match = re.search(r"(\d+)\s*([\+\-\*\/])\s*(\d+)", expr)
        if not match:
            return "No pude entender la operación.", None
        
        num1 = int(match.group(1))
        operator = match.group(2)
        num2 = int(match.group(3))
        
        if operator == '+':
            result = num1 + num2
            viz_type = "addition"
        elif operator == '-':
            result = num1 - num2
            viz_type = "subtraction"
        elif operator == '*':
            result = num1 * num2
            viz_type = "multiplication"
        elif operator == '/':
            if num2 == 0:
                return "No puedo dividir entre cero.", None
            result = num1 / num2
            viz_type = None
        else:
            return "No reconozco esa operación.", None
        
        response = f"El resultado de {expr} es {result}."
        
        visualization = {
            "type": viz_type,
            "num1": num1,
            "num2": num2,
            "result": result
        }
        
        return response, visualization
    except Exception as e:
        return f"Ocurrió un error al resolver la operación: {str(e)}", None

def create_visualization(topic: str) -> Optional[Dict[str, Any]]:
    """
    Crea una visualización para un tema matemático.
    
    Args:
        topic: Nombre del tema (suma, resta, multiplicacion)
        
    Returns:
        Diccionario con la información para la visualización o None
    """
    if topic == "suma":
        num1, num2 = random.randint(2, 5), random.randint(2, 5)
        return {
            "type": "addition",
            "num1": num1,
            "num2": num2,
            "result": num1 + num2
        }
    elif topic == "resta":
        num2 = random.randint(2, 5)
        num1 = num2 + random.randint(2, 5)
        return {
            "type": "subtraction",
            "num1": num1,
            "num2": num2,
            "result": num1 - num2
        }
    elif topic == "multiplicacion":
        num1, num2 = random.randint(2, 5), random.randint(2, 5)
        return {
            "type": "multiplication",
            "num1": num1,
            "num2": num2,
            "result": num1 * num2
        }
    
    return None

# -------------------- COMUNICACIÓN CON SERVICIOS EXTERNOS --------------------

async def query_ollama(prompt: str, model: str = "llama3") -> str:
    """
    Consulta a Ollama para obtener respuestas a preguntas utilizando modelos de lenguaje.
    
    Args:
        prompt: Texto de la pregunta a responder
        model: Nombre del modelo a utilizar
        
    Returns:
        Respuesta generada por el modelo
        
    Raises:
        HTTPException: Si hay errores en la comunicación con Ollama
    """
    try:
        response = requests.post(
            f"{OLLAMA_URL}/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False
            },
            timeout=30
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error en la petición a Ollama")
        
        data = response.json()
        return data.get("response", "No se pudo obtener una respuesta de Ollama.")
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"No se pudo conectar con Ollama: {str(e)}")

async def get_ollama_models() -> List[Dict[str, str]]:
    """
    Obtiene la lista de modelos disponibles en la instancia de Ollama.
    
    Returns:
        Lista de modelos disponibles
    """
    try:
        response = requests.get(f"{OLLAMA_URL}/tags", timeout=5)
        
        if response.status_code != 200:
            return []
        
        data = response.json()
        return data.get("models", [])
    except Exception:
        return []

# -------------------- GENERACIÓN DE RESPUESTAS --------------------

def generate_response(question: str) -> Tuple[str, Optional[Dict[str, Any]]]:
    """
    Genera una respuesta a una pregunta sobre matemáticas.
    
    Args:
        question: Pregunta del usuario
        
    Returns:
        Tuple con el texto de respuesta y la visualización (o None)
    """
    question_lower = question.lower()
    
    topic = detect_topic(question_lower)
    
    math_expr = extract_math_expression(question_lower)
    if math_expr:
        return process_math_expression(math_expr)
    
    if topic in MATH_TOPICS:
        response = random.choice(MATH_TOPICS[topic]["responses"])
        examples = MATH_TOPICS[topic]["examples"]
        
        if examples:
            response += "\n\nEjemplos:\n• " + "\n• ".join(examples)
        
        visualization = create_visualization(topic)
        
        return response, visualization
    
    return (
        "Puedo ayudarte con matemáticas de primaria. "
        "Pregúntame sobre sumas, restas o multiplicaciones.", 
        None
    )

# -------------------- INICIALIZACIÓN --------------------

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 