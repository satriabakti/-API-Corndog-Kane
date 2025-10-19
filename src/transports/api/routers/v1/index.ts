
import express from 'express';
import authRouter from './auth';
import testRouter from './test';
const router = express.Router();

// router.get;
router.use("/auth", authRouter);
router.use("/", testRouter);

export default router;