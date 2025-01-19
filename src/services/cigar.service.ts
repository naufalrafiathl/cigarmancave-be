// src/services/cigar.service.ts
import { PrismaClient } from "@prisma/client";

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
}
