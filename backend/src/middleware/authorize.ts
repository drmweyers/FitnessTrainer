import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

/**
 * Authorization middleware to check user roles
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Get user role - handle both uppercase and lowercase
      const userRole = req.user.role?.toUpperCase();

      // Check if user has required role
      const hasPermission = allowedRoles.some(role => 
        userRole === role.toUpperCase()
      );

      if (!hasPermission) {
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          error: {
            code: error.statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
            details: 'You do not have permission to access this resource'
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Authorization error',
          error: {
            code: 'AUTH_ERROR',
            details: 'An error occurred during authorization'
          }
        });
      }
    }
  };
};

export default authorize;