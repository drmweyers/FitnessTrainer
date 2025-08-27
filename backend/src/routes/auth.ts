import { Router } from 'express';
import { authRateLimit, passwordResetRateLimit, registrationRateLimit } from '@/config/rateLimit';
import { validateBody } from '@/middleware/validation';
import { authenticate, optionalAuth } from '@/middleware/auth';
import * as authController from '@/controllers/authController';
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema,
  logoutSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema
} from '@/types/auth';

const router = Router();

// Public routes (no authentication required)
router.post('/register', 
  registrationRateLimit,
  validateBody(registerSchema),
  authController.register
);

router.post('/login', 
  authRateLimit,
  validateBody(loginSchema),
  authController.login
);

router.post('/refresh',
  validateBody(refreshTokenSchema),
  authController.refreshToken
);

router.post('/forgot-password', 
  passwordResetRateLimit,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

router.post('/reset-password',
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

router.post('/verify-email',
  validateBody(verifyEmailSchema),
  authController.verifyEmail
);

router.post('/resend-verification', 
  authRateLimit,
  validateBody(resendVerificationSchema),
  authController.resendVerification
);

// OAuth routes
router.post('/oauth/google', (req, res) => {
  res.json({ message: 'Google OAuth endpoint - TODO: implement' });
});

router.post('/oauth/apple', (req, res) => {
  res.json({ message: 'Apple OAuth endpoint - TODO: implement' });
});

// Protected routes (authentication required)
router.get('/me', 
  authenticate,
  authController.getCurrentUser
);

router.post('/logout',
  optionalAuth,
  validateBody(logoutSchema),
  authController.logout
);

router.put('/change-password', 
  authenticate,
  authRateLimit,
  validateBody(changePasswordSchema),
  authController.changePassword
);

router.get('/sessions',
  authenticate,
  authController.getSessions
);

router.delete('/sessions/:sessionId',
  authenticate,
  authController.revokeSession
);

// Two-factor authentication
router.post('/2fa/setup', (req, res) => {
  res.json({ message: '2FA setup endpoint - TODO: implement' });
});

router.post('/2fa/verify', (req, res) => {
  res.json({ message: '2FA verify endpoint - TODO: implement' });
});

router.post('/2fa/disable', (req, res) => {
  res.json({ message: '2FA disable endpoint - TODO: implement' });
});

// Security logs
router.get('/security-logs',
  authenticate,
  authController.getSecurityLogs
);

export default router;