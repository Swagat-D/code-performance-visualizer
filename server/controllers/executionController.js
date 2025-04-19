const codeExecutionService = require('../services/codeExecutionService');
const metricsService = require('../services/metricsService');
const { v4: uuidv4 } = require('uuid');

// Controller for code execution endpoints
const executionController = {
  /**
   * Execute code and return performance metrics
   */
  executeCode: async (req, res) => {
    try {
      const { code, language, input, options } = req.body;
      
      // Generate a unique execution ID
      const executionId = uuidv4();
      
      // We'll handle execution through socket.io for real-time updates
      // But we'll start the process and return the executionId immediately
      
      // Start execution in the background
      setTimeout(() => {
        codeExecutionService.executeCode(null, null, {
          code,
          language,
          input,
          options,
          executionId
        });
      }, 0);
      
      // Return the execution ID that the client can use to track progress
      return res.status(200).json({
        status: 'success',
        message: 'Code execution started',
        executionId
      });
    } catch (error) {
      console.error('Error in executeCode:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  },
  
  /**
   * Get list of supported programming languages
   */
  getSupportedLanguages: (req, res) => {
    try {
      const languages = [
        { id: 'javascript', name: 'JavaScript', version: 'ES2021' },
        { id: 'python', name: 'Python', version: '3.9' },
        // Add more languages as they are implemented
      ];
      
      return res.status(200).json({
        status: 'success',
        data: languages
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  },
  
  /**
   * Get execution history (if implementing storage)
   */
  getExecutionHistory: (req, res) => {
    try {
      // This would connect to a database or cache to retrieve history
      const history = []; // Placeholder
      
      return res.status(200).json({
        status: 'success',
        data: history
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  },
  
  /**
   * Compare two code executions
   */
  compareExecutions: async (req, res) => {
    try {
      const { code1, code2, language, input, options } = req.body;
      
      // Execute both code samples and collect metrics
      const metrics1 = await codeExecutionService.executeForComparison(code1, language, input, options);
      const metrics2 = await codeExecutionService.executeForComparison(code2, language, input, options);
      
      // Compare the metrics
      const comparison = metricsService.compareMetrics(metrics1, metrics2);
      
      return res.status(200).json({
        status: 'success',
        data: {
          metrics1,
          metrics2,
          comparison
        }
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }
};

module.exports = executionController;