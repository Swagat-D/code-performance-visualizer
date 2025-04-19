import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import './Visualizations.css';

const TimeComplexity = ({ metrics }) => {
  const [complexityData, setComplexityData] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  
  useEffect(() => {
    if (metrics && metrics.timeComplexity) {
      setComplexityData(metrics.timeComplexity);
      
      // Generate heatmap data from execution flow
      if (metrics.executionFlow && metrics.executionFlow.length > 0) {
        const heatmapData = generateHeatmapData(metrics.executionFlow);
        setHeatmapData(heatmapData);
      }
    }
  }, [metrics]);
  
  // Generate heatmap data from execution flow
  const generateHeatmapData = (executionFlow) => {
    // Group by line number
    const lineGroups = {};
    
    executionFlow.forEach(step => {
      if (!lineGroups[step.line]) {
        lineGroups[step.line] = {
          line: step.line,
          code: step.code,
          executions: []
        };
  
  // Render Time Complexity Component
  return (
    <div className="time-complexity-visualization">
      <h3>Time Complexity Analysis</h3>
      
      {complexityData && complexityData.estimatedComplexity ? (
        <div className="complexity-info">
          <div className="complexity-badge">
            <span className="complexity-notation">{complexityData.estimatedComplexity}</span>
            <span className="complexity-name">{getComplexityName(complexityData.estimatedComplexity)}</span>
            {complexityData.confidence && (
              <span className="complexity-confidence">
                Confidence: {(complexityData.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
          
          <div className="complexity-details">
            <p className="complexity-description">
              {getComplexityDescription(complexityData.estimatedComplexity)}
            </p>
            <p className="complexity-example">
              <strong>Example:</strong> {getComplexityExample(complexityData.estimatedComplexity)}
            </p>
          </div>
        </div>
      ) : (
        <div className="complexity-warning">
          <p>Time complexity estimation requires multiple executions with different input sizes.</p>
        </div>
      )}
      
      <div className="hotspot-analysis">
        <h4>Performance Hotspots</h4>
        {heatmapData.length > 0 ? (
          <div className="hotspot-table-container">
            <table className="data-table hotspot-table">
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Code</th>
                  <th>Executions</th>
                  <th>Total Time (ms)</th>
                  <th>Impact</th>
                </tr>
              </thead>
              <tbody>
                {heatmapData.slice(0, 10).map((item, index) => (
                  <tr key={index} className={index < 3 ? 'hotspot-high' : index < 6 ? 'hotspot-medium' : 'hotspot-low'}>
                    <td>{item.line}</td>
                    <td className="code-column">{item.code}</td>
                    <td>{item.executionCount}</td>
                    <td>{item.totalDuration.toFixed(2)}</td>
                    <td>
                      <div className="impact-bar-container">
                        <div 
                          className="impact-bar" 
                          style={{ 
                            width: `${Math.min(100, (item.totalDuration / heatmapData[0].totalDuration) * 100)}%`,
                            backgroundColor: index < 3 ? '#ff5252' : index < 6 ? '#ff9800' : '#4caf50'
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data-message">No performance hotspots detected.</p>
        )}
      </div>
      
      <div className="optimization-suggestions">
        <h4>Optimization Suggestions</h4>
        {heatmapData.length > 0 ? (
          <ul className="suggestions-list">
            {heatmapData.slice(0, 3).map((item, index) => (
              <li key={index} className="suggestion-item">
                <div className="suggestion-header">
                  <span className="suggestion-priority">Priority {index + 1}</span>
                  <span className="suggestion-line">Line {item.line}</span>
                </div>
                <div className="suggestion-code">{item.code}</div>
                <div className="suggestion-text">
                  {item.executionCount > 100 ? (
                    <p>This line is executed very frequently ({item.executionCount} times). Consider moving it outside of loops if possible, or caching its result.</p>
                  ) : item.avgDuration > 1 ? (
                    <p>This operation is relatively expensive (avg {item.avgDuration.toFixed(2)} ms). Look for more efficient algorithms or data structures.</p>
                  ) : (
                    <p>This code has a high cumulative impact on performance. Review for potential optimizations.</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-data-message">No specific optimization suggestions available.</p>
        )}
        
        <div className="general-tips">
          <h5>General Optimization Tips</h5>
          <ul>
            <li>Avoid unnecessary operations inside loops</li>
            <li>Use appropriate data structures for your operations</li>
            <li>Consider memoization for expensive calculations</li>
            <li>Minimize object creation in critical paths</li>
            <li>Consider asynchronous operations for I/O-bound tasks</li>
          </ul>
        </div>
      </div>
    </div>
  );
      }
      
      lineGroups[step.line].executions.push({
        time: step.timestamp,
        duration: step.duration
      });
    });
    
    // Convert to heatmap data
    const data = [];
    Object.values(lineGroups).forEach(group => {
      // Only include lines executed multiple times
      if (group.executions.length > 1) {
        data.push({
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
    
    return data.sort((a, b) => b.totalDuration - a.totalDuration);
  };

  // Render Time Complexity Component
  return (
    <div className="time-complexity-visualization">
      <h3>Time Complexity Analysis</h3>
      
      {complexityData && complexityData.estimatedComplexity ? (
        <div className="complexity-info">
          <div className="complexity-badge">
            <span className="complexity-notation">{complexityData.estimatedComplexity}</span>
            <span className="complexity-name">{getComplexityName(complexityData.estimatedComplexity)}</span>
            {complexityData.confidence && (
              <span className="complexity-confidence">
                Confidence: {(complexityData.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
          
          <div className="complexity-details">
            <p className="complexity-description">
              {getComplexityDescription(complexityData.estimatedComplexity)}
            </p>
            <p className="complexity-example">
              <strong>Example:</strong> {getComplexityExample(complexityData.estimatedComplexity)}
            </p>
          </div>
        </div>
      ) : (
        <div className="complexity-warning">
          <p>Time complexity estimation requires multiple executions with different input sizes.</p>
        </div>
      )}
      
      <div className="hotspot-analysis">
        <h4>Performance Hotspots</h4>
        {heatmapData.length > 0 ? (
          <div className="hotspot-table-container">
            <table className="data-table hotspot-table">
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Code</th>
                  <th>Executions</th>
                  <th>Total Time (ms)</th>
                  <th>Impact</th>
                </tr>
              </thead>
              <tbody>
                {heatmapData.slice(0, 10).map((item, index) => (
                  <tr key={index} className={index < 3 ? 'hotspot-high' : index < 6 ? 'hotspot-medium' : 'hotspot-low'}>
                    <td>{item.line}</td>
                    <td className="code-column">{item.code}</td>
                    <td>{item.executionCount}</td>
                    <td>{item.totalDuration.toFixed(2)}</td>
                    <td>
                      <div className="impact-bar-container">
                        <div 
                          className="impact-bar" 
                          style={{ 
                            width: `${Math.min(100, (item.totalDuration / heatmapData[0].totalDuration) * 100)}%`,
                            backgroundColor: index < 3 ? '#ff5252' : index < 6 ? '#ff9800' : '#4caf50'
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data-message">No performance hotspots detected.</p>
        )}
      </div>
      
      <div className="optimization-suggestions">
        <h4>Optimization Suggestions</h4>
        {heatmapData.length > 0 ? (
          <ul className="suggestions-list">
            {heatmapData.slice(0, 3).map((item, index) => (
              <li key={index} className="suggestion-item">
                <div className="suggestion-header">
                  <span className="suggestion-priority">Priority {index + 1}</span>
                  <span className="suggestion-line">Line {item.line}</span>
                </div>
                <div className="suggestion-code">{item.code}</div>
                <div className="suggestion-text">
                  {item.executionCount > 100 ? (
                    <p>This line is executed very frequently ({item.executionCount} times). Consider moving it outside of loops if possible, or caching its result.</p>
                  ) : item.avgDuration > 1 ? (
                    <p>This operation is relatively expensive (avg {item.avgDuration.toFixed(2)} ms). Look for more efficient algorithms or data structures.</p>
                  ) : (
                    <p>This code has a high cumulative impact on performance. Review for potential optimizations.</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-data-message">No specific optimization suggestions available.</p>
        )}
        
        <div className="general-tips">
          <h5>General Optimization Tips</h5>
          <ul>
            <li>Avoid unnecessary operations inside loops</li>
            <li>Use appropriate data structures for your operations</li>
            <li>Consider memoization for expensive calculations</li>
            <li>Minimize object creation in critical paths</li>
            <li>Consider asynchronous operations for I/O-bound tasks</li>
          </ul>
        </div>
      </div>
    </div>
  );
  const complexityMap = {
    'O(1)': 'Constant Time',
    'O(log n)': 'Logarithmic Time',
    'O(n)': 'Linear Time',
    'O(n log n)': 'Log-Linear Time',
    'O(n²)': 'Quadratic Time',
    'O(n³)': 'Cubic Time',
    'O(2^n)': 'Exponential Time',
    'O(n!)': 'Factorial Time'
  };
  
  return complexityMap[complexity] || complexity;
};
  
  // Get complexity description
  const getComplexityDescription = (complexity) => {
    const descriptions = {
      'O(1)': 'The algorithm takes the same amount of time regardless of input size.',
      'O(log n)': 'The algorithm\'s time increases logarithmically with input size. Common in binary search algorithms.',
      'O(n)': 'The algorithm\'s time increases linearly with input size. Common in simple iterations.',
      'O(n log n)': 'The algorithm\'s time increases log-linearly. Common in efficient sorting algorithms like merge sort.',
      'O(n²)': 'The algorithm\'s time increases quadratically. Common in nested loops and simple sorting algorithms.',
      'O(n³)': 'The algorithm\'s time increases cubically. Common in triple nested loops.',
      'O(2^n)': 'The algorithm\'s time increases exponentially. Common in brute-force algorithms.',
      'O(n!)': 'The algorithm\'s time increases factorially. Common in permutation algorithms.'
    };
    
    return descriptions[complexity] || 'Complexity analysis not available.';
  };
  
  // Get complexity example
  const getComplexityExample = (complexity) => {
    const examples = {
      'O(1)': 'Accessing an array element by index',
      'O(log n)': 'Binary search in a sorted array',
      'O(n)': 'Linear search in an array',
      'O(n log n)': 'Merge sort or quick sort algorithm',
      'O(n²)': 'Bubble sort or insertion sort algorithm',
      'O(n³)': 'Matrix multiplication (naive approach)',
      'O(2^n)': 'Recursive calculation of Fibonacci numbers',
      'O(n!)': 'Brute force solution to Traveling Salesman Problem'
    };
    
    return examples[complexity] || 'Example not available.';
  };