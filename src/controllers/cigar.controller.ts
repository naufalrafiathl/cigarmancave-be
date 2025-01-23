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

  async createCigar(req: Request, res: Response) {
    try {
      const {
        name,
        brand,
        length,
        ringGauge,
        country,
        wrapper,
        binder,
        filler,
        color,
        strength
      } = req.body;

      // Validate required fields
      if (!name || !brand) {
        return res.status(400).json({
          status: 'error',
          message: 'Name and brand are required fields'
        });
      }

      // Create the cigar with all optional fields
      const cigar = await this.cigarService.createCigar({
        name,
        brand,
        length: length ? Number(length) : null,
        ringGauge: ringGauge ? Number(ringGauge) : null,
        country: country || null,
        wrapper: wrapper || null,
        binder: binder || null,
        filler: filler || null,
        color: color || null,
        strength: strength || null
      });

      // Return just the cigar data to match frontend expectations
      return res.status(201).json(cigar);

    } catch (error) {
      console.error('Create cigar error:', error);

      // Handle specific validation errors
      if (error instanceof Error && error.name === 'ValidationError') {
        return res.status(400).json({
          message: error.message
        });
      }

      // Handle other errors
      return res.status(500).json({
        message: 'Failed to create cigar'
      });
    }
  }
}