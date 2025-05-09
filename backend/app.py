from fastapi import FastAPI, WebSocket, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import json
import asyncio
import re
import random
import requests
from typing import Optional, List

app = FastAPI()

# Configurar CORS para permitir peticiones desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, limitar a la URL específica
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# URL de Ollama (puede ser configurada para apuntar a otra instancia)
OLLAMA_URL = "http://localhost:11434/api"

# Datos de ejemplo para respuestas
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

# Endpoint para procesar preguntas (versión original)
@app.post("/api/question")
async def process_question(data: dict):
    question = data.get("question", "")
    model = data.get("model", "local")
    
    # Si especifica un modelo distinto a "local", intentar usar Ollama
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
            # Si falla, usar la respuesta local como fallback
    
    # Usar la respuesta local
    response, visualization = generate_response(question)
    
    return {
        "response": response,
        "visualization": visualization,
        "status": "success",
        "source": "local"
    }

# Endpoint para obtener modelos disponibles
@app.get("/api/models")
async def get_models():
    models = [{"name": "local", "tag": "local"}]  # Siempre incluir el modelo local
    
    try:
        # Intentar obtener modelos de Ollama
        ollama_models = await get_ollama_models()
        if ollama_models:
            models.extend(ollama_models)
        return {"models": models, "status": "success"}
    except Exception as e:
        print(f"Error al obtener modelos de Ollama: {e}")
        return {"models": models, "status": "partial", "error": str(e)}

# Función para consultar a Ollama
async def query_ollama(prompt: str, model: str = "llama3"):
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

# Función para obtener modelos disponibles en Ollama
async def get_ollama_models():
    try:
        response = requests.get(f"{OLLAMA_URL}/tags", timeout=5)
        
        if response.status_code != 200:
            return []
        
        data = response.json()
        return data.get("models", [])
    except Exception:
        return []

# Conexión WebSocket para comunicación en tiempo real
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Recibir mensaje del cliente
            data = await websocket.receive_text()
            data_json = json.loads(data)
            
            # Procesar con el asistente
            question = data_json.get("question", "")
            response, visualization = generate_response(question)
            
            # Enviar respuesta al cliente
            await websocket.send_json({
                "response": response,
                "visualization": visualization
            })
    except Exception as e:
        print(f"Error en WebSocket: {e}")
    finally:
        # Asegurar que se cierre la conexión
        try:
            await websocket.close()
        except:
            pass

# Función para generar respuestas
def generate_response(question):
    question_lower = question.lower()
    
    # Detectar tema matemático
    topic = detect_topic(question_lower)
    
    # Si es una operación matemática, resolverla
    math_expr = extract_math_expression(question_lower)
    if math_expr:
        return process_math_expression(math_expr)
    
    # Si es un tema conocido, dar información sobre él
    if topic in MATH_TOPICS:
        response = random.choice(MATH_TOPICS[topic]["responses"])
        examples = MATH_TOPICS[topic]["examples"]
        
        if examples:
            response += "\n\nEjemplos:\n• " + "\n• ".join(examples)
        
        # Crear visualización para el tema
        visualization = create_visualization(topic)
        
        return response, visualization
    
    # Respuesta genérica si no se reconoce el tema
    return (
        "Puedo ayudarte con matemáticas de primaria. "
        "Pregúntame sobre sumas, restas o multiplicaciones.", 
        None
    )

# Detectar el tema matemático principal
def detect_topic(text):
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

# Extraer expresión matemática del texto
def extract_math_expression(text):
    # Buscar expresiones como "2 + 3", "5 - 2", etc.
    match = re.search(r"(\d+)\s*([\+\-\*\/])\s*(\d+)", text)
    if match:
        return match.group(0)
    return None

# Procesar expresión matemática
def process_math_expression(expr):
    # Evaluar la expresión
    try:
        # Extraer operandos y operador
        match = re.search(r"(\d+)\s*([\+\-\*\/])\s*(\d+)", expr)
        if not match:
            return "No pude entender la operación.", None
        
        num1 = int(match.group(1))
        operator = match.group(2)
        num2 = int(match.group(3))
        
        # Calcular resultado
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
            viz_type = None  # No implementamos visualización para división
        else:
            return "No reconozco esa operación.", None
        
        # Crear mensaje de respuesta
        response = f"El resultado de {expr} es {result}."
        
        # Crear visualización
        visualization = {
            "type": viz_type,
            "num1": num1,
            "num2": num2,
            "result": result
        }
        
        return response, visualization
    except Exception as e:
        return f"Ocurrió un error al resolver la operación: {str(e)}", None

# Crear visualización para un tema
def create_visualization(topic):
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
        num1 = num2 + random.randint(2, 5)  # Asegurar que num1 > num2
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

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 