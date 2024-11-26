import { Router } from 'express';
import { HumidorController } from '../controllers/humidor.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { CreateHumidorSchema, UpdateHumidorSchema, AddCigarToHumidorSchema } from '../schemas/humidor.schema';

const router = Router();
const humidorController = new HumidorController();

router.use(authenticate);

router.post(
  '/',
  validateRequest(CreateHumidorSchema),
  humidorController.createHumidor
);

router.get(
  '/',
  humidorController.getUserHumidors
);

router.get(
  '/:humidorId',
  humidorController.getHumidor
);

router.put(
  '/:humidorId',
  validateRequest(UpdateHumidorSchema),
  humidorController.updateHumidor
);

router.delete(
  '/:humidorId',
  humidorController.deleteHumidor
);

router.post(
  '/:humidorId/cigars',
  validateRequest(AddCigarToHumidorSchema),
  humidorController.addCigarToHumidor
);

router.delete(
  '/:humidorId/cigars/:humidorCigarId',
  humidorController.removeCigarFromHumidor
);

export default router;