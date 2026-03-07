import { Router } from 'express';
import { submitTest, getDashboardData, getRecentActivity } from '../controllers/dashboardController';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

// Submit test result
router.post('/submit', authMiddleware, submitTest);

// Get dashboard data for a student
router.get('/:studentId', authMiddleware, getDashboardData);

// Get recent activity results
router.get('/activity/:studentId', authMiddleware, getRecentActivity);

export default router;
