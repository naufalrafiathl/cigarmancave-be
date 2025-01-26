"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HumidorService = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../errors");
const achievement_event_1 = require("./events/achievement.event");
const achievement_1 = require("../types/achievement");
class HumidorService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async createHumidor(dto) {
        const humidor = await this.prisma.humidor.create({
            data: {
                name: dto.name,
                description: dto.description,
                imageUrl: dto.imageUrl,
                userId: dto.userId,
            }
        });
        achievement_event_1.achievementEvents.emitAchievementEvent({
            userId: dto.userId,
            type: achievement_1.AchievementEventType.HUMIDOR_CREATED
        });
        return humidor;
    }
    async getHumidor(userId, humidorId) {
        const humidor = await this.prisma.humidor.findUnique({
            where: { id: humidorId },
            include: {
                cigars: {
                    include: {
                        cigar: true,
                    },
                },
            },
        });
        if (!humidor) {
            throw new errors_1.NotFoundException("Humidor not found");
        }
        if (humidor.userId !== userId) {
            throw new errors_1.UnauthorizedException("Not authorized to access this humidor");
        }
        return humidor;
    }
    async getUserHumidors(userId) {
        return this.prisma.humidor.findMany({
            where: { userId },
            include: {
                cigars: {
                    include: {
                        cigar: true,
                    },
                },
            },
        });
    }
    async updateHumidor(userId, humidorId, dto) {
        var _a, _b;
        console.log("userid", userId);
        console.log("humid", humidorId);
        console.log("dto", dto);
        const humidor = await this.prisma.humidor.findUnique({
            where: { id: humidorId },
        });
        if (!humidor) {
            throw new errors_1.NotFoundException("Humidor not found");
        }
        if (humidor.userId !== userId) {
            throw new errors_1.UnauthorizedException("Not authorized to update this humidor");
        }
        return this.prisma.humidor.update({
            where: { id: humidorId },
            data: {
                name: (_a = dto.name) !== null && _a !== void 0 ? _a : undefined,
                description: (_b = dto.description) !== null && _b !== void 0 ? _b : undefined,
            },
        });
    }
    async deleteHumidor(userId, humidorId) {
        const humidor = await this.prisma.humidor.findUnique({
            where: { id: humidorId },
        });
        if (!humidor) {
            throw new errors_1.NotFoundException("Humidor not found");
        }
        if (humidor.userId !== userId) {
            throw new errors_1.UnauthorizedException("Not authorized to delete this humidor");
        }
        await this.prisma.humidor.delete({
            where: { id: humidorId },
        });
    }
    async addCigarToHumidor(userId, humidorId, dto) {
        var _a;
        try {
            const humidor = await this.prisma.humidor.findUnique({
                where: { id: humidorId },
                include: {
                    cigars: {
                        include: {
                            cigar: true,
                        },
                    },
                },
            });
            if (!humidor) {
                throw new errors_1.NotFoundException("Humidor not found");
            }
            if (humidor.userId !== userId) {
                throw new errors_1.UnauthorizedException("Not authorized to add cigars to this humidor");
            }
            const data = {
                humidorId,
                cigarId: dto.cigarId,
                quantity: dto.quantity,
                purchasePrice: (_a = dto.purchasePrice) !== null && _a !== void 0 ? _a : 0.0,
                purchaseDate: dto.purchaseDate
                    ? new Date(dto.purchaseDate)
                    : new Date(),
            };
            if (dto.purchaseLocation) {
                data.purchaseLocation = dto.purchaseLocation;
            }
            if (dto.notes) {
                data.notes = dto.notes;
            }
            if (dto.imageUrl) {
                data.imageUrl = dto.imageUrl;
            }
            console.log("Final data to be inserted:", data);
            return this.prisma.humidorCigar.create({
                data,
                include: {
                    cigar: true,
                },
            });
        }
        catch (error) {
            console.error("Error in addCigarToHumidor:", error);
            throw error;
        }
    }
    async updateHumidorCigar(userId, humidorId, humidorCigarId, dto) {
        const humidor = await this.prisma.humidor.findUnique({
            where: { id: humidorId },
        });
        if (!humidor) {
            throw new errors_1.NotFoundException("Humidor not found");
        }
        if (humidor.userId !== userId) {
            throw new errors_1.UnauthorizedException("Not authorized to update cigars in this humidor");
        }
        const existingHumidorCigar = await this.prisma.humidorCigar.findFirst({
            where: {
                AND: [{ id: humidorCigarId }, { humidorId: humidorId }],
            },
        });
        if (!existingHumidorCigar) {
            throw new errors_1.NotFoundException("Cigar not found in this humidor");
        }
        const updateData = {};
        if (typeof dto.quantity !== "undefined") {
            updateData.quantity = dto.quantity;
        }
        if (typeof dto.purchasePrice !== "undefined") {
            updateData.purchasePrice = dto.purchasePrice;
        }
        if (dto.purchaseDate) {
            updateData.purchaseDate = new Date(dto.purchaseDate);
        }
        if (typeof dto.purchaseLocation !== "undefined") {
            updateData.purchaseLocation = dto.purchaseLocation;
        }
        if (typeof dto.notes !== "undefined") {
            updateData.notes = dto.notes;
        }
        if (typeof dto.imageUrl !== "undefined") {
            updateData.imageUrl = dto.imageUrl;
        }
        return this.prisma.humidorCigar.update({
            where: { id: humidorCigarId },
            data: updateData,
            include: {
                cigar: true,
            },
        });
    }
    async removeCigarFromHumidor(userId, humidorId, humidorCigarId) {
        const humidor = await this.prisma.humidor.findUnique({
            where: { id: humidorId },
        });
        if (!humidor) {
            throw new errors_1.NotFoundException("Humidor not found");
        }
        if (humidor.userId !== userId) {
            throw new errors_1.UnauthorizedException("Not authorized to access this humidor");
        }
        const humidorCigar = await this.prisma.humidorCigar.findFirst({
            where: {
                AND: [{ id: humidorCigarId }, { humidorId: humidorId }],
            },
        });
        if (!humidorCigar) {
            throw new errors_1.NotFoundException("Cigar not found in this humidor");
        }
        await this.prisma.humidorCigar.delete({
            where: { id: humidorCigarId },
        });
    }
}
exports.HumidorService = HumidorService;
//# sourceMappingURL=humidor.service.js.map