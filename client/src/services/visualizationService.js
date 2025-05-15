import * as d3 from 'd3';

/**
 * Service for processing metrics data for visualizations
 */
const visualizationService = {
  /**
   * Process memory usage data for charts
   */
  processMemoryData: (memoryData) => {
    if (!memoryData || !Array.isArray(memoryData) || memoryData.length === 0) {
      return [];
    }
    
    // Format data for Chart.js
    return memoryData.map(point => ({
      x: point.timestamp,
      y: point.value / 1024, // Convert to KB
    }));
  },
  
  /**
   * Process function call data for charts
   */
  processFunctionCallData: (functionCalls) => {
    if (!functionCalls || !Array.isArray(functionCalls) || functionCalls.length === 0) {
      return { functionDurations: [], callCounts: [] };
    }
    
    // Group by function name
    const functionGroups = {};
    
    functionCalls.forEach(call => {
      if (!functionGroups[call.name]) {
        functionGroups[call.name] = {
          name: call.name,
          totalDuration: 0,
          callCount: 0,
          avgDuration: 0,
          calls: []
        };
      }
      
      functionGroups[call.name].totalDuration += call.duration;
      functionGroups[call.name].callCount += 1;
      functionGroups[call.name].calls.push(call);
    });
    
    // Calculate average durations
    Object.values(functionGroups).forEach(group => {
      group.avgDuration = group.totalDuration / group.callCount;
    });
    
    // Sort by total duration (descending)
    const sortedFunctions = Object.values(functionGroups).sort((a, b) => 
      b.totalDuration - a.totalDuration
    );
    
    // Format for bar charts
    const functionDurations = sortedFunctions.map(func => ({
      name: func.name,
      totalDuration: func.totalDuration,
      avgDuration: func.avgDuration
    }));
    
    // Format for pie chart
    const callCounts = sortedFunctions.map(func => ({
      name: func.name,
      count: func.callCount
    }));
    
    return {
      functionDurations,
      callCounts
    };
  },
  
  /**
   * Process execution flow data for visualization
   */
  processExecutionFlowData: (executionFlow) => {
    if (!executionFlow || !Array.isArray(executionFlow) || executionFlow.length === 0) {
      return [];
    }
    
    // Group by line number
    const lineGroups = {};
    
    executionFlow.forEach(step => {
      if (!lineGroups[step.line]) {
        lineGroups[step.line] = {
          line: step.line,
          code: step.code,
          totalDuration: 0,
          executionCount: 0,
          avgDuration: 0
        };
      }
      
      lineGroups[step.line].totalDuration += step.duration;
      lineGroups[step.line].executionCount += 1;
    });
    
    // Calculate average durations
    Object.values(lineGroups).forEach(group => {
      group.avgDuration = group.totalDuration / group.executionCount;
    });
    
    // Sort by line number
    return Object.values(lineGroups).sort((a, b) => a.line - b.line);
  },
  
  /**
   * Generate call graph data for D3 visualization
   */
  generateCallGraphData: (functionCalls) => {
    if (!functionCalls || !Array.isArray(functionCalls) || functionCalls.length === 0) {
      return { nodes: [], links: [] };
    }
    
    const nodes = new Set();
    const linkMap = new Map();
    
    // Process function calls
    functionCalls.forEach(call => {
      const source = call.caller || 'global';
      const target = call.name;
      
      // Add nodes
      nodes.add(source);
      nodes.add(target);
      
      // Create or update link
      const linkId = `${source}-${target}`;
      if (!linkMap.has(linkId)) {
        linkMap.set(linkId, {
          source,
          target,
          count: 1,
          totalDuration: call.duration
        });
      } else {
        const link = linkMap.get(linkId);
        link.count += 1;
        link.totalDuration += call.duration;
      }
    });
    
    // Convert to D3 format
    const graphNodes = Array.from(nodes).map(id => ({ id }));
    const graphLinks = Array.from(linkMap.values()).map(link => ({
      source: link.source,
      target: link.target,
      count: link.count,
      value: link.count, // For D3 force layout
      avgDuration: link.totalDuration / link.count
    }));
    
    return {
      nodes: graphNodes,
      links: graphLinks
    };
  },
  
  /**
   * Process variable state data for visualization
   */
  processVariableStateData: (variableStates) => {
    if (!variableStates || !Array.isArray(variableStates) || variableStates.length === 0) {
      return [];
    }
    
    // Group by variable name
    const variableGroups = {};
    
    variableStates.forEach(state => {
      if (!variableGroups[state.name]) {
        variableGroups[state.name] = {
          name: state.name,
          type: state.type,
          changes: []
        };
      }
      
      variableGroups[state.name].changes.push({
        timestamp: state.timestamp,
        value: state.value,
        line: state.line
      });
    });
    
    return Object.values(variableGroups);
  },
  
  /**
   * Generate heatmap data for time complexity visualization
   */
  generateTimeComplexityData: (metrics) => {
    // This would normally use the input size vs. time data
    // For now, we'll use the execution flow data to simulate
    
    if (!metrics || !metrics.executionFlow || metrics.executionFlow.length === 0) {
      return [];
    }
    
    // Group by line number
    const lineGroups = {};
    
    metrics.executionFlow.forEach(step => {
      if (!lineGroups[step.line]) {
        lineGroups[step.line] = {
          line: step.line,
          code: step.code,
          executions: []
        };
      }
      
      lineGroups[step.line].executions.push({
        time: step.timestamp,
        duration: step.duration
      });
    });
    
    // Convert to heatmap data
    const heatmapData = [];
    Object.values(lineGroups).forEach(group => {
      // Only include lines executed multiple times
      if (group.executions.length > 1) {
        heatmapData.push({
          line: group.line,
          code: group.code,
          executionCount: group.executions.length,
          totalDuration: group.executions.reduce((sum, exec) => sum + exec.duration, 0),
          avgDuration: group.executions.reduce((sum, exec) => sum + exec.duration, 0) / group.executions.length,
          // For heatmap intensity
          intensity: Math.log(group.executions.length) / Math.log(10) // Log scale for better visualization
        });
      }
    });
    
    return heatmapData.sort((a, b) => b.totalDuration - a.totalDuration);
  }
};