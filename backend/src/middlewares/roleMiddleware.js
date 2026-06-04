// Re-exporta authorize desde authMiddleware para mantener la separación de archivos
// sin duplicar lógica. Las rutas importan desde aquí por claridad semántica.
export { authorize } from './authMiddleware.js';
