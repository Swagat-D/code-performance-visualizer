// Validate code execution input
const validateCodeInput = (req, res, next) => {
  const { code, language } = req.body;
  
  // Check if code is provided
  if (!code || typeof code !== 'string' || code.trim() === '') {
    return res.status(400).json({
      status: 'error',
      message: 'Code is required and must be a non-empty string'
    });
  }
  
  // Check if language is provided
  if (!language || typeof language !== 'string' || language.trim() === '') {
    return res.status(400).json({
      status: 'error',
      message: 'Language is required and must be a non-empty string'
    });
  }
  
  // Check if code size is within limits
  const MAX_CODE_SIZE = 100 * 1024; // 100 KB
  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_SIZE) {
    return res.status(400).json({
      status: 'error',
      message: 'Code size exceeds the maximum limit of 100 KB'
    });
  }
  
  // Validate language is supported
  const supportedLanguages = ['javascript', 'python']; // Add more as implemented
  if (!supportedLanguages.includes(language)) {
    return res.status(400).json({
      status: 'error',
      message: `Language '${language}' is not supported. Supported languages: ${supportedLanguages.join(', ')}`
    });
  }
  
  // Check for potentially harmful code patterns
  const isCodeSafe = validateCodeSafety(code, language);
  if (!isCodeSafe.safe) {
    return res.status(403).json({
      status: 'error',
      message: `Potentially unsafe code detected: ${isCodeSafe.reason}`
    });
  }
  
  // If everything is valid, proceed
  next();
};

/**
 * Validate that code doesn't contain potentially harmful patterns
 */
const validateCodeSafety = (code, language) => {
  // Define dangerous patterns for each language
  const dangerousPatterns = {
    javascript: [
      // System access
      { pattern: /(\W|^)process\s*\.\s*(exit|env)/i, reason: 'Attempt to access system process' },
      { pattern: /require\s*\(\s*['"](fs|child_process|http|net|os|cluster|dns|crypto|vm|path)['"]/i, reason: 'Attempt to import restricted modules' },
      { pattern: /\beval\s*\(/i, reason: 'Use of eval() is restricted' },
      { pattern: /new\s+Function\s*\(/i, reason: 'Dynamic function creation is restricted' },
      // Infinite loops
      { pattern: /for\s*\(\s*;?\s*;\s*\)/i, reason: 'Potentially infinite loop detected' },
      { pattern: /while\s*\(\s*true\s*\)/i, reason: 'Potentially infinite loop detected' }
    ],
    python: [
      // System access
      { pattern: /(__import__|importlib|exec\s*\(|eval\s*\(|subprocess|os\.|sys\.)/i, reason: 'Attempt to access system modules or functions' },
      { pattern: /open\s*\(/i, reason: 'File system access is restricted' },
      // Infinite loops
      { pattern: /while\s+True:/i, reason: 'Potentially infinite loop detected' },
      { pattern: /for\s+.*\s+in\s+range\s*\(\s*[0-9]+\s*,\s*[0-9]+\s*,\s*0\s*\)/i, reason: 'Potentially infinite loop detected' }
    ]
  };
  
  // Check for dangerous patterns in the provided language
  if (dangerousPatterns[language]) {
    for (const { pattern, reason } of dangerousPatterns[language]) {
      if (pattern.test(code)) {
        return { safe: false, reason };
      }
    }
  }
  
  // Check for common injection attacks across languages
  const commonInjectionPatterns = [
    // SQL injection
    { pattern: /['"].*(\s|;)\s*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\s+/i, reason: 'Potential SQL injection detected' },
    // Command injection
    { pattern: /\$\(.*\)|`.*`|spawn\s*\(|exec\s*\(/i, reason: 'Potential command injection detected' }
  ];
  
  for (const { pattern, reason } of commonInjectionPatterns) {
    if (pattern.test(code)) {
      return { safe: false, reason };
    }
  }
  
  return { safe: true };
};

module.exports = {
  validateCodeInput
};