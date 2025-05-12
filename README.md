# Mateo Matemático - Asistente Virtual de Matemáticas

Un asistente virtual interactivo diseñado para ayudar a niños de primaria a aprender matemáticas de forma divertida, visual y auditiva.

![Mateo Matemático](./frontend/public/preview.png)

## Descripción del proyecto

Mateo Matemático es una aplicación web con una arquitectura cliente-servidor:

- **Frontend**: Interfaz de usuario interactiva desarrollada con React y Vite
- **Backend**: Servidor API desarrollado con FastAPI (Python)

El asistente permite a los niños:
- Practicar operaciones matemáticas básicas con visualizaciones interactivas
- Recibir explicaciones por voz sobre cómo resolver cada operación
- Hacer preguntas abiertas sobre conceptos matemáticos en el modo chat

## Estructura del proyecto

```
/math-assistant/
├── frontend/                # Aplicación React 
│   ├── src/                 # Código fuente React
│   │   ├── components/      # Componentes de la interfaz
│   │   ├── services/        # Servicios (voz, API)
│   │   └── styles/          # Archivos CSS
│   ├── public/              # Archivos estáticos
│   └── package.json         # Dependencias frontend
│
└── backend/                 # Servidor FastAPI
    ├── app.py               # Aplicación principal
    └── requirements.txt     # Dependencias backend
```

## Configuración rápida

Para levantar el proyecto completo, sigue estos pasos:

### 1. Iniciar el backend

```bash
cd backend

# Configurar entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
python app.py
```

### 2. Iniciar el frontend

En una nueva terminal:

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre tu navegador en **http://localhost:5173** (o el puerto que muestre la consola)

## Características principales

### Modo Práctica

- **Botones coloridos**: Cada operación matemática tiene su propio color
- **Selector de números**: Interfaz intuitiva para elegir los números
- **Visualizaciones dinámicas**: Representaciones visuales que ayudan a entender las operaciones
- **Explicaciones por voz**: Descripción auditiva paso a paso de cada operación

### Modo Chat

- Interfaz de chat para hacer preguntas sobre matemáticas
- Respuestas automáticas con explicaciones adaptadas a nivel primaria
- Pronunciación por voz de las respuestas

## Tecnologías utilizadas

### Frontend
- React
- Vite
- Web Speech API (síntesis de voz)
- Canvas API (visualizaciones)
- CSS moderno (flexbox, grid, variables)

### Backend
- FastAPI (Python)
- WebSockets
- CORS middleware

## Documentación detallada

Para obtener más información sobre cada parte del proyecto:

- [Documentación del Frontend](./frontend/README.md)
- [Documentación del Backend](./backend/README.md)

## Requisitos del sistema

- **Navegador**: Chrome, Firefox, Safari o Edge (versión actual)
- **Node.js**: 14.x o superior (para desarrollo frontend)
- **Python**: 3.8 o superior (para backend)
