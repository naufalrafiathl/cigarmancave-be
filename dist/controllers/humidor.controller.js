"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HumidorController = void 0;
const humidor_service_1 = require("../services/humidor.service");
class HumidorController {
    constructor() {
        this.createHumidor = (req, res, next) => {
            const dto = req.body;
            this.humidorService
                .createHumidor(dto)
                .then((humidor) => {
                res.status(201).json(humidor);
            })
                .catch(next);
        };
        this.getHumidor = (req, res, next) => {
            const userId = req.user.id;
            const humidorId = parseInt(req.params.humidorId);
            this.humidorService
                .getHumidor(userId, humidorId)
                .then((humidor) => {
                res.json(humidor);
            })
                .catch(next);
        };
        this.getUserHumidors = (req, res, next) => {
            const userId = req.user.id;
            console.log("id user", req.user);
            this.humidorService
                .getUserHumidors(userId)
                .then((humidors) => {
                res.json(humidors);
            })
                .catch(next);
        };
        this.updateHumidor = (req, res, next) => {
            const userId = req.user.id;
            const humidorId = parseInt(req.params.humidorId);
            const dto = req.body;
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
        this.deleteHumidor = (req, res, next) => {
            const userId = req.user.id;
            const humidorId = parseInt(req.params.humidorId);
            this.humidorService
                .deleteHumidor(userId, humidorId)
                .then(() => {
                res.status(204).send();
            })
                .catch(next);
        };
        this.addCigarToHumidor = (req, res, next) => {
            const userId = req.user.id;
            const humidorId = parseInt(req.params.humidorId);
            const dto = req.body;
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
        this.updateCigarInHumidor = (req, res, next) => {
            const userId = req.user.id;
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
        this.removeCigarFromHumidor = (req, res, next) => {
            const userId = req.user.id;
            const humidorId = parseInt(req.params.humidorId);
            const humidorCigarId = parseInt(req.params.humidorCigarId);
            this.humidorService
                .removeCigarFromHumidor(userId, humidorId, humidorCigarId)
                .then(() => {
                res.status(204).send();
            })
                .catch(next);
        };
        this.humidorService = new humidor_service_1.HumidorService();
    }
}
exports.HumidorController = HumidorController;
//# sourceMappingURL=humidor.controller.js.map