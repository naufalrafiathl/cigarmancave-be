// src/services/humidor.service.ts
import { PrismaClient, Humidor, HumidorCigar } from '@prisma/client';
import { CreateHumidorDto, UpdateHumidorDto, AddCigarToHumidorDto } from '../dtos/humidor.dto';
import { NotFoundException, UnauthorizedException } from '../errors';

export class HumidorService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createHumidor(userId: number, dto: CreateHumidorDto): Promise<Humidor> {
    return this.prisma.humidor.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        userId: userId
      }
    });
  }

  async getHumidor(userId: number, humidorId: number): Promise<Humidor & { cigars: HumidorCigar[] }> {
    const humidor = await this.prisma.humidor.findUnique({
      where: { id: humidorId },
      include: {
        cigars: {
          include: {
            cigar: true
          }
        }
      }
    });

    if (!humidor) {
      throw new NotFoundException('Humidor not found');
    }

    if (humidor.userId !== userId) {
      throw new UnauthorizedException('Not authorized to access this humidor');
    }

    return humidor;
  }

  async getUserHumidors(userId: number): Promise<Humidor[]> {
    return this.prisma.humidor.findMany({
      where: { userId },
      include: {
        cigars: {
          include: {
            cigar: true
          }
        }
      }
    });
  }

  async updateHumidor(userId: number, humidorId: number, dto: UpdateHumidorDto): Promise<Humidor> {
    const humidor = await this.prisma.humidor.findUnique({
      where: { id: humidorId }
    });

    if (!humidor) {
      throw new NotFoundException('Humidor not found');
    }

    if (humidor.userId !== userId) {
      throw new UnauthorizedException('Not authorized to update this humidor');
    }

    return this.prisma.humidor.update({
      where: { id: humidorId },
      data: {
        name: dto.name ?? undefined,
        description: dto.description ?? undefined,
        imageUrl: dto.imageUrl ?? undefined
      }
    });
  }

  async deleteHumidor(userId: number, humidorId: number): Promise<void> {
    const humidor = await this.prisma.humidor.findUnique({
      where: { id: humidorId }
    });

    if (!humidor) {
      throw new NotFoundException('Humidor not found');
    }

    if (humidor.userId !== userId) {
      throw new UnauthorizedException('Not authorized to delete this humidor');
    }

    await this.prisma.humidor.delete({
      where: { id: humidorId }
    });
  }

  async addCigarToHumidor(userId: number, humidorId: number, dto: AddCigarToHumidorDto): Promise<HumidorCigar> {
    const humidor = await this.prisma.humidor.findUnique({
      where: { id: humidorId },
      include: {
        cigars: {
          include: {
            cigar: true
          }
        }
      }
    });



    if (!humidor) {
      throw new NotFoundException('Humidor not found');
    }

    console.log('test',humidor)

    if (humidor.userId !== userId) {
      throw new UnauthorizedException('Not authorized to add cigars to this humidor');
    }

    if(dto.isAddQuantity && humidor && humidor.cigars ){
        for(let i = 0; i < humidor?.cigars?.length; i++){
            if(dto.cigarId===humidor.cigars[i].cigarId){
                return this.prisma.humidorCigar.update({
                    where: {id: humidor.cigars[i].id},
                    data: {quantity: dto.quantity+humidor.cigars[i].quantity}
                  });
                  
            }
        }
    }

    return this.prisma.humidorCigar.create({
      data: {
        humidorId,
        cigarId: dto.cigarId,
        quantity: dto.quantity,
        purchasePrice: dto.purchasePrice,
        purchaseDate: new Date(dto.purchaseDate),
        purchaseLocation: dto.purchaseLocation,
        notes: dto.notes
      },
      include: {
        cigar: true
      }
    });
  }

  async removeCigarFromHumidor(userId: number, humidorId: number, humidorCigarId: number): Promise<void> {
    // First verify the humidor exists and belongs to the user
    const humidor = await this.prisma.humidor.findUnique({
        where: { id: humidorId }
    });

    if (!humidor) {
        throw new NotFoundException('Humidor not found');
    }

    if (humidor.userId !== userId) {
        throw new UnauthorizedException('Not authorized to access this humidor');
    }

    // Then verify the cigar exists in this specific humidor
    const humidorCigar = await this.prisma.humidorCigar.findFirst({
        where: {
            AND: [
                { id: humidorCigarId },
                { humidorId: humidorId } // Add this condition to ensure cigar belongs to specified humidor
            ]
        }
    });

    if (!humidorCigar) {
        throw new NotFoundException('Cigar not found in this humidor');
    }

    // If all validations pass, remove the cigar
    await this.prisma.humidorCigar.delete({
        where: { id: humidorCigarId }
    });
}
}