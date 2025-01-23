import { PrismaClient, Cigar } from "@prisma/client";


interface CigarCreateInput {
  name: string;
  brand: string;
  length?: number | null;
  ringGauge?: number | null;
  country?: string | null;
  wrapper?: string | null;
  binder?: string | null;
  filler?: string | null;
  color?: string | null;
  strength?: string | null;
  premiumAssistantMessage?: any | null;
}

interface CigarVariant {
  id: number;
  length: number | null;
  ringGauge: number | null;
  wrapper: string | null;
  strength: string | null;
}

interface CigarSearchGroup {
  brandName: string;
  lineName: string;
  similarity: number;
  variants: CigarVariant[];
}

interface CigarSearchResponse {
  type: "SEARCH_RESULTS";
  total: number;
  data: CigarSearchGroup[];
}

interface CigarSearchRawResult {
  id: number;
  cigar_name: string;
  brand_name: string;
  length: number | null;
  ringGauge: number | null;
  wrapper: string | null;
  strength: string | null;
  similarity: number;
}

const prisma = new PrismaClient();

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class CigarService {
  async search(query: string): Promise<CigarSearchResponse> {
    const searchTerm = query.toLowerCase().trim();

    const matches = await prisma.$queryRaw<CigarSearchRawResult[]>`
    WITH search_terms AS (
      SELECT ${searchTerm} as full_term,
             string_to_array(${searchTerm}, ' ') as terms
    ),
    matched_cigars AS (
      SELECT 
        c.id,
        c.name as cigar_name,
        c.length,
        c."ringGauge",
        c.wrapper,
        c.strength,
        b.name as brand_name,
        GREATEST(
          CASE 
            WHEN LOWER(b.name || ' ' || c.name) = (SELECT full_term FROM search_terms) THEN 1.0
            WHEN LOWER(b.name) = (SELECT full_term FROM search_terms) THEN 0.9
            WHEN (
              SELECT bool_and(
                LOWER(b.name || ' ' || c.name) LIKE '%' || LOWER(term) || '%'
              )
              FROM unnest((SELECT terms FROM search_terms)) as term
            ) THEN 0.8
            ELSE
              GREATEST(
                SIMILARITY(LOWER(b.name), ${searchTerm}),
                SIMILARITY(LOWER(c.name), ${searchTerm}),
                SIMILARITY(LOWER(b.name || ' ' || c.name), ${searchTerm})
              )
          END
        ) as similarity
      FROM "Cigar" c
      JOIN "Brand" b ON c."brandId" = b.id
      WHERE EXISTS (
        SELECT 1
        FROM unnest((SELECT terms FROM search_terms)) as term
        WHERE 
          LOWER(b.name) LIKE '%' || LOWER(term) || '%'
          OR LOWER(c.name) LIKE '%' || LOWER(term) || '%'
      )
    )
    SELECT *
    FROM matched_cigars
    WHERE similarity > 0.3
    ORDER BY similarity DESC
    LIMIT 10
  `;

    const groupedResults = matches.reduce<Record<string, CigarSearchGroup>>(
      (acc, match) => {
        const key = `${match.brand_name} ${match.cigar_name}`;

        if (!acc[key]) {
          acc[key] = {
            brandName: match.brand_name,
            lineName: match.cigar_name,
            similarity: match.similarity,
            variants: [],
          };
        }

        if (match.length && match.ringGauge) {
          acc[key].variants.push({
            id: match.id,
            length: match.length,
            ringGauge: match.ringGauge,
            wrapper: match.wrapper,
            strength: match.strength,
          });
        }

        return acc;
      },
      {}
    );

    const results = (Object.values(groupedResults) as CigarSearchGroup[]).sort(
      (a, b) => b.similarity - a.similarity
    );

    return {
      type: "SEARCH_RESULTS",
      total: results.length,
      data: results,
    };
  }

  async getCigarById(id: number) {
    const cigar = await prisma.cigar.findUnique({
      where: { id },
      include: {
        brand: true,
      },
    });

    if (!cigar) {
      throw new Error("Cigar not found");
    }

    return {
      id: cigar.id,
      name: cigar.name,
      brandName: cigar.brand.name,
      length: cigar.length,
      ringGauge: cigar.ringGauge,
      wrapper: cigar.wrapper,
      binder: cigar.binder,
      filler: cigar.filler,
      country: cigar.country,
      strength: cigar.strength,
    };
  }

  async createCigar(data: CigarCreateInput): Promise<Cigar> {
    // Validate required fields
    if (!data.name || !data.brand) {
      throw new ValidationError("Name and brand are required fields");
    }

    // Validate numeric fields if provided
    if (data.length !== undefined && data.length !== null) {
      if (data.length <= 0 || data.length > 12) {
        throw new ValidationError("Length must be between 0 and 12 inches");
      }
    }

    if (data.ringGauge !== undefined && data.ringGauge !== null) {
      if (data.ringGauge <= 0 || data.ringGauge > 80) {
        throw new ValidationError("Ring gauge must be between 0 and 80");
      }
    }

    try {
      // Find or create brand
      // First try to find the brand
      let brand = await prisma.brand.findFirst({
        where: {
          name: {
            equals: data.brand.trim(),
            mode: 'insensitive'  // Case insensitive search
          }
        }
      });

      // If brand doesn't exist, create it
      if (!brand) {
        brand = await prisma.brand.create({
          data: {
            name: data.brand.trim()
          }
        });
      }

      // Create the cigar
      const cigar = await prisma.cigar.create({
        data: {
          name: data.name.trim(),
          brandId: brand.id,
          length: data.length,
          ringGauge: data.ringGauge,
          country: data.country?.trim() || null,
          wrapper: data.wrapper?.trim() || null,
          binder: data.binder?.trim() || null,
          filler: data.filler?.trim() || null,
          color: data.color?.trim() || null,
          strength: this.validateStrength(data.strength),
          premiumAssistantMessage: data.premiumAssistantMessage || null
        },
        include: {
          brand: true
        }
      });

      return cigar;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error creating cigar:', error);
      throw new Error('Failed to create cigar');
    }
  }

  private validateStrength(strength?: string | null): string | null {
    if (!strength) return null;

    const validStrengths = [
      'MILD',
      'MILD_MEDIUM',
      'MEDIUM',
      'MEDIUM_FULL',
      'FULL'
    ];

    const normalized = strength.toUpperCase().replace(/[^A-Z]/g, '_');

    if (validStrengths.includes(normalized)) {
      return normalized;
    }

    // Handle common variations
    const strengthMap: Record<string, string> = {
      'LIGHT': 'MILD',
      'MILD_TO_MEDIUM': 'MILD_MEDIUM',
      'MEDIUM_TO_FULL': 'MEDIUM_FULL'
    };

    return strengthMap[normalized] || null;
  }


}
