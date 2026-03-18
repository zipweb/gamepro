import express from 'express';
import * as controller from './controller.js';

const router = express.Router();

// LOGIN
router.post('/login', controller.login);

// REGISTER
router.post('/register', controller.register);

export default router;
