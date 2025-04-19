const express = require('express');
const router = express.Router();
const executionController = require('../controllers/executionController');
const { validateCodeInput } = require('../middlewares/validation');

// Routes for code execution
router.post('/execute', validateCodeInput, executionController.executeCode);

// Route for getting supported languages
router.get('/languages', executionController.getSupportedLanguages);

// Route for getting code execution history (if implementing)
router.get('/history', executionController.getExecutionHistory);

// Route for comparing two code executions
router.post('/compare', validateCodeInput, executionController.compareExecutions);

module.exports = router;