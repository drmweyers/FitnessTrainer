import { Router } from 'express';
import { authRateLimit, passwordResetRateLimit, registrationRateLimit } from '@/config/rateLimit';
import { validateBody } from '@/middleware/validation';
import { authenticate, optionalAuth } from '@/middleware/auth';
import * as authController from '@/controllers/authController';
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema,
  logoutSchema
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

router.post('/forgot-password', passwordResetRateLimit, (req, res) => {
  res.json({ message: 'Forgot password endpoint - TODO: implement' });
});

router.post('/reset-password', (req, res) => {
  res.json({ message: 'Reset password endpoint - TODO: implement' });
});

router.post('/verify-email', (req, res) => {
  res.json({ message: 'Email verification endpoint - TODO: implement' });
});

router.post('/resend-verification', authRateLimit, (req, res) => {
  res.json({ message: 'Resend verification endpoint - TODO: implement' });
});

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

router.put('/change-password', authRateLimit, (req, res) => {
  res.json({ message: 'Change password endpoint - TODO: implement' });
});

router.get('/sessions', (req, res) => {
  res.json({ message: 'Get user sessions endpoint - TODO: implement' });
});

router.delete('/sessions/:sessionId', (req, res) => {
  res.json({ message: 'Delete session endpoint - TODO: implement' });
});

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
router.get('/security-logs', (req, res) => {
  res.json({ message: 'Security logs endpoint - TODO: implement' });
});

export default router;