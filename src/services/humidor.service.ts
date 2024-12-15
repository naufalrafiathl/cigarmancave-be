// src/services/humidor.service.ts
import { PrismaClient, Humidor, HumidorCigar } from "@prisma/client";
import {
  CreateHumidorDto,
  UpdateHumidorDto,
  AddCigarToHumidorDto,
} from "../dtos/humidor.dto";
import { NotFoundException, UnauthorizedException } from "../errors";

export class HumidorService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createHumidor(dto: CreateHumidorDto): Promise<Humidor> {
    return this.prisma.humidor.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        userId: dto.userId,
      },
    });
  }

  async getHumidor(
    userId: number,
    humidorId: number
  ): Promise<Humidor & { cigars: HumidorCigar[] }> {
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
      throw new NotFoundException("Humidor not found");
    }

    if (humidor.userId !== userId) {
      throw new UnauthorizedException("Not authorized to access this humidor");
    }

    return humidor;
  }

  async getUserHumidors(userId: number): Promise<Humidor[]> {
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

  async updateHumidor(
    userId: number,
    humidorId: number,
    dto: UpdateHumidorDto
  ): Promise<Humidor> {
    console.log("userid", userId);
    console.log("humid", humidorId);
    console.log("dto", dto);

    const humidor = await this.prisma.humidor.findUnique({
      where: { id: humidorId },
    });

    if (!humidor) {
      throw new NotFoundException("Humidor not found");
    }

    if (humidor.userId !== userId) {
      throw new UnauthorizedException("Not authorized to update this humidor");
    }

    return this.prisma.humidor.update({
      where: { id: humidorId },
      data: {
        name: dto.name ?? undefined,
        description: dto.description ?? undefined,
      },
    });
  }

  async deleteHumidor(userId: number, humidorId: number): Promise<void> {
    const humidor = await this.prisma.humidor.findUnique({
      where: { id: humidorId },
    });

    if (!humidor) {
      throw new NotFoundException("Humidor not found");
    }

    if (humidor.userId !== userId) {
      throw new UnauthorizedException("Not authorized to delete this humidor");
    }

    await this.prisma.humidor.delete({
      where: { id: humidorId },
    });
  }

  async addCigarToHumidor(
    userId: number,
    humidorId: number,
    dto: AddCigarToHumidorDto
  ): Promise<HumidorCigar> {
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
        throw new NotFoundException("Humidor not found");
      }

      if (humidor.userId !== userId) {
        throw new UnauthorizedException(
          "Not authorized to add cigars to this humidor"
        );
      }

      const data: {
        humidorId: number;
        cigarId: number;
        quantity: number;
        purchasePrice: number;
        purchaseDate: Date;
        purchaseLocation?: string;
        notes?: string;
      } = {
        humidorId,
        cigarId: dto.cigarId,
        quantity: dto.quantity,
        purchasePrice: dto.purchasePrice ?? 0.0,
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

      console.log("Final data to be inserted:", data);

      return this.prisma.humidorCigar.create({
        data,
        include: {
          cigar: true,
        },
      });
    } catch (error) {
      console.error("Error in addCigarToHumidor:", error);
      throw error;
    }
  }

  async removeCigarFromHumidor(
    userId: number,
    humidorId: number,
    humidorCigarId: number
  ): Promise<void> {
    const humidor = await this.prisma.humidor.findUnique({
      where: { id: humidorId },
    });

    if (!humidor) {
      throw new NotFoundException("Humidor not found");
    }

    if (humidor.userId !== userId) {
      throw new UnauthorizedException("Not authorized to access this humidor");
    }

    const humidorCigar = await this.prisma.humidorCigar.findFirst({
      where: {
        AND: [{ id: humidorCigarId }, { humidorId: humidorId }],
      },
    });

    if (!humidorCigar) {
      throw new NotFoundException("Cigar not found in this humidor");
    }

    await this.prisma.humidorCigar.delete({
      where: { id: humidorCigarId },
    });
  }
}
