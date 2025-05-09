# Audio Feedback para Mateo Matemático

Este documento explica cómo agregar efectos de sonido a las animaciones matemáticas de Mateo Matemático.

## Archivos de Sonido Requeridos

Para el correcto funcionamiento de las animaciones de audio, debes agregar los siguientes archivos de sonido en el directorio `frontend/public/sounds/`:

1. `add.mp3` - Sonido para adición de números
2. `clap.mp3` - Sonido de aplauso para celebración
3. `count.mp3` - Sonido al contar elementos
4. `negative.mp3` - Sonido especial para números negativos
5. `pop.mp3` - Sonido de notificación para elementos que aparecen
6. `subtract.mp3` - Sonido para la resta
7. `success.mp3` - Sonido de éxito al finalizar una animación
8. `whoosh.mp3` - Sonido para transiciones

## Formato de Archivos

- Todos los archivos deben estar en formato MP3
- Duración recomendada: menos de 1 segundo para efectos como "pop", "whoosh"
- Volumen normalizado para una experiencia consistente

## ¿Dónde conseguir sonidos?

Puedes obtener efectos de sonido libres de derechos en:

1. [Freesound.org](https://freesound.org/)
2. [Pixabay](https://pixabay.com/sound-effects/)
3. [Zapsplat](https://www.zapsplat.com/)

## Ejemplos Específicos Recomendados

- Para `pop.mp3`: Busca "notification pop" o "bubble pop"
- Para `whoosh.mp3`: Busca "short whoosh" o "transition whoosh"
- Para `success.mp3`: Busca "success chime" o "achievement sound"

## Personalización

Si deseas personalizar los sonidos, puedes modificar el archivo `frontend/src/services/audioService.js` donde se definen las constantes SOUNDS.

## Funcionamiento

Los sonidos se reproducen automáticamente durante las animaciones:

- **Suma**: Sonidos pop para cada elemento y un sonido de éxito al finalizar
- **Resta**: Sonidos distintos para restas positivas y negativas
- **Multiplicación y División**: Sonidos específicos para estas operaciones

## Control de Audio

Los usuarios pueden activar/desactivar los sonidos mediante el botón de toggle que aparece debajo de cada animación. La preferencia se guarda para futuras visitas. 