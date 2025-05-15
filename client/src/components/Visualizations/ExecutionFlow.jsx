import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './Visualizations.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ExecutionFlow = ({ metrics, code }) => {
  const [executionData, setExecutionData] = useState(null);
  const [ setLineData] = useState([]);
  
  useEffect(() => {
    if (metrics && metrics.executionFlow) {
      // Process execution flow data
      const processedData = processExecutionFlowData(metrics.executionFlow);
      setExecutionData(processedData);
      
      // Extract line data from code
      const codeLines = code.split('\n').map((line, index) => ({
        lineNumber: index + 1,
        code: line
      }));
      setLineData(codeLines);
    }
  }, [metrics, code, setLineData]);
  
  // Process execution flow data for visualization
  const processExecutionFlowData = (executionFlow) => {
    // Group by line number
    const lineGroups = {};
    
    executionFlow.forEach(step => {
      if (!lineGroups[step.line]) {
        lineGroups[step.line] = {
          line: step.line,
          code: step.code,
          executionCount: 0,
          totalDuration: 0
        };
      }
      
      lineGroups[step.line].executionCount += 1;
      lineGroups[step.line].totalDuration += step.duration;
    });
    
    // Convert to array and calculate average duration
    const data = Object.values(lineGroups).map(line => ({
      ...line,
      averageDuration: line.totalDuration / line.executionCount
    }));
    
    // Sort by line number
    return data.sort((a, b) => a.line - b.line);
  };
  
  // Generate chart data
  const getChartData = () => {
    const labels = executionData.map(item => `Line ${item.line}`);
    const executionCounts = executionData.map(item => item.executionCount);
    const durations = executionData.map(item => item.averageDuration);
    
    return {
      labels,
      datasets: [
        {
          label: 'Execution Count',
          data: executionCounts,
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          borderColor: 'rgb(53, 162, 235)',
          borderWidth: 1
        },
        {
          label: 'Avg Duration (ms)',
          data: durations,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ]
    };
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Code Line'
        }
      },
      y: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'Execution Count'
        }
      },
      y1: {
        type: 'linear',
        position: 'right',
        title: {
          display: true,
          text: 'Duration (ms)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          afterTitle: (context) => {
            const dataIndex = context[0].dataIndex;
            const item = executionData[dataIndex];
            return `Code: ${item.code}`;
          }
        }
      }
    }
  };
  
  if (!executionData || executionData.length === 0) {
    return (
      <div className="visualization-placeholder">
        <p>No execution flow data available.</p>
      </div>
    );
  }
  
  return (
    <div className="execution-flow-visualization">
      <h3>Execution Flow Analysis</h3>
      
      <div className="chart-container">
        <Bar data={getChartData()} options={chartOptions} />
      </div>
      
      <div className="execution-flow-details">
        <h4>Code Execution Breakdown</h4>
        <table className="execution-table">
          <thead>
            <tr>
              <th>Line</th>
              <th>Code</th>
              <th>Executions</th>
              <th>Avg. Duration (ms)</th>
              <th>Total Duration (ms)</th>
            </tr>
          </thead>
          <tbody>
            {executionData.map((item) => (
              <tr key={item.line} className={item.executionCount > 10 ? 'high-execution' : ''}>
                <td>{item.line}</td>
                <td className="code-column">{item.code}</td>
                <td>{item.executionCount}</td>
                <td>{item.averageDuration.toFixed(2)}</td>
                <td>{item.totalDuration.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExecutionFlow;