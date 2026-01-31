import {Router} from 'express';

import { createTaskHandler, getTaskHandler } from './task.controller';
import { rateLimiter } from '../../middlewares/rateLimiter';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();

router.post('/',authMiddleware,rateLimiter,createTaskHandler);
router.get('/:id',getTaskHandler);

export default router;