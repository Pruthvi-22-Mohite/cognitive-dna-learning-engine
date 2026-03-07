import { Router } from 'express';
import { submitCognitiveResults, getCognitiveProfile } from '../controllers/cognitiveController';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

// Submit cognitive test results and generate brain map
router.post('/submit-results', authMiddleware, submitCognitiveResults);

// Get cognitive profile for a student
router.get('/profile/:userId', authMiddleware, getCognitiveProfile);

export default router;
