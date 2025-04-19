/**
 * Security middleware for the API
 */

// Set up security headers and protections
const setupSecurityMiddleware = (app) => {
  // Set security headers
  app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Help protect against XSS attacks
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enforce HTTPS
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    // Content Security Policy
    // Adjust this based on your application's needs
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'"
    ].join('; ');
    
    res.setHeader('Content-Security-Policy', cspDirectives);
    
    next();
  });
  
  // Rate limiting (basic implementation - in production, use a more robust solution)
  const requestCounts = {};
  const WINDOW_MS = 60 * 1000; // 1 minute
  const MAX_REQUESTS = 60; // 60 requests per minute
  
  app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    // Initialize or clean up old data
    if (!requestCounts[ip]) {
      requestCounts[ip] = {
        count: 0,
        resetTime: Date.now() + WINDOW_MS
      };
    } else if (requestCounts[ip].resetTime <= Date.now()) {
      requestCounts[ip] = {
        count: 0,
        resetTime: Date.now() + WINDOW_MS
      };
    }
    
    // Increment counter
    requestCounts[ip].count++;
    
    // Check if limit is exceeded
    if (requestCounts[ip].count > MAX_REQUESTS) {
      return res.status(429).json({
        status: 'error',
        message: 'Too many requests, please try again later.'
      });
    }
    
    next();
  });
  
  // Request timeout
  app.use((req, res, next) => {
    // Set a timeout for all requests (30 seconds)
    req.setTimeout(30000, () => {
      res.status(408).json({
        status: 'error',
        message: 'Request timeout'
      });
    });
    
    next();
  });
};

module.exports = { setupSecurityMiddleware };