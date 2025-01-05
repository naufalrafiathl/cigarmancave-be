export interface CreateHumidorDto {
  name: string;
  description?: string;
  imageUrl?: string;
  userId: number;
}

export interface UpdateHumidorDto {
  name?: string;
  description?: string;
  imageUrl?: string;
}

export interface AddCigarToHumidorDto {
  cigarId: number;
  quantity: number;
  purchasePrice?: number;
  purchaseDate?: string;
  purchaseLocation?: string;
  notes?: string;
}

export interface UpdateHumidorCigarDto {
  quantity?: number;
  purchasePrice?: number;
  purchaseDate?: string | Date;
  purchaseLocation?: string;
  notes?: string;
}

