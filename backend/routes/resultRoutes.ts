import { Router } from 'express';
import { getCognitiveProfile, updateCognitiveProfile, getProgress } from '../controllers/resultController';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

router.get('/profile/:userId', authMiddleware, getCognitiveProfile);
router.post('/profile/update', authMiddleware, updateCognitiveProfile);
router.get('/progress/:userId', authMiddleware, getProgress);

export default router;
