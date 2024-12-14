import { Request, Response } from 'express';
import { CigarService } from '../services/cigar.service';

export class CigarController {
  private cigarService: CigarService;

  constructor() {
    this.cigarService = new CigarService();
  }

  async search(req: Request, res: Response) {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Search query is required' });
      }

      const results = await this.cigarService.search(query);
      if (!results) {
        return res.status(404).json({ message: 'No cigars found' });
      }

      return res.json(results);
    } catch (error) {
      console.error('Search error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getCigar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const cigar = await this.cigarService.getCigarById(Number(id));
      
      if (!cigar) {
        return res.status(404).json({ message: 'Cigar not found' });
      }

      return res.json(cigar);
    } catch (error) {
      console.error('Get cigar error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}