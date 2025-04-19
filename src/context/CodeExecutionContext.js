import React, { createContext, useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { executeCode, getSupportedLanguages } from '../services/codeExecutionService';

// Create context
const CodeExecutionContext = createContext({
  code: '',
  language: 'javascript',
  input: '',
  executionResult: null,
  metrics: null,
  isExecuting: false,
  executionError: null,
  supportedLanguages: [],
  setCode: () => {},
  setLanguage: () => {},
  setInput: () => {},
  runCode: () => {},
  clearResults: () => {},
});

// Provider component
export const CodeExecutionProvider = ({ children }) => {
  // State for code editor
  const [code, setCode] = useState('// Write your code here');
  const [language, setLanguage] = useState('javascript');
  const [input, setInput] = useState('');
  
  // State for execution
  const [executionId, setExecutionId] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState(null);
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  
  // Socket.io connection
  const [socket, setSocket] = useState(null);
  
  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
    });
    
    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
    
    setSocket(newSocket);
    
    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    // Listen for execution progress events
    socket.on('execution-progress', (data) => {
      console.log('Execution progress:', data);
    });
    
    // Listen for execution updates
    socket.on('execution-update', (data) => {
      console.log('Execution update:', data);
      // Update metrics in real-time if needed
    });
    
    // Listen for execution completion
    socket.on('execution-complete', (data) => {
      console.log('Execution complete:', data);
      setExecutionResult(data.result);
      setMetrics(data.metrics);
      setIsExecuting(false);
    });
    
    // Listen for execution errors
    socket.on('execution-error', (data) => {
      console.error('Execution error:', data);
      setExecutionError(data.error);
      setIsExecuting(false);
    });
    
    // Clean up listeners on unmount
    return () => {
      socket.off('execution-progress');
      socket.off('execution-update');
      socket.off('execution-complete');
      socket.off('execution-error');
    };
  }, [socket]);
  
  // Fetch supported languages
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const languages = await getSupportedLanguages();
        setSupportedLanguages(languages);
        
        // Set default language if available
        if (languages.length > 0 && !language) {
          setLanguage(languages[0].id);
        }
      } catch (error) {
        console.error('Error fetching supported languages:', error);
      }
    };
    
    fetchLanguages();
  }, [language]);
  
  // Run code function
  const runCode = useCallback(async () => {
    if (!code.trim()) {
      setExecutionError('Please enter some code to execute');
      return;
    }
    
    setIsExecuting(true);
    setExecutionResult(null);
    setMetrics(null);
    setExecutionError(null);
    
    try {
      // If using Socket.io for real-time updates
      if (socket) {
        socket.emit('execute-code', {
          code,
          language,
          input,
          options: {
            trackMemory: true,
            trackVariables: true,
            trackFunctions: true,
            trackExecutionFlow: true,
          }
        });
      } else {
        // Fallback to REST API
        const result = await executeCode(code, language, input);
        setExecutionId(result.executionId);
      }
    } catch (error) {
      setExecutionError(error.message || 'An error occurred during execution');
      setIsExecuting(false);
    }
  }, [code, language, input, socket]);
  
  // Clear results
  const clearResults = useCallback(() => {
    setExecutionResult(null);
    setMetrics(null);
    setExecutionError(null);
  }, []);
  
  // Context value
  const value = {
    code,
    language,
    input,
    executionResult,
    metrics,
    isExecuting,
    executionError,
    supportedLanguages,
    setCode,
    setLanguage,
    setInput,
    runCode,
    clearResults,
  };
  
  return (
    <CodeExecutionContext.Provider value={value}>
      {children}
    </CodeExecutionContext.Provider>
  );
};

export default CodeExecutionContext;