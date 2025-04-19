const { VM } = require('vm2');
const { PythonShell } = require('python-shell');
const metricsService = require('./metricsService');

// Language handlers
const javascriptHandler = require('../utils/languageHandlers/javascriptHandler');
const pythonHandler = require('../utils/languageHandlers/pythonHandler');

// Map of language IDs to their handler modules
const languageHandlers = {
  javascript: javascriptHandler,
  python: pythonHandler,
  // Add more language handlers as they are implemented
};

/**
 * Main service for code execution
 */
const codeExecutionService = {
  /**
   * Execute code and emit progress through socket.io
   */
  executeCode: async (io, socketId, data) => {
    const { code, language, input, options, executionId } = data;
    
    // Check if language is supported
    if (!languageHandlers[language]) {
      if (io && socketId) {
        io.to(socketId).emit('execution-error', {
          executionId,
          error: `Language '${language}' is not supported`
        });
      }
      return;
    }
    
    try {
      // Get the appropriate language handler
      const handler = languageHandlers[language];
      
      // Initialize metrics collection
      const metrics = {
        executionTime: 0,
        memoryUsage: [],
        functionCalls: [],
        variableStates: [],
        executionFlow: [],
        executionId
      };
      
      // Instrument the code for metrics collection
      const instrumentedCode = handler.instrumentCode(code, options);
      
      // Send update that instrumentation is complete
      if (io && socketId) {
        io.to(socketId).emit('execution-progress', {
          executionId,
          stage: 'instrumentation',
          status: 'complete'
        });
      }
      
      // Start execution timer
      const startTime = process.hrtime();
      
      // Execute the code and collect metrics in real-time
      handler.executeCode(instrumentedCode, input, options, (event, data) => {
        // Update metrics based on event type
        switch (event) {
          case 'memory':
            metrics.memoryUsage.push(data);
            break;
          case 'functionCall':
            metrics.functionCalls.push(data);
            break;
          case 'variableState':
            metrics.variableStates.push(data);
            break;
          case 'executionFlow':
            metrics.executionFlow.push(data);
            break;
        }
        
        // Send real-time updates if socket is available
        if (io && socketId) {
          io.to(socketId).emit('execution-update', {
            executionId,
            event,
            data
          });
        }
      }).then(result => {
        // Calculate total execution time
        const hrend = process.hrtime(startTime);
        metrics.executionTime = hrend[0] * 1000 + hrend[1] / 1000000; // Convert to ms
        
        // Process metrics for visualization
        const processedMetrics = metricsService.processMetrics(metrics);
        
        // Send execution complete event
        if (io && socketId) {
          io.to(socketId).emit('execution-complete', {
            executionId,
            result,
            metrics: processedMetrics
          });
        }
        
        return {
          result,
          metrics: processedMetrics
        };
      }).catch(error => {
        if (io && socketId) {
          io.to(socketId).emit('execution-error', {
            executionId,
            error: error.message
          });
        }
        throw error;
      });
    } catch (error) {
      console.error(`Error executing ${language} code:`, error);
      if (io && socketId) {
        io.to(socketId).emit('execution-error', {
          executionId,
          error: error.message
        });
      }
    }
  },
  
  /**
   * Execute code for comparison (synchronous version)
   */
  executeForComparison: async (code, language, input, options) => {
    return new Promise((resolve, reject) => {
      try {
        // Check if language is supported
        if (!languageHandlers[language]) {
          return reject(new Error(`Language '${language}' is not supported`));
        }
        
        // Get the appropriate language handler
        const handler = languageHandlers[language];
        
        // Initialize metrics collection
        const metrics = {
          executionTime: 0,
          memoryUsage: [],
          functionCalls: [],
          variableStates: [],
          executionFlow: []
        };
        
        // Instrument the code for metrics collection
        const instrumentedCode = handler.instrumentCode(code, options);
        
        // Start execution timer
        const startTime = process.hrtime();
        
        // Execute the code and collect metrics
        handler.executeCode(instrumentedCode, input, options, (event, data) => {
          // Update metrics based on event type
          switch (event) {
            case 'memory':
              metrics.memoryUsage.push(data);
              break;
            case 'functionCall':
              metrics.functionCalls.push(data);
              break;
            case 'variableState':
              metrics.variableStates.push(data);
              break;
            case 'executionFlow':
              metrics.executionFlow.push(data);
              break;
          }
        }).then(result => {
          // Calculate total execution time
          const hrend = process.hrtime(startTime);
          metrics.executionTime = hrend[0] * 1000 + hrend[1] / 1000000; // Convert to ms
          
          // Process metrics for visualization
          const processedMetrics = metricsService.processMetrics(metrics);
          
          resolve({
            result,
            metrics: processedMetrics
          });
        }).catch(error => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
};

module.exports = codeExecutionService;