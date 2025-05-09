# Mateo Matemático - Asistente Interactivo de Matemáticas

Mateo Matemático es una aplicación educativa diseñada para ayudar a niños de primaria a aprender matemáticas de forma interactiva y divertida.

![Mateo Matemático](./public/preview.png)

## Características

- **Botones de operaciones coloridos**: Suma, resta, multiplicación y división con colores distintivos
- **Selector de números interactivo**: Interfaz intuitiva para seleccionar los números para las operaciones
- **Visualizaciones interactivas**: Representaciones visuales de cada operación matemática
- **Explicación por voz**: Descripción auditiva de cómo se resuelve cada operación
- **Modo Chat**: Permite hacer preguntas libres sobre matemáticas
- **Diseño responsivo**: Funciona en dispositivos móviles y de escritorio
- **Práctica de operaciones matemáticas básicas**: Suma, resta, multiplicación, división
- **Chat con IA para resolver dudas matemáticas**: Respuestas generadas por la IA localmente

## Configuración de IA local con Ollama

La aplicación ahora utiliza Ollama para proporcionar respuestas de IA en el chat. Ollama es un sistema que permite ejecutar modelos de IA localmente en tu computadora, sin necesidad de conectarse a servicios externos ni pagar suscripciones.

### Paso 1: Instalar Ollama

1. Visita [https://ollama.com/download](https://ollama.com/download)
2. Descarga e instala la versión para tu sistema operativo (Windows, macOS o Linux)
3. Asegúrate de que Ollama esté ejecutándose. En macOS y Windows aparecerá como un icono en la barra de menú/bandeja del sistema.

### Paso 2: Descargar un modelo de IA

Puedes descargar modelos rápidamente usando estos comandos:

```bash
# Listar modelos disponibles
npm run ollama:models

# Descargar Llama 3 (aprox. 3GB)
npm run ollama:pull:llama3

# Descargar Mistral (aprox. 4GB)
npm run ollama:pull:mistral
```

Alternativamente, puedes ejecutar estos comandos directamente en la terminal:

```bash
# Para ver los modelos disponibles
curl http://localhost:11434/api/tags

# Para descargar un modelo específico (ejemplo: llama3)
curl -X POST http://localhost:11434/api/pull -d '{"name": "llama3"}'
```

### Paso 3: Usar el chat con IA

1. Inicia la aplicación: `npm run dev`
2. Selecciona el modo Chat utilizando el botón "Modo Chat" en la esquina superior derecha
3. En el chat, puedes seleccionar el modelo de IA que quieres usar del menú desplegable
4. Escribe tus preguntas matemáticas y recibe respuestas generadas por la IA local

## Modelos recomendados

- **llama3**: Buena calidad general, tamaño moderado (aprox. 3GB)
- **mistral**: Excelente para explicaciones educativas (aprox. 4GB)
- **phi3**: Muy eficiente y rápido para respuestas precisas (aprox. 2GB)

## Requisitos previos

- Node.js (versión 14 o superior)
- npm o yarn
- Python 3.8 o superior (para el backend)

## Instalación y ejecución

### Frontend (React)

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/math-assistant.git
   cd math-assistant/frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   # o con yarn
   yarn
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   # o con yarn
   yarn dev
   ```

4. Abre el navegador en http://localhost:5173 (o el puerto que indique la consola)

### Backend (Python FastAPI)

1. Navega a la carpeta del backend:
   ```bash
   cd ../backend
   ```

2. Crea un entorno virtual e instala las dependencias:
   ```bash
   # Crear entorno virtual
   python -m venv venv
   
   # Activar entorno virtual
   # En Windows:
   venv\Scripts\activate
   # En macOS/Linux:
   source venv/bin/activate
   
   # Instalar dependencias
   pip install -r requirements.txt
   ```

3. Inicia el servidor:
   ```bash
   python app.py
   ```

4. El backend estará disponible en http://localhost:8000

## Cómo usar la aplicación

### Modo Práctica (Operaciones)

1. Selecciona una operación matemática (suma, resta, multiplicación o división) haciendo clic en uno de los botones coloridos.
2. Elige los números para la operación usando los selectores desplegables.
3. Haz clic en "Calcular" para ver el resultado.
4. Observa la visualización interactiva que muestra cómo se resuelve la operación.
5. Escucha la explicación por voz o haz clic en el botón "Escuchar explicación" para repetirla.

### Modo Chat (Preguntas)

1. Haz clic en el botón "Modo Chat" en la parte superior de la pantalla.
2. Escribe tu pregunta sobre matemáticas en el campo de texto.
3. Presiona "Enviar" para obtener una respuesta.
4. Las respuestas se leerán automáticamente en voz alta.

## Estructura del proyecto

### Frontend (React)

- `/src/components/`: Componentes React para la interfaz
  - `OperationButtons.jsx`: Botones de operaciones matemáticas
  - `NumberSelector.jsx`: Selector de números para las operaciones
  - `OperationResult.jsx`: Visualización de resultados
  - `ChatArea.jsx`: Área de chat para preguntas libres
- `/src/services/`: Servicios para funcionalidades específicas
  - `speechService.js`: Servicio de síntesis de voz
- `/src/styles/`: Archivos CSS para cada componente

### Backend (Python)

- `app.py`: Servidor FastAPI con endpoints para procesar preguntas
- `requirements.txt`: Dependencias de Python

## Funcionalidades principales

### Visualización de operaciones

- **Suma**: Muestra círculos agrupados para representar cada sumando
- **Resta**: Visualiza elementos tachados para representar lo que se quita
- **Multiplicación**: Representa la operación como una matriz de elementos
- **División**: Agrupa elementos para mostrar el concepto de reparto

### Síntesis de voz

Utiliza la Web Speech API para:
- Proporcionar retroalimentación al seleccionar operaciones
- Explicar paso a paso cómo resolver cada operación
- Leer las respuestas del chat

## Personalización

Puedes personalizar la aplicación modificando:

- Los colores de las operaciones en `OperationButtons.jsx`
- Los estilos CSS en los archivos de la carpeta `/src/styles/`
- Las explicaciones generadas en `NumberSelector.jsx`
- Las visualizaciones en `OperationResult.jsx`

## Licencia

[MIT](LICENSE) 