// src/controllers/humidor.controller.ts
import { Request, Response, NextFunction } from 'express';
import { HumidorService } from '../services/humidor.service';
import { CreateHumidorDto, UpdateHumidorDto, AddCigarToHumidorDto } from '../dtos/humidor.dto';

export class HumidorController {
  private humidorService: HumidorService;

  constructor() {
    this.humidorService = new HumidorService();
  }

  createHumidor = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const dto: CreateHumidorDto = req.body;
    
    this.humidorService.createHumidor(userId, dto)
      .then(humidor => {
        res.status(201).json(humidor);
      })
      .catch(next);
  };

  getHumidor = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const humidorId = parseInt(req.params.humidorId);
    
    this.humidorService.getHumidor(userId, humidorId)
      .then(humidor => {
        res.json(humidor);
      })
      .catch(next);
  };

  getUserHumidors = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    
    this.humidorService.getUserHumidors(userId)
      .then(humidors => {
        res.json(humidors);
      })
      .catch(next);
  };

  updateHumidor = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const humidorId = parseInt(req.params.humidorId);
    const dto: UpdateHumidorDto = req.body;
    
    this.humidorService.updateHumidor(userId, humidorId, dto)
      .then(humidor => {
        res.json(humidor);
      })
      .catch(next);
  };

  deleteHumidor = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const humidorId = parseInt(req.params.humidorId);
    
    this.humidorService.deleteHumidor(userId, humidorId)
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  };

  addCigarToHumidor = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const humidorId = parseInt(req.params.humidorId);
    const dto: AddCigarToHumidorDto = req.body;
    
    this.humidorService.addCigarToHumidor(userId, humidorId, dto)
      .then(humidorCigar => {
        res.status(201).json(humidorCigar);
      })
      .catch(next);
  };

  removeCigarFromHumidor = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const humidorId = parseInt(req.params.humidorId);
    const humidorCigarId = parseInt(req.params.humidorCigarId);
    
    this.humidorService.removeCigarFromHumidor(userId, humidorId, humidorCigarId)
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  };
}