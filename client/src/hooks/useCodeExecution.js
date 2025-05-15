import { useContext } from 'react';
import CodeExecutionContext from '../context/CodeExecutionContext';

/**
 * Custom hook to access the CodeExecutionContext
 */
const useCodeExecution = () => {
  const context = useContext(CodeExecutionContext);
  
  if (!context) {
    throw new Error('useCodeExecution must be used within a CodeExecutionProvider');
  }
  
  return context;
};

export default useCodeExecution;