import axios from 'axios';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Execute code and get results
 */
export const executeCode = async (code, language, input = '', options = {}) => {
  try {
    const response = await axios.post(`${API_URL}/execute`, {
      code,
      language,
      input,
      options
    });
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Error executing code');
    }
    throw new Error(error.message || 'Error connecting to server');
  }
};

/**
 * Get list of supported programming languages
 */
export const getSupportedLanguages = async () => {
  try {
    const response = await axios.get(`${API_URL}/languages`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching languages:', error);
    return [
      { id: 'javascript', name: 'JavaScript', version: 'ES2021' },
      { id: 'python', name: 'Python', version: '3.9' }
    ];
  }
};

/**
 * Compare two code executions
 */
export const compareExecutions = async (code1, code2, language, input = '', options = {}) => {
  try {
    const response = await axios.post(`${API_URL}/compare`, {
      code1,
      code2,
      language,
      input,
      options
    });
    
    return response.data.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Error comparing code executions');
    }
    throw new Error(error.message || 'Error connecting to server');
  }
};