/**
 * Strategic Matrix Feature
 * 
 * This file serves as the public API for the Strategic Matrix feature.
 * It exports only what other parts of the application need to use.
 */

// Export the main page component
export { default as StrategicMatrixPage } from './pages/StrategicMatrixPage';

// Export the collapsible panel for use in the chat page
export { default as CollapsiblePanel } from './components/composite/CollapsiblePanel';

// Export the update processor for use in the chat page
export { default as UpdateProcessor } from './components/composite/UpdateProcessor';

// Export the store for direct access if needed
export { useStrategicMatrixStore, STRATEGIC_MATRIX_CATEGORIES } from './store';

// Export the document hook for use in other features
export { useStrategicMatrixDocument } from './hooks/useStrategicMatrixDocument';

// Export types
export type { StrategicMatrixDocument } from './types';
