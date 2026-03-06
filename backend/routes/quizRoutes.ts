import { Router } from 'express';
import { submitQuiz, getUserResults, getActivities } from '../controllers/quizController';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

router.post('/submit', authMiddleware, submitQuiz);
router.get('/results/:userId', authMiddleware, getUserResults);
router.get('/activities', authMiddleware, getActivities);

export default router;
