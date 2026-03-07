import { Router } from 'express';
import { submitQuiz, getUserResults, getActivities } from '../controllers/quizController';
import { generateQuestions } from '../controllers/questionGenerator';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

router.post('/submit', authMiddleware, submitQuiz);
router.get('/results/:userId', authMiddleware, getUserResults);
router.get('/activities', authMiddleware, getActivities);
router.get('/generate/:quizType', authMiddleware, generateQuestions);

export default router;
