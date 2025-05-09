# Backend de Mateo Matemático

Este es el backend para la aplicación "Mateo Matemático", un asistente de matemáticas para niños de primaria.

## Características

- API RESTful para procesar consultas matemáticas
- Soporte para WebSockets para comunicación en tiempo real
- Integración con Ollama para respuestas de IA avanzadas
- Modo de respuesta local como fallback
- Visualizaciones para conceptos matemáticos

## Requisitos

- Python 3.8 o superior
- pip (gestor de paquetes de Python)
- Ollama (opcional, para respuestas de IA avanzadas)

## Instalación

1. Clonar el repositorio o navegar a la carpeta backend

```bash
cd math-assistant/backend
```

2. Crear un entorno virtual (opcional pero recomendado)

```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

3. Instalar dependencias

```bash
pip install -r requirements.txt
```

## Ejecución

Para iniciar el servidor:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

El servidor estará disponible en http://localhost:8000

## Endpoints principales

- `POST /api/question`: Procesa preguntas matemáticas
- `GET /api/models`: Obtiene los modelos de IA disponibles
- `WebSocket /ws`: Conexión para comunicación en tiempo real

## Integración con Ollama

Este backend puede integrarse con [Ollama](https://ollama.ai) para proporcionar respuestas de IA más avanzadas.

### Configuración con Ollama

1. Instala Ollama siguiendo las instrucciones en: https://ollama.ai/download

2. Inicia Ollama:
   ```bash
   ollama serve
   ```

3. Descarga un modelo compatible:
   ```bash
   ollama pull llama3
   ```

4. Una vez que Ollama esté ejecutándose (por defecto en http://localhost:11434), el backend detectará automáticamente su presencia y lo utilizará para respuestas más elaboradas.

Si Ollama no está disponible, el backend utilizará automáticamente el sistema de respuestas local.

## Configuración

La URL de la API de Ollama se puede configurar en `app.py` modificando la variable `OLLAMA_URL`. Por defecto es `http://localhost:11434/api`.

## Uso para desarrollo

El servidor incluye recarga automática para facilitar el desarrollo. Cualquier cambio en los archivos hará que el servidor se reinicie automáticamente.

## Solución de problemas

- Si encuentras errores de conexión con Ollama, verifica que el servicio esté ejecutándose en la URL configurada
- Cualquier error en la comunicación con Ollama activará el sistema de respuestas local como fallback 