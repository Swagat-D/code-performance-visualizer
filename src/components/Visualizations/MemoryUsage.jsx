import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import './Visualizations.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const MemoryUsage = ({ metrics }) => {
  const [memoryData, setMemoryData] = useState(null);
  
  useEffect(() => {
    if (metrics && metrics.memoryUsage && metrics.memoryUsage.length > 0) {
      setMemoryData(metrics.memoryUsage);
    }
  }, [metrics]);
  
  // Generate chart data
  const getChartData = () => {
    const labels = memoryData.map(point => `${(point.timestamp / 1000).toFixed(2)}s`);
    const memoryValues = memoryData.map(point => point.value / 1024); // Convert to KB
    
    return {
      labels,
      datasets: [
        {
          label: 'Memory Usage (KB)',
          data: memoryValues,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
          fill: true,
        }
      ]
    };
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Memory Usage Over Time'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const dataPoint = memoryData[context.dataIndex];
            return `Memory: ${(dataPoint.value / 1024).toFixed(2)} KB`;
          },
          afterLabel: (context) => {
            const dataPoint = memoryData[context.dataIndex];
            const lines = [];
            
            if (dataPoint.allocation && dataPoint.allocation > 0) {
              lines.push(`Allocation: +${(dataPoint.allocation / 1024).toFixed(2)} KB`);
            }
            
            if (dataPoint.deallocation && dataPoint.deallocation > 0) {
              lines.push(`Deallocation: -${(dataPoint.deallocation / 1024).toFixed(2)} KB`);
            }
            
            return lines;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time (seconds)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Memory (KB)'
        },
        beginAtZero: true
      }
    }
  };
  
  // Calculate memory statistics
  const getMemoryStats = () => {
    if (!memoryData || memoryData.length === 0) return null;
    
    const memoryValues = memoryData.map(point => point.value / 1024); // Convert to KB
    
    const initialMemory = memoryValues[0];
    const finalMemory = memoryValues[memoryValues.length - 1];
    const peakMemory = Math.max(...memoryValues);
    const minMemory = Math.min(...memoryValues);
    const averageMemory = memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length;
    const memoryGrowth = finalMemory - initialMemory;
    
    return {
      initialMemory,
      finalMemory,
      peakMemory,
      minMemory,
      averageMemory,
      memoryGrowth
    };
  };
  
  if (!memoryData || memoryData.length === 0) {
    return (
      <div className="visualization-placeholder">
        <p>No memory usage data available.</p>
      </div>
    );
  }
  
  const memoryStats = getMemoryStats();
  
  return (
    <div className="memory-usage-visualization">
      <h3>Memory Usage Analysis</h3>
      
      <div className="chart-container">
        <Line data={getChartData()} options={chartOptions} />
      </div>
      
      {memoryStats && (
        <div className="memory-stats">
          <h4>Memory Statistics</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Initial Memory:</span>
              <span className="stat-value">{memoryStats.initialMemory.toFixed(2)} KB</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Final Memory:</span>
              <span className="stat-value">{memoryStats.finalMemory.toFixed(2)} KB</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Peak Memory:</span>
              <span className="stat-value">{memoryStats.peakMemory.toFixed(2)} KB</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Minimum Memory:</span>
              <span className="stat-value">{memoryStats.minMemory.toFixed(2)} KB</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average Memory:</span>
              <span className="stat-value">{memoryStats.averageMemory.toFixed(2)} KB</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Memory Growth:</span>
              <span className={`stat-value ${memoryStats.memoryGrowth > 0 ? 'positive' : 'negative'}`}>
                {memoryStats.memoryGrowth > 0 ? '+' : ''}{memoryStats.memoryGrowth.toFixed(2)} KB
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div className="memory-timeline">
        <h4>Memory Allocation Timeline</h4>
        <div className="timeline-container">
          {memoryData.map((point, index) => {
            if (point.allocation > 0 || point.deallocation > 0) {
              return (
                <div key={index} className="timeline-event">
                  <div className="timeline-time">{(point.timestamp / 1000).toFixed(2)}s</div>
                  <div className="timeline-marker"></div>
                  <div className="timeline-details">
                    <div className="memory-value">Memory: {(point.value / 1024).toFixed(2)} KB</div>
                    {point.allocation > 0 && (
                      <div className="allocation">Allocated: +{(point.allocation / 1024).toFixed(2)} KB</div>
                    )}
                    {point.deallocation > 0 && (
                      <div className="deallocation">Deallocated: -{(point.deallocation / 1024).toFixed(2)} KB</div>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          }).filter(Boolean)}
        </div>
      </div>
    </div>
  );
};

export default MemoryUsage;