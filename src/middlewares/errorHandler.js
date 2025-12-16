export class AppError extends Error {
  constructor(message, statusCode = 500, originalError = null) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true
    this.originalError = originalError
    
    Error.captureStackTrace(this, this.constructor)
  }
}

export const handleError = (err, req, res, next) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Erreur interne du serveur'
  
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    originalError: err.originalError,
    path: req.path,
    method: req.method
  })
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}