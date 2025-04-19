const { PythonShell } = require('python-shell');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

/**
 * Handler for Python code execution and instrumentation
 */
const pythonHandler = {
  /**
   * Instrument Python code to collect performance metrics
   */
  instrumentCode: (code, options = {}) => {
    // Extract options with defaults
    const {
      trackMemory = true,
      trackVariables = true,
      trackFunctions = true,
      trackExecutionFlow = true,
    } = options;
    
    // Create instrumentation code
    let instrumentedCode = `
import sys
import time
import json
import traceback
import inspect
import gc
import os
import psutil

# Initialize metrics collector
class MetricsCollector:
    def __init__(self):
        self.memory_usage = []
        self.function_calls = []
        self.variable_states = []
        self.execution_flow = []
        self.start_time = time.time() * 1000  # ms
        self.process = psutil.Process(os.getpid())
    
    def track_memory(self, allocation=0, deallocation=0):
        """Track current memory usage"""
        if ${trackMemory}:
            mem_info = self.process.memory_info()
            timestamp = time.time() * 1000 - self.start_time
            memory_data = {
                'timestamp': timestamp,
                'rss': mem_info.rss,
                'vms': mem_info.vms,
                'value': mem_info.rss,  # Use RSS as the main value
                'allocation': allocation,
                'deallocation': deallocation
            }
            self.memory_usage.append(memory_data)
            send_metrics_event('memory', memory_data)
    
    def track_function_call(self, name, caller, args, start_time, end_time):
        """Track function call with timing"""
        if ${trackFunctions}:
            duration = end_time - start_time
            
            # Convert args to strings, limiting length
            args_str = []
            for arg in args:
                try:
                    arg_str = json.dumps(arg)[:100]
                    args_str.append(arg_str)
                except:
                    args_str.append('[Complex object]')
            
            call_data = {
                'timestamp': start_time - self.start_time,
                'name': name,
                'caller': caller,
                'args': args_str,
                'duration': duration,
                'endTimestamp': end_time - self.start_time
            }
            
            self.function_calls.append(call_data)
            send_metrics_event('functionCall', call_data)
            return duration
        return end_time - start_time
    
    def track_variable(self, name, value, line, var_type=None):
        """Track variable state changes"""
        if ${trackVariables}:
            timestamp = time.time() * 1000 - self.start_time
            
            # Convert value to string, limiting length
            try:
                value_str = json.dumps(value)[:100]
                if len(value_str) == 100:
                    value_str += '...'
            except:
                value_str = '[Complex object]'
            
            var_data = {
                'timestamp': timestamp,
                'name': name,
                'value': value_str,
                'type': var_type or type(value).__name__,
                'line': line
            }
            
            self.variable_states.append(var_data)
            send_metrics_event('variableState', var_data)
    
    def track_execution(self, line, code):
        """Track execution flow"""
        if ${trackExecutionFlow}:
            start_time = time.time() * 1000
            
            class ExecutionTracker:
                def end(self):
                    end_time = time.time() * 1000
                    duration = end_time - start_time
                    
                    execution_data = {
                        'timestamp': start_time - metrics.start_time,
                        'line': line,
                        'code': code.strip(),
                        'duration': duration
                    }
                    
                    metrics.execution_flow.append(execution_data)
                    send_metrics_event('executionFlow', execution_data)
            
            return ExecutionTracker()
        
        class DummyTracker:
            def end(self):
                pass
        
        return DummyTracker()

# Function to send metrics events
def send_metrics_event(event, data):
    """Send metrics event to Node.js process"""
    print(f"__METRICS_EVENT__{json.dumps({'event': event, 'data': data})}")
    sys.stdout.flush()

# Create metrics collector
metrics = MetricsCollector()

# Take initial memory snapshot
metrics.track_memory()

# Custom function decorator for tracking
def track_function(func):
    def wrapper(*args, **kwargs):
        start_time = time.time() * 1000
        caller = 'global'
        
        # Try to determine caller
        try:
            frame = inspect.currentframe().f_back
            if frame and frame.f_code:
                caller = frame.f_code.co_name
        except:
            pass
        
        try:
            result = func(*args, **kwargs)
            metrics.track_function_call(func.__name__, caller, args, start_time, time.time() * 1000)
            return result
        except Exception as e:
            metrics.track_function_call(func.__name__, caller, args, start_time, time.time() * 1000)
            raise e
    
    return wrapper

# Main execution
try:
`;
    
    // Indent user code
    const userCodeLines = code.split('\n');
    const indentedUserCode = userCodeLines.map(line => '    ' + line).join('\n');
    
    // Instrument functions in user code if requested
    let processedUserCode = indentedUserCode;
    if (trackFunctions) {
      processedUserCode = instrumentPythonFunctions(indentedUserCode);
    }
    
    // Add instrumented user code
    instrumentedCode += processedUserCode;
    
    // Add final metrics collection and error handling
    instrumentedCode += `

    # Take final memory snapshot
    metrics.track_memory()
    
    # Send final metrics summary
    print("__METRICS_COMPLETE__" + json.dumps({
        'executionTime': time.time() * 1000 - metrics.start_time,
        'memoryUsage': metrics.memory_usage,
        'functionCalls': metrics.function_calls,
        'variableStates': metrics.variable_states,
        'executionFlow': metrics.execution_flow
    }))

except Exception as e:
    error_data = {
        'message': str(e),
        'stack': traceback.format_exc(),
        'line': traceback.extract_tb(sys.exc_info()[2])[-1].lineno
    }
    print("__METRICS_ERROR__" + json.dumps(error_data))
`;
    
    return instrumentedCode;
  },
  
  /**
   * Execute instrumented Python code and collect metrics
   */
  executeCode: async (instrumentedCode, input = '', options = {}, metricsCallback) => {
    return new Promise((resolve, reject) => {
      // Create a unique temp file for this execution
      const tempDir = path.join(os.tmpdir(), 'code-perf-visualizer');
      
      // Create temp directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFile = path.join(tempDir, `python_${uuidv4()}.py`);
      
      try {
        // Write instrumented code to temp file
        fs.writeFileSync(tempFile, instrumentedCode, 'utf8');
        
        // Prepare input if provided
        const inputLines = input && typeof input === 'string' ? input.trim().split('\n') : [];
        
        // Configure Python shell options
        const pyOptions = {
          mode: 'text',
          pythonPath: 'python3',  // Use python3 explicitly
          pythonOptions: ['-u'],  // Unbuffered output
          scriptPath: tempDir,
          args: [],
          stdin: inputLines.length > 0 ? true : false,
        };
        
        // Limit execution time
        const timeout = options.timeout || 10000; // 10 seconds default timeout
        let timeoutId = null;
        
        // Start Python shell
        const pyShell = new PythonShell(path.basename(tempFile), pyOptions);
        
        // Set up timeout
        timeoutId = setTimeout(() => {
          pyShell.terminate();
          
          if (metricsCallback) {
            metricsCallback('error', {
              message: 'Execution timed out',
              stack: 'Execution timed out after ' + timeout + 'ms',
              line: 'unknown'
            });
          }
          
          // Clean up temp file
          try {
            fs.unlinkSync(tempFile);
          } catch (err) {
            console.error('Error removing temp file:', err);
          }
          
          reject(new Error('Execution timed out'));
        }, timeout);
        
        // Feed input if provided
        if (inputLines.length > 0) {
          inputLines.forEach(line => {
            pyShell.send(line);
          });
        }
        
        // Collect output and parse metrics
        let metricsData = {
          memoryUsage: [],
          functionCalls: [],
          variableStates: [],
          executionFlow: []
        };
        
        pyShell.on('message', (message) => {
          // Check for metrics events
          if (message.startsWith('__METRICS_EVENT__')) {
            try {
              const eventData = JSON.parse(message.substring('__METRICS_EVENT__'.length));
              if (metricsCallback && eventData.event && eventData.data) {
                metricsCallback(eventData.event, eventData.data);
              }
            } catch (err) {
              console.error('Error parsing metrics event:', err);
            }
          }
          // Check for complete event
          else if (message.startsWith('__METRICS_COMPLETE__')) {
            try {
              metricsData = JSON.parse(message.substring('__METRICS_COMPLETE__'.length));
            } catch (err) {
              console.error('Error parsing final metrics:', err);
            }
          }
          // Check for error event
          else if (message.startsWith('__METRICS_ERROR__')) {
            try {
              const errorData = JSON.parse(message.substring('__METRICS_ERROR__'.length));
              if (metricsCallback) {
                metricsCallback('error', errorData);
              }
              
              // Clean up timeout
              if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
              }
              
              // Clean up temp file
              try {
                fs.unlinkSync(tempFile);
              } catch (err) {
                console.error('Error removing temp file:', err);
              }
              
              reject(new Error(errorData.message));
            } catch (err) {
              console.error('Error parsing error data:', err);
              reject(err);
            }
          }
          // Regular output
          else {
            // Handle regular output if needed
          }
        });
        
        pyShell.end((err, exitCode, exitSignal) => {
          // Clean up timeout
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          
          // Clean up temp file
          try {
            fs.unlinkSync(tempFile);
          } catch (cleanupErr) {
            console.error('Error removing temp file:', cleanupErr);
          }
          
          if (err) {
            if (metricsCallback) {
              metricsCallback('error', {
                message: err.message,
                stack: err.stack,
                line: 'unknown'
              });
            }
            reject(err);
          } else {
            resolve(metricsData);
          }
        });
      } catch (error) {
        // Clean up temp file if it was created
        try {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
        } catch (cleanupErr) {
          console.error('Error removing temp file:', cleanupErr);
        }
        
        if (metricsCallback) {
          metricsCallback('error', {
            message: error.message,
            stack: error.stack,
            line: 'unknown'
          });
        }
        reject(error);
      }
    });
  }
};

/**
 * Helper function to instrument Python functions
 */
function instrumentPythonFunctions(code) {
  // This is a simplified approach. In practice, you'd want to use a proper
  // Python parser or AST transformer to correctly handle all edge cases.
  
  // Identify function definitions and add decorator
  const functionRegex = /(\s*)(def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(.*\):)/g;
  
  return code.replace(functionRegex, (match, indentation, definition, funcName) => {
    return `${indentation}@track_function\n${indentation}${definition}`;
  });
}

module.exports = pythonHandler;