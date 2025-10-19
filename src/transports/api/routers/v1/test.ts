import express from 'express';
import { TestController } from '../../controllers/TestController';
import { authMiddleware, roleMiddleware, adminOnly } from '../../../../policies';

const router = express.Router();
const testController = new TestController();

// Basic auth test - any authenticated user
router.get('/authtest', authMiddleware, testController.authTest);

// Role-specific test - only admin can access
router.get('/authtest/admin', authMiddleware, adminOnly, testController.authTest);

// Role-specific test - admin or manager can access
router.get('/authtest/roles', authMiddleware, roleMiddleware(['admin', 'manager']), testController.authTest);

export default router;
