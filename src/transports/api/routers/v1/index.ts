
import express from 'express';
import authRouter from './auth';
import testRouter from './test';
import userRouter from './user'
import roleRouter from './role';
import outletRouter from './outlet';
import employeeRouter from './employee';
import categoryRouter from './category';
import productRouter from './product';
import masterProductRouter from './masterProduct';
import supplierRouter from './supplier';
import materialRouter from './material';
import inventoryRouter from './inventory';
import outletRequestRouter from './outletRequest';
import orderRouter from './order';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Corndog Kane API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

router.use("/auth", authRouter);
router.use("/", testRouter);
router.use('/users', userRouter);
router.use('/roles', roleRouter);
router.use('/outlets', outletRouter );
router.use('/employees', employeeRouter);
router.use('/categories', categoryRouter);
router.use('/products', productRouter);
router.use('/master-products', masterProductRouter);
router.use('/suppliers', supplierRouter);
router.use('/materials', materialRouter);
router.use('/inventory', inventoryRouter);
router.use('/outlet-requests', outletRequestRouter);
router.use('/orders', orderRouter);

export default router;