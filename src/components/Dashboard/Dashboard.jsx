import React, { useState } from 'react';
import CodeEditor from '../CodeEditor/CodeEditor';
import LanguageSelector from '../LanguageSelector/LanguageSelector';
import ExecutionControls from '../ExecutionControls/ExecutionControls';
import useCodeExecution from '../../hooks/useCodeExecution';
import './Dashboard.css';

// Visualization components
import ExecutionFlow from '../Visualizations/ExecutionFlow';
import MemoryUsage from '../Visualizations/MemoryUsage';
import CallStack from '../Visualizations/CallStack';
import TimeComplexity from '../Visualizations/TimeComplexity';

const Dashboard = () => {
  const {
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
    clearResults
  } = useCodeExecution();
  
  // Local state for UI management
  const [activeTab, setActiveTab] = useState('execution-flow');
  
  return (
    <div className="dashboard">
      <div className="dashboard-left">
        <div className="code-panel">
          <div className="code-panel-header">
            <LanguageSelector 
              language={language}
              supportedLanguages={supportedLanguages}
              onChange={setLanguage}
            />
          </div>
          
          <CodeEditor
            code={code}
            onChange={setCode}
            language={language}
            readOnly={isExecuting}
          />
          
          <div className="input-panel">
            <h3>Input</h3>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input here (one value per line)..."
              disabled={isExecuting}
              className="input-textarea"
            />
          </div>
          
          <ExecutionControls
            onRun={runCode}
            onClear={clearResults}
            isExecuting={isExecuting}
          />
        </div>
      </div>
      
      <div className="dashboard-right">
        {executionError ? (
          <div className="error-container">
            <h3>Error</h3>
            <div className="error-message">{executionError}</div>
          </div>
        ) : metrics ? (
          <div className="visualization-container">
            <div className="visualization-tabs">
              <button 
                className={`tab-button ${activeTab === 'execution-flow' ? 'active' : ''}`}
                onClick={() => setActiveTab('execution-flow')}
              >
                Execution Flow
              </button>
              <button 
                className={`tab-button ${activeTab === 'memory-usage' ? 'active' : ''}`}
                onClick={() => setActiveTab('memory-usage')}
              >
                Memory Usage
              </button>
              <button 
                className={`tab-button ${activeTab === 'call-stack' ? 'active' : ''}`}
                onClick={() => setActiveTab('call-stack')}
              >
                Call Graph
              </button>
              <button 
                className={`tab-button ${activeTab === 'time-complexity' ? 'active' : ''}`}
                onClick={() => setActiveTab('time-complexity')}
              >
                Time Complexity
              </button>
            </div>
            
            <div className="visualization-content">
              {activeTab === 'execution-flow' && (
                <ExecutionFlow metrics={metrics} code={code} />
              )}
              
              {activeTab === 'memory-usage' && (
                <MemoryUsage metrics={metrics} />
              )}
              
              {activeTab === 'call-stack' && (
                <CallStack metrics={metrics} />
              )}
              
              {activeTab === 'time-complexity' && (
                <TimeComplexity metrics={metrics} />
              )}
            </div>
            
            <div className="metrics-summary">
              <h3>Execution Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Execution Time:</span>
                  <span className="summary-value">{metrics.summary.executionTime.toFixed(2)} ms</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Peak Memory:</span>
                  <span className="summary-value">{(metrics.summary.peakMemory / 1024).toFixed(2)} KB</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Function Calls:</span>
                  <span className="summary-value">{metrics.summary.totalFunctionCalls}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Unique Functions:</span>
                  <span className="summary-value">{metrics.summary.uniqueFunctions}</span>
                </div>
                {metrics.summary.mostExpensiveFunction && (
                  <div className="summary-item">
                    <span className="summary-label">Most Expensive Function:</span>
                    <span className="summary-value">
                      {metrics.summary.mostExpensiveFunction} 
                      ({metrics.summary.mostExpensiveFunctionTime.toFixed(2)} ms)
                    </span>
                  </div>
                )}
                {metrics.timeComplexity && metrics.timeComplexity.estimatedComplexity && (
                  <div className="summary-item">
                    <span className="summary-label">Estimated Complexity:</span>
                    <span className="summary-value">{metrics.timeComplexity.estimatedComplexity}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-content">
              <h2>Run your code to see performance metrics</h2>
              <p>Write or paste your code in the editor, then click "Run" to analyze performance.</p>
              <ul>
                <li>See memory usage in real-time</li>
                <li>Visualize function call graph</li>
                <li>Analyze execution flow</li>
                <li>Identify performance bottlenecks</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;