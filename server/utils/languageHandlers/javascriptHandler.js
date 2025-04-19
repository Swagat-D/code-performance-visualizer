const { VM } = require('vm2');

/**
 * Handler for JavaScript code execution and instrumentation
 */
const javascriptHandler = {
  /**
   * Instrument JavaScript code to collect performance metrics
   */
  instrumentCode: (code, options = {}) => {
    // Extract options with defaults
    const {
      trackMemory = true,
      trackVariables = true,
      trackFunctions = true,
      trackExecutionFlow = true,
    } = options;
    
    // Create a unique execution ID for this run
    const executionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Prepend setup code for metrics collection
    let instrumentedCode = `
      // Setup metrics collection
      const __metrics = {
        memoryUsage: [],
        functionCalls: [],
        variableStates: [],
        executionFlow: [],
        startTime: Date.now(),
        
        // Method to track memory usage
        trackMemory: function(allocation = 0, deallocation = 0) {
          if (${trackMemory}) {
            const memUsage = process.memoryUsage();
            this.memoryUsage.push({
              timestamp: Date.now() - this.startTime,
              heapTotal: memUsage.heapTotal,
              heapUsed: memUsage.heapUsed,
              rss: memUsage.rss,
              value: memUsage.heapUsed,
              allocation,
              deallocation
            });
            
            // Send memory usage event
            __sendMetricsEvent('memory', this.memoryUsage[this.memoryUsage.length - 1]);
          }
        },
        
        // Method to track function calls
        trackFunctionCall: function(name, caller, args, startTime, endTime) {
          if (${trackFunctions}) {
            const duration = endTime - startTime;
            const callData = {
              timestamp: startTime - this.startTime,
              name,
              caller,
              args: args.map(arg => {
                try {
                  return JSON.stringify(arg).substring(0, 100);
                } catch (e) {
                  return '[Complex object]';
                }
              }),
              duration,
              endTimestamp: endTime - this.startTime
            };
            
            this.functionCalls.push(callData);
            
            // Send function call event
            __sendMetricsEvent('functionCall', callData);
            
            return duration;
          }
          return endTime - startTime;
        },
        
        // Method to track variable state changes
        trackVariable: function(name, value, line, varType) {
          if (${trackVariables}) {
            let serializedValue;
            try {
              serializedValue = JSON.stringify(value).substring(0, 100);
              if (serializedValue.length === 100) serializedValue += '...';
            } catch (e) {
              serializedValue = '[Complex object]';
            }
            
            const varData = {
              timestamp: Date.now() - this.startTime,
              name,
              value: serializedValue,
              type: varType || typeof value,
              line
            };
            
            this.variableStates.push(varData);
            
            // Send variable state event
            __sendMetricsEvent('variableState', varData);
          }
        },
        
        // Method to track execution flow
        trackExecution: function(line, code) {
          if (${trackExecutionFlow}) {
            const startTime = Date.now();
            
            return {
              end: () => {
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                const executionData = {
                  timestamp: startTime - this.startTime,
                  line,
                  code: code.trim(),
                  duration
                };
                
                this.executionFlow.push(executionData);
                
                // Send execution flow event
                __sendMetricsEvent('executionFlow', executionData);
              }
            };
          }
          return { end: () => {} };
        }
      };
      
      // Function to send metrics events to the parent process
      function __sendMetricsEvent(event, data) {
        process.send({ event, data });
      }
      
      // Set up our global proxy to intercept and instrument variables
      const __originalProxy = Proxy;
      
      // Take initial memory snapshot
      __metrics.trackMemory();
    `;
    
    // Wrap user code in try-catch for error handling
    instrumentedCode += `
      try {
        // Main user code begins here
        ${instrumentFunctions(instrumentVariables(instrumentExecutionFlow(code, trackExecutionFlow), trackVariables), trackFunctions)}
        // Main user code ends here
        
        // Take final memory snapshot
        __metrics.trackMemory();
        
        // Send final metrics summary
        process.send({ event: 'complete', data: { 
          executionTime: Date.now() - __metrics.startTime,
          memoryUsage: __metrics.memoryUsage,
          functionCalls: __metrics.functionCalls,
          variableStates: __metrics.variableStates,
          executionFlow: __metrics.executionFlow
        }});
      } catch (error) {
        process.send({ event: 'error', data: { 
          message: error.message,
          stack: error.stack,
          line: error.lineNumber || 'unknown'
        }});
      }
    `;
    
    return instrumentedCode;
  },
  
  /**
   * Execute instrumented JavaScript code and collect metrics
   */
  executeCode: async (instrumentedCode, input = '', options = {}, metricsCallback) => {
    return new Promise((resolve, reject) => {
      try {
        // Set up VM options
        const vmOptions = {
          timeout: options.timeout || 5000, // 5 second timeout by default
          sandbox: {
            console: {
              log: (...args) => {
                // You can handle console output here
                return args;
              },
              error: (...args) => {
                // Handle error logs
                return args;
              },
              warn: (...args) => {
                // Handle warning logs
                return args;
              }
            },
            // Add any safe globals needed
            setTimeout: (callback, delay) => {
              if (delay > 2000) delay = 2000; // Cap timeouts at 2 seconds
              return setTimeout(callback, delay);
            },
            clearTimeout,
            process: {
              memoryUsage: () => {
                // Simulate process.memoryUsage
                return {
                  rss: 0,
                  heapTotal: 0,
                  heapUsed: 0,
                  external: 0
                };
              },
              send: (data) => {
                // Handle metrics data
                if (data.event && data.data) {
                  if (metricsCallback) {
                    metricsCallback(data.event, data.data);
                  }
                  
                  if (data.event === 'complete') {
                    resolve(data.data);
                  } else if (data.event === 'error') {
                    reject(new Error(data.data.message));
                  }
                }
              }
            },
            // Include any other required globals
            Array, Object, String, Number, Boolean, Date, Math, JSON, RegExp, Error,
            isNaN, isFinite, parseFloat, parseInt, decodeURI, decodeURIComponent,
            encodeURI, encodeURIComponent, NaN, Infinity, undefined
          }
        };
        
        // Process input if provided
        if (input && typeof input === 'string' && input.trim()) {
          // Convert input string to an array of values
          vmOptions.sandbox.input = input.trim().split('\n');
        } else {
          vmOptions.sandbox.input = [];
        }
        
        // Create VM
        const vm = new VM(vmOptions);
        
        // Execute code in VM
        vm.run(instrumentedCode);
      } catch (error) {
        // Execution error
        if (metricsCallback) {
          metricsCallback('error', {
            message: error.message,
            stack: error.stack,
            line: error.lineNumber || 'unknown'
          });
        }
        reject(error);
      }
    });
  }
};

/**
 * Helper function to instrument function calls in the code
 */
function instrumentFunctions(code, trackFunctions) {
  if (!trackFunctions) return code;
  
  // A basic approach to instrument function declarations
  // More sophisticated parsing would use a JavaScript parser like Acorn or Babel
  
  // Instrument function declarations
  code = code.replace(
    /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)\s*{/g,
    function(match, name, params) {
      return `function ${name}(${params}) {
        const __startTime = Date.now();
        const __caller = new Error().stack.split("\\n")[2].trim().split(" ")[1] || "global";
        const __args = Array.from(arguments);
        
        try {`;
    }
  );
  
  // Add return tracking to function declarations
  code = code.replace(
    /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)\s*{([\s\S]*?)(return\s+([^;]*);?)([\s\S]*?)}/g,
    function(match, name, params, beforeReturn, returnStatement, returnValue, afterReturn) {
      return `function ${name}(${params}) {
        const __startTime = Date.now();
        const __caller = new Error().stack.split("\\n")[2].trim().split(" ")[1] || "global";
        const __args = Array.from(arguments);
        
        try {${beforeReturn}
          const __returnValue = ${returnValue};
          __metrics.trackFunctionCall("${name}", __caller, __args, __startTime, Date.now());
          return __returnValue;${afterReturn}
        } catch(e) {
          __metrics.trackFunctionCall("${name}", __caller, __args, __startTime, Date.now());
          throw e;
        }
      }`;
    }
  );
  
  // Add end tracking for functions without explicit returns
  code = code.replace(
    /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)\s*{([\s\S]*?)(?!\s*return)(})/g,
    function(match, name, params, body, closingBrace) {
      return `function ${name}(${params}) {
        const __startTime = Date.now();
        const __caller = new Error().stack.split("\\n")[2].trim().split(" ")[1] || "global";
        const __args = Array.from(arguments);
        
        try {${body}
          __metrics.trackFunctionCall("${name}", __caller, __args, __startTime, Date.now());
        } catch(e) {
          __metrics.trackFunctionCall("${name}", __caller, __args, __startTime, Date.now());
          throw e;
        }
      }`;
    }
  );
  
  // Also instrument arrow functions (simplified approach)
  code = code.replace(
    /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\(([^)]*)\)\s*=>\s*{/g,
    function(match, name, params) {
      return `const ${name} = (${params}) => {
        const __startTime = Date.now();
        const __caller = new Error().stack.split("\\n")[2].trim().split(" ")[1] || "global";
        const __args = Array.from(arguments);
        
        try {`;
    }
  );
  
  // Add tracking for arrow functions with body blocks
  code = code.replace(
    /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\(([^)]*)\)\s*=>\s*{([\s\S]*?)}/g,
    function(match, name, params, body) {
      return `const ${name} = (${params}) => {
        const __startTime = Date.now();
        const __caller = new Error().stack.split("\\n")[2].trim().split(" ")[1] || "global";
        const __args = Array.from(arguments);
        
        try {${body}
          __metrics.trackFunctionCall("${name}", __caller, __args, __startTime, Date.now());
        } catch(e) {
          __metrics.trackFunctionCall("${name}", __caller, __args, __startTime, Date.now());
          throw e;
        }
      }`;
    }
  );
  
  return code;
}

/**
 * Helper function to instrument variable assignments in the code
 */
function instrumentVariables(code, trackVariables) {
  if (!trackVariables) return code;
  
  // This is a simplified approach. A proper implementation would use a JS parser.
  
  // Track 'let' variable declarations with initialization
  code = code.replace(
    /let\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]*);/g,
    function(match, name, value) {
      return `let ${name} = ${value}; 
        __metrics.trackVariable("${name}", ${name}, new Error().stack.split("\\n")[1].match(/:([0-9]+):/)?.[1] || 0, "let");`;
    }
  );
  
  // Track 'const' variable declarations
  code = code.replace(
    /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]*);/g,
    function(match, name, value) {
      return `const ${name} = ${value}; 
        __metrics.trackVariable("${name}", ${name}, new Error().stack.split("\\n")[1].match(/:([0-9]+):/)?.[1] || 0, "const");`;
    }
  );
  
  // Track 'var' variable declarations with initialization
  code = code.replace(
    /var\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]*);/g,
    function(match, name, value) {
      return `var ${name} = ${value}; 
        __metrics.trackVariable("${name}", ${name}, new Error().stack.split("\\n")[1].match(/:([0-9]+):/)?.[1] || 0, "var");`;
    }
  );
  
  // Track variable reassignments
  code = code.replace(
    /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]*);/g,
    function(match, name, value) {
      // Skip tracking for loop counters to avoid excessive events
      if (name === 'i' || name === 'j' || name === 'k') {
        return match;
      }
      
      return `${name} = ${value}; 
        __metrics.trackVariable("${name}", ${name}, new Error().stack.split("\\n")[1].match(/:([0-9]+):/)?.[1] || 0);`;
    }
  );
  
  return code;
}

/**
 * Helper function to instrument code execution flow
 */
function instrumentExecutionFlow(code, trackExecutionFlow) {
  if (!trackExecutionFlow) return code;
  
  // Split code into lines
  const lines = code.split('\n');
  const instrumentedLines = [];
  
  // Instrument each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines and lines that are just comments
    if (!line.trim() || line.trim().startsWith('//')) {
      instrumentedLines.push(line);
      continue;
    }
    
    // Skip instrumenting lines that are just closing braces or similar
    if (line.trim() === '}' || line.trim() === '});' || line.trim() === '};') {
      instrumentedLines.push(line);
      continue;
    }
    
    // Extract leading whitespace
    const leadingWhitespace = line.match(/^(\s*)/)[1];
    
    // Check if line ends with opening curly brace - if so, don't track it separately
    if (line.trim().endsWith('{')) {
      instrumentedLines.push(line);
      continue;
    }
    
    // For lines with statements, add tracking
    const escapedLine = line.replace(/'/g, "\\'");
    
    instrumentedLines.push(
      `${leadingWhitespace}{ const __executionTracker = __metrics.trackExecution(${i+1}, '${escapedLine}'); try {`,
      `${line}`,
      `${leadingWhitespace}} finally { __executionTracker.end(); } }`
    );
  }
  
  return instrumentedLines.join('\n');
}

module.exports = javascriptHandler;