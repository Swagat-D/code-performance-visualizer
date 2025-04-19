/**
 * Service for processing and analyzing code execution metrics
 */
const metricsService = {
  /**
   * Process raw metrics into formatted data for visualizations
   */
  processMetrics: (metrics) => {
    return {
      summary: calculateSummaryMetrics(metrics),
      timeComplexity: analyzeTimeComplexity(metrics),
      memoryUsage: processMemoryData(metrics.memoryUsage),
      callGraph: generateCallGraph(metrics.functionCalls),
      executionFlow: processExecutionFlow(metrics.executionFlow),
      variableTracing: processVariableStates(metrics.variableStates)
    };
  },
  
  /**
   * Compare metrics between two code executions
   */
  compareMetrics: (metrics1, metrics2) => {
    const comparison = {
      executionTime: {
        diff: metrics2.metrics.summary.executionTime - metrics1.metrics.summary.executionTime,
        percentChange: calculatePercentChange(
          metrics1.metrics.summary.executionTime,
          metrics2.metrics.summary.executionTime
        )
      },
      memoryUsage: {
        diff: metrics2.metrics.summary.peakMemory - metrics1.metrics.summary.peakMemory,
        percentChange: calculatePercentChange(
          metrics1.metrics.summary.peakMemory,
          metrics2.metrics.summary.peakMemory
        )
      },
      functionCalls: {
        diff: metrics2.metrics.summary.totalFunctionCalls - metrics1.metrics.summary.totalFunctionCalls,
        percentChange: calculatePercentChange(
          metrics1.metrics.summary.totalFunctionCalls,
          metrics2.metrics.summary.totalFunctionCalls
        )
      }
    };
    
    // Determine which code performed better overall
    comparison.overallImprovement = determineOverallImprovement(comparison);
    
    return comparison;
  }
};

/**
 * Calculate summary metrics from raw data
 */
function calculateSummaryMetrics(metrics) {
  // Calculate peak memory usage
  const peakMemory = metrics.memoryUsage.reduce((max, point) => 
    point.value > max ? point.value : max, 0);
  
  // Count total function calls
  const totalFunctionCalls = metrics.functionCalls.length;
  
  // Count unique functions called
  const uniqueFunctions = new Set(
    metrics.functionCalls.map(call => call.name)
  ).size;
  
  // Find the most expensive function (by cumulative time)
  const functionTimes = {};
  metrics.functionCalls.forEach(call => {
    if (!functionTimes[call.name]) {
      functionTimes[call.name] = 0;
    }
    functionTimes[call.name] += call.duration;
  });
  
  let mostExpensiveFunction = null;
  let maxTime = 0;
  
  Object.entries(functionTimes).forEach(([name, time]) => {
    if (time > maxTime) {
      maxTime = time;
      mostExpensiveFunction = name;
    }
  });
  
  return {
    executionTime: metrics.executionTime,
    peakMemory,
    totalFunctionCalls,
    uniqueFunctions,
    mostExpensiveFunction,
    mostExpensiveFunctionTime: maxTime
  };
}

/**
 * Analyze time complexity based on execution patterns
 */
function analyzeTimeComplexity(metrics) {
  // This is a simplified placeholder for time complexity analysis
  // A real implementation would use regression analysis on input size vs. execution time
  
  // For demonstration, we'll just return a placeholder
  return {
    estimatedComplexity: 'O(n)', // Placeholder
    confidence: 0.8, // Placeholder
    dataPoints: [] // This would contain execution times at different input sizes
  };
}

/**
 * Process memory usage data for visualization
 */
function processMemoryData(memoryData) {
  // Convert to format suitable for charts
  return memoryData.map((point, index) => ({
    timestamp: point.timestamp,
    value: point.value,
    allocation: point.allocation || null,
    deallocation: point.deallocation || null
  }));
}

/**
 * Generate call graph from function call data
 */
function generateCallGraph(functionCalls) {
  const nodes = new Set();
  const links = [];
  const callCountMap = new Map();
  
  // Process function calls to build the graph
  functionCalls.forEach(call => {
    const source = call.caller || 'global';
    const target = call.name;
    
    nodes.add(source);
    nodes.add(target);
    
    // Create a unique link identifier
    const linkId = `${source}->${target}`;
    
    // Count occurrences of this link
    if (!callCountMap.has(linkId)) {
      callCountMap.set(linkId, {
        source,
        target,
        count: 1,
        totalDuration: call.duration
      });
    } else {
      const existing = callCountMap.get(linkId);
      existing.count += 1;
      existing.totalDuration += call.duration;
    }
  });
  
  // Convert the Map to an array of links
  callCountMap.forEach(value => {
    links.push({
      source: value.source,
      target: value.target,
      count: value.count,
      averageDuration: value.totalDuration / value.count
    });
  });
  
  return {
    nodes: Array.from(nodes).map(id => ({ id })),
    links
  };
}

/**
 * Process execution flow data for visualization
 */
function processExecutionFlow(executionFlow) {
  // Group by line number
  const lineExecutions = {};
  
  executionFlow.forEach(step => {
    if (!lineExecutions[step.line]) {
      lineExecutions[step.line] = {
        line: step.line,
        code: step.code,
        executionCount: 0,
        totalTime: 0,
        timestamps: []
      };
    }
    
    lineExecutions[step.line].executionCount++;
    lineExecutions[step.line].totalTime += step.duration || 0;
    lineExecutions[step.line].timestamps.push(step.timestamp);
  });
  
  // Convert to array and calculate average time
  return Object.values(lineExecutions).map(line => ({
    ...line,
    averageTime: line.totalTime / line.executionCount
  }));
}

/**
 * Process variable state changes for visualization
 */
function processVariableStates(variableStates) {
  // Group by variable name
  const variables = {};
  
  variableStates.forEach(state => {
    if (!variables[state.name]) {
      variables[state.name] = {
        name: state.name,
        type: state.type,
        changes: []
      };
    }
    
    variables[state.name].changes.push({
      timestamp: state.timestamp,
      value: state.value,
      line: state.line
    });
  });
  
  return Object.values(variables);
}

/**
 * Calculate percent change between two values
 */
function calculatePercentChange(oldValue, newValue) {
  if (oldValue === 0) return newValue === 0 ? 0 : 100;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Determine which code performed better overall
 */
function determineOverallImprovement(comparison) {
  // Lower is better for execution time and memory usage
  let score = 0;
  
  // Weigh execution time most heavily
  if (comparison.executionTime.percentChange < 0) {
    score += 3; // Improved execution time
  } else if (comparison.executionTime.percentChange > 0) {
    score -= 3; // Worse execution time
  }
  
  // Weigh memory usage second
  if (comparison.memoryUsage.percentChange < 0) {
    score += 2; // Improved memory usage
  } else if (comparison.memoryUsage.percentChange > 0) {
    score -= 2; // Worse memory usage
  }
  
  // Function calls can be either way depending on optimization strategy
  // so we don't factor it into the overall score as heavily
  if (comparison.functionCalls.percentChange < 0) {
    score += 1; // Fewer function calls
  } else if (comparison.functionCalls.percentChange > 0) {
    score -= 1; // More function calls
  }
  
  if (score > 0) return 'code1';
  if (score < 0) return 'code2';
  return 'tie';
}

module.exports = metricsService;