import express from 'express';
import { validate } from '../../validations/validate.middleware';
import { 
  createOutletRequestSchema,
  updateProductRequestSchema,
  updateMaterialRequestSchema,
  approveRequestsSchema
} from '../../validations/outletRequest.validation';
import { OutletRequestController } from '../../controllers/OutletRequestController';
import { OutletRequestService } from '../../../../core/services/OutletRequestService';
import { OutletProductRequestRepository } from '../../../../adapters/postgres/repositories/OutletProductRequestRepository';
import { OutletMaterialRequestRepository } from '../../../../adapters/postgres/repositories/OutletMaterialRequestRepository';
import { authMiddleware } from '../../../../policies/authMiddleware';

const router = express.Router();

// Initialize repositories
const productRequestRepo = new OutletProductRequestRepository();
const materialRequestRepo = new OutletMaterialRequestRepository();

// Initialize service
const outletRequestService = new OutletRequestService(
  productRequestRepo,
  materialRequestRepo
);

// Initialize controller
const outletRequestController = new OutletRequestController(outletRequestService);

/**
 * @route   POST /api/v1/outlet-requests
 * @desc    Create a new batch request (products and/or materials)
 * @access  Private (requires authentication to get outlet_id)
 */
router.post(
  '/',
  authMiddleware,
  validate(createOutletRequestSchema),
  outletRequestController.createBatchRequest
);

/**
 * @route   GET /api/v1/outlet-requests/:date/:outlet_id
 * @desc    Get detailed outlet requests by date and outlet
 * @access  Private
 */
router.get(
  '/:date/:outlet_id',
  authMiddleware,
  outletRequestController.getDetailedByDateAndOutlet
);

/**
 * @route   GET /api/v1/outlet-requests
 * @desc    Get all requests with pagination (admin)
 * @access  Private
 */
router.get(
  '/',
  authMiddleware,
  outletRequestController.getAllRequests
);

/**
 * @route   GET /api/v1/outlet-requests/my
 * @desc    Get requests for the authenticated user's outlet
 * @access  Private (requires authentication to get outlet_id)
 */
router.get(
  '/my',
  authMiddleware,
  outletRequestController.getMyRequests
);

/**
 * @route   PUT /api/v1/outlet-requests/products/:id
 * @desc    Update a product request (only productId and quantity)
 * @access  Private
 */
router.put(
  '/products/:id',
  authMiddleware,
  validate(updateProductRequestSchema),
  outletRequestController.updateProductRequest
);

/**
 * @route   PUT /api/v1/outlet-requests/materials/:id
 * @desc    Update a material request (only materialId and quantity)
 * @access  Private
 */
router.put(
  '/materials/:id',
  authMiddleware,
  validate(updateMaterialRequestSchema),
  outletRequestController.updateMaterialRequest
);

/**
 * @route   DELETE /api/v1/outlet-requests/:date
 * @desc    Delete all requests for a specific date (authenticated user's outlet only)
 * @access  Private (requires authentication, outlet_id from token)
 */
router.delete(
  '/:date',
  authMiddleware,
  outletRequestController.deleteByDate
);

/**
 * @route   DELETE /api/v1/outlet-requests/products/:id
 * @desc    Delete a product request (soft delete)
 * @access  Private
 */
router.delete(
  '/products/:id',
  authMiddleware,
  outletRequestController.deleteProductRequest
);

/**
 * @route   DELETE /api/v1/outlet-requests/materials/:id
 * @desc    Delete a material request (soft delete)
 * @access  Private
 */
router.delete(
  '/materials/:id',
  authMiddleware,
  outletRequestController.deleteMaterialRequest
);

/**
 * @route   PATCH /api/v1/outlet-requests/approve
 * @desc    Approve multiple requests with approval quantities
 * @access  Private (admin/manager)
 */
router.patch(
  '/approve',
  authMiddleware,
  validate(approveRequestsSchema),
  outletRequestController.approveRequests
);

/**
 * @route   PATCH /api/v1/outlet-requests/products/:id/reject
 * @desc    Reject a product request
 * @access  Private (admin/manager)
 */
router.patch(
  '/products/:id/reject',
  authMiddleware,
  outletRequestController.rejectProductRequest
);

/**
 * @route   PATCH /api/v1/outlet-requests/materials/:id/reject
 * @desc    Reject a material request
 * @access  Private (admin/manager)
 */
router.patch(
  '/materials/:id/reject',
  authMiddleware,
  outletRequestController.rejectMaterialRequest
);

export default router;
