import React from 'react';
import './App.css';
import Dashboard from './components/Dashboard/Dashboard';
import { CodeExecutionProvider } from './context/CodeExecutionContext';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Code Performance Visualizer</h1>
        <p className="App-subtitle">Analyze and visualize code execution metrics in real-time</p>
      </header>
      
      <main className="App-content">
        <CodeExecutionProvider>
          <Dashboard />
        </CodeExecutionProvider>
      </main>
      
      <footer className="App-footer">
        <p>&copy; {new Date().getFullYear()} Code Performance Visualizer</p>
      </footer>
    </div>
  );
}

export default App;