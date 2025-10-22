
import express from 'express';
import authRouter from './auth';
import testRouter from './test';
import userRouter from './user'
import roleRouter from './role';
const router = express.Router();

// router.get;
router.use("/auth", authRouter);
router.use("/", testRouter);
router.use('/users', userRouter);
router.use('/roles', roleRouter);

export default router;