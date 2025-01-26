"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CigarService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}
class CigarService {
    async search(query) {
        const searchTerm = query.toLowerCase().trim();
        const matches = await prisma.$queryRaw `
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
        const groupedResults = matches.reduce((acc, match) => {
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
        }, {});
        const results = Object.values(groupedResults).sort((a, b) => b.similarity - a.similarity);
        return {
            type: "SEARCH_RESULTS",
            total: results.length,
            data: results,
        };
    }
    async getCigarById(id) {
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
    async createCigar(data) {
        var _a, _b, _c, _d, _e;
        if (!data.name || !data.brand) {
            throw new ValidationError("Name and brand are required fields");
        }
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
            let brand = await prisma.brand.findFirst({
                where: {
                    name: {
                        equals: data.brand.trim(),
                        mode: 'insensitive'
                    }
                }
            });
            if (!brand) {
                brand = await prisma.brand.create({
                    data: {
                        name: data.brand.trim()
                    }
                });
            }
            const cigar = await prisma.cigar.create({
                data: {
                    name: data.name.trim(),
                    brandId: brand.id,
                    length: data.length,
                    ringGauge: data.ringGauge,
                    country: ((_a = data.country) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                    wrapper: ((_b = data.wrapper) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                    binder: ((_c = data.binder) === null || _c === void 0 ? void 0 : _c.trim()) || null,
                    filler: ((_d = data.filler) === null || _d === void 0 ? void 0 : _d.trim()) || null,
                    color: ((_e = data.color) === null || _e === void 0 ? void 0 : _e.trim()) || null,
                    strength: this.validateStrength(data.strength),
                    premiumAssistantMessage: data.premiumAssistantMessage || null
                },
                include: {
                    brand: true
                }
            });
            return cigar;
        }
        catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            console.error('Error creating cigar:', error);
            throw new Error('Failed to create cigar');
        }
    }
    validateStrength(strength) {
        if (!strength)
            return null;
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
        const strengthMap = {
            'LIGHT': 'MILD',
            'MILD_TO_MEDIUM': 'MILD_MEDIUM',
            'MEDIUM_TO_FULL': 'MEDIUM_FULL'
        };
        return strengthMap[normalized] || null;
    }
}
exports.CigarService = CigarService;
//# sourceMappingURL=cigar.service.js.map