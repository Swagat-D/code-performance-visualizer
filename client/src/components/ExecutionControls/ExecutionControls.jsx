import React from 'react';
import './ExecutionControls.css';

const ExecutionControls = ({ onRun, onClear, isExecuting }) => {
  return (
    <div className="execution-controls">
      <button 
        className="run-button"
        onClick={onRun}
        disabled={isExecuting}
      >
        {isExecuting ? (
          <>
            <span className="spinner"></span>
            Running...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-play-fill" viewBox="0 0 16 16">
              <path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
            </svg>
            Run
          </>
        )}
      </button>
      
      <button 
        className="clear-button"
        onClick={onClear}
        disabled={isExecuting}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-circle" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
        </svg>
        Clear
      </button>
    </div>
  );
};

export default ExecutionControls;