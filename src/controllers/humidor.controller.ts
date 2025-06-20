import { Request, Response, NextFunction } from "express";
import { HumidorService } from "../services/humidor.service";
import {
  CreateHumidorDto,
  UpdateHumidorDto,
  AddCigarToHumidorDto,
} from "../dtos/humidor.dto";

export class HumidorController {
  private humidorService: HumidorService;

  constructor() {
    this.humidorService = new HumidorService();
  }

  createHumidor = (req: Request, res: Response, next: NextFunction) => {
    const dto: CreateHumidorDto = req.body;

    this.humidorService
      .createHumidor(dto)
      .then((humidor) => {
        res.status(201).json(humidor);
      })
      .catch(next);
  };

  getHumidor = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const humidorId = parseInt(req.params.humidorId);

    this.humidorService
      .getHumidor(userId, humidorId)
      .then((humidor) => {
        res.json(humidor);
      })
      .catch(next);
  };

  getUserHumidors = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    console.log("id user", req.user);

    this.humidorService
      .getUserHumidors(userId)
      .then((humidors) => {
        res.json(humidors);
      })
      .catch(next);
  };

  updateHumidor = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const humidorId = parseInt(req.params.humidorId);
    const dto: UpdateHumidorDto = req.body;

    console.log("update userid", req.user);
    console.log("humidorid", parseInt(req.params.humidorId));
    console.log("dro", dto);

    this.humidorService
      .updateHumidor(userId, humidorId, dto)
      .then((humidor) => {
        res.json(humidor);
      })
      .catch(next);
  };

  deleteHumidor = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const humidorId = parseInt(req.params.humidorId);

    this.humidorService
      .deleteHumidor(userId, humidorId)
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  };

  addCigarToHumidor = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const humidorId = parseInt(req.params.humidorId);
    const dto: AddCigarToHumidorDto = req.body;

    console.log("Received request:", {
      userId,
      humidorId,
      dto,
    });

    this.humidorService
      .addCigarToHumidor(userId, humidorId, dto)
      .then((humidorCigar) => {
        res.status(201).json(humidorCigar);
      })
      .catch((error) => {
        console.error("Error adding cigar to humidor:", {
          error: error.message,
          stack: error.stack,
          userId,
          humidorId,
          dto,
        });
        next(error);
      });
  };

  updateCigarInHumidor = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const humidorId = parseInt(req.params.humidorId);
    const humidorCigarId = parseInt(req.params.humidorCigarId);
    const dto = req.body;
  
    console.log("Received update request:", {
      userId,
      humidorId,
      humidorCigarId,
      dto,
    });
  
    this.humidorService
      .updateHumidorCigar(userId, humidorId, humidorCigarId, dto)
      .then((updatedHumidorCigar) => {
        res.json({
          status: 'success',
          data: updatedHumidorCigar
        });
      })
      .catch((error) => {
        console.error("Error updating cigar in humidor:", {
          error: error.message,
          stack: error.stack,
          userId,
          humidorId,
          humidorCigarId,
          dto,
        });
        next(error);
      });
  };
  

  removeCigarFromHumidor = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.user!.id;
    const humidorId = parseInt(req.params.humidorId);
    const humidorCigarId = parseInt(req.params.humidorCigarId);

    this.humidorService
      .removeCigarFromHumidor(userId, humidorId, humidorCigarId)
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  };
}
