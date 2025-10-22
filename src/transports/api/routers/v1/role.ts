
import express from 'express';
import { RoleController } from '../../controllers';
import { validate } from '../../validations/validate.middleware';
import { getRolesSchema,createRoleSchema,updateRoleSchema,deleteRoleSchema } from '../../validations/role.validation';
import RoleService from '../../../../core/services/RoleService';
import RoleRepository from '../../../../adapters/postgres/repositories/RoleRepository';
import { RoleResponseMapper } from '../../../../mappers/response-mappers';

const router = express.Router();

const roleController = new RoleController();
const roleService = new RoleService(new RoleRepository());

router.get("/", validate(getRolesSchema), roleController.findAll(roleService, RoleResponseMapper));
router.post('/', validate(createRoleSchema), roleController.create(roleService, RoleResponseMapper, 'Role created successfully'));
router.put('/:id', validate(updateRoleSchema), roleController.update(roleService, RoleResponseMapper, 'Role updated successfully'));
router.delete('/:id', validate(deleteRoleSchema), roleController.delete(roleService, 'Role deleted successfully'));

export default router;