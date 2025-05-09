/**
 * Archivo índice que exporta todos los componentes de la aplicación
 * para facilitar su importación desde otros archivos
 * 
 * @module components
 */

// Componentes para operaciones matemáticas
import OperationButtons from "./OperationButtons/index";
import NumberSelector from "./NumberSelector/index";
import OperationResult from "./OperationResult/index";
import MathVisualization from "./MathVisualization/index";
import LearningSteps from "./LearningSteps/index";

// Componentes para el área de chat
import ChatArea from "./ChatArea/index";
import InputArea from "./InputArea/index";
import ExamplesBar from "./ExamplesBar/index";

// Componentes de utilidad
import VoiceControl from "./VoiceControl/index";

/**
 * Exportación de todos los componentes en un objeto
 * para poder importarlos de forma agrupada
 */
export default { 
    // Operaciones matemáticas
    OperationButtons, 
    NumberSelector, 
    OperationResult,
    MathVisualization,
    LearningSteps,
    
    // Área de chat
    ChatArea,
    InputArea,
    ExamplesBar,
    
    // Utilidades
    VoiceControl
};
