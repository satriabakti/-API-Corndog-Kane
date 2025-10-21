
import express from 'express';
import { UserController } from '../../controllers';
import { validate } from '../../validations/validate.middleware';
import {
  createUserSchema,
  updateUserSchema,
  getUserByIdSchema,
  deleteUserSchema,
  getUsersSchema
} from '../../validations/user.validation';

const router = express.Router();

const userController = new UserController();


router.get('/', validate(getUsersSchema), userController.findAll);
router.get('/:id', validate(getUserByIdSchema), userController.findById);
router.post('/', validate(createUserSchema), userController.create);
router.put('/:id', validate(updateUserSchema), userController.update);
router.delete('/:id', validate(deleteUserSchema), userController.delete);

export default router;