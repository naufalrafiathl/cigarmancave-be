// src/services/import.service.ts
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { createWorker } from "tesseract.js";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  ImportFileType,
  ProcessingMethod,
  QuotaInfo,
  ValidationResult,
  CigarImportData,
  ProcessingResult,
  MatchResult,
  ValidationError,
  ProcessingError,
  CigarStrength,
} from "../types/import";
import moment from "moment";

interface SimilarityMatch {
  id: number;
  cigar_name: string;
  brand_name: string;
  length: number | null;
  ringGauge: number | null;
  wrapper: string | null;
  binder: string | null;
  filler: string | null;
  country: string | null;
  strength: string | null;
  similarity: number;
}

export class ImportService {
  private prisma: PrismaClient;
  private openai: OpenAI;

  constructor() {
    this.prisma = new PrismaClient();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async getUserQuota(userId: number): Promise<QuotaInfo> {
    // Get the current month's usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await this.prisma.importLog.groupBy({
      by: ["fileType"],
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
        },
      },
      _count: {
        id: true,
      },
    });

    // Set quotas based on subscription level
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });

    // Define quota limits based on subscription
    const imageQuota = user?.isPremium ? 60 : 10;
    const documentQuota = user?.isPremium ? 20 : 5;

    const imageUsage =
      usage.find((u) => u.fileType === ImportFileType.IMAGE)?._count.id || 0;
    const documentUsage =
      usage.find(
        (u) =>
          u.fileType === ImportFileType.PDF ||
          u.fileType === ImportFileType.SPREADSHEET
      )?._count.id || 0;

    return {
      images: {
        used: imageUsage,
        total: imageQuota,
        remaining: imageQuota - imageUsage,
      },
      documents: {
        used: documentUsage,
        total: documentQuota,
        remaining: documentQuota - documentUsage,
      },
    };
  }

  async validateImport(
    userId: number,
    fileType: ImportFileType,
    fileSize: number
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check file size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxSize) {
      errors.push(
        `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`
      );
    }

    // Check quota
    const quota = await this.getUserQuota(userId);
    if (fileType === ImportFileType.IMAGE && quota.images.remaining <= 0) {
      errors.push("Monthly image import quota exceeded");
    } else if (
      (fileType === ImportFileType.PDF ||
        fileType === ImportFileType.SPREADSHEET) &&
      quota.documents.remaining <= 0
    ) {
      errors.push("Monthly document import quota exceeded");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async logImport(
    userId: number,
    fileType: ImportFileType,
    result: ProcessingResult
  ): Promise<void> {
    await this.prisma.importLog.create({
      data: {
        userId,
        fileType,
        processingMethod: result.method,
        confidence: result.confidence || 0,
        cost: result.cost,
        duration: result.duration,
        success: result.success,
        error: result.error,
      },
    });
  }

  async processImport(
    userId: number,
    file: Express.Multer.File,
    fileType: ImportFileType
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // Validate import
      const validation = await this.validateImport(userId, fileType, file.size);
      if (!validation.isValid) {
        throw new ValidationError(validation.errors.join(", "));
      }

      // Process based on file type
      let result: ProcessingResult;
      switch (fileType) {
        case ImportFileType.IMAGE:
          result = await this.processImage(file);
          break;
        case ImportFileType.PDF:
          throw new ValidationError("PDF processing not yet implemented");
        case ImportFileType.SPREADSHEET:
          result = await this.processSpreadsheet(file);
          break;
        default:
          throw new ValidationError("Unsupported file type");
      }

      // Log the import
      const duration = Date.now() - startTime;
      result.duration = duration;
      await this.logImport(userId, fileType, result);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: ProcessingResult = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        method: ProcessingMethod.OCR,
        cost: 0,
        duration,
      };
      await this.logImport(userId, fileType, result);
      throw error;
    }
  }

  private async processImage(
    file: Express.Multer.File
  ): Promise<ProcessingResult> {
    try {
      console.log("Starting image processing...");
      const worker = await createWorker();
      const startTime = Date.now();

      // First attempt with Tesseract OCR
      console.log("Running Tesseract OCR...");
      const ocrResult = await worker.recognize(file.buffer);
      await worker.terminate();
      console.log("OCR Result:", {
        confidence: ocrResult.data.confidence,
        text: ocrResult.data.text.substring(0, 200) + "...", // Log first 200 chars
      });

      // If OCR confidence is high, process with GPT-4
      // Modify the GPT-4 processing section in processImage method:

      if (ocrResult.data.confidence > 70) {
        console.log("OCR confidence > 70, processing with GPT-4...");
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are a JSON-only response system. Extract ALL cigar details from the OCR text and return ONLY a valid JSON array of objects. Each object MUST include these fields:
          {
            "brand": "string (required)",
            "name": "string (required)",
            "quantity": number (default to 1 if not specified),
            "purchasePrice": number or null,
            "purchaseDate": "YYYY-MM-DD" or null,
            "purchaseLocation": "string" or null,
            "notes": "string" or null,
            
            // Additional cigar details
            "length": number or null,
            "ringGauge": number or null,
            "wrapper": "string" or null,
            "binder": "string" or null,
            "filler": "string" or null,
            "color": "string" or null,
            "strength": "MILD" | "MILD_MEDIUM" | "MEDIUM" | "MEDIUM_FULL" | "FULL" | null
          }
          
          Important rules:
          1. Quantity MUST be provided - default to 1 if not explicitly stated
          2. Look for price information in various formats ($XX.XX, $XX, XX.XX)
          3. Extract purchase date if present (any date format)
          4. Look for store/vendor names as purchase location
          5. Capture any additional notes or comments
          6. If multiple items are listed with the same details but different quantities, create separate entries
          
          Common patterns to watch for:
          - Quantity indicators: "2x", "qty: 3", "(2)", "2 boxes", etc.
          - Price indicators: "$", "USD", "price:", "cost:", etc.
          - Date patterns: "purchased on", "date:", "bought", etc.
          - Location patterns: "from", "store:", "vendor:", etc.
          
          Return as an array of objects, even if only one cigar is found.`,
            },
            {
              role: "user",
              content: ocrResult.data.text,
            },
          ],
          temperature: 0.3,
        });

        const gptResponse = completion.choices[0]?.message?.content;
        console.log("GPT-4 Response:", gptResponse);

        if (!gptResponse) throw new ProcessingError("No response from GPT");

        try {
          const cleanedResponse = gptResponse
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

          const parsedData = JSON.parse(cleanedResponse);
          console.log("Successfully parsed GPT-4 response:", parsedData);

          // Validate that we have an array
          if (!Array.isArray(parsedData)) {
            throw new ProcessingError("GPT response is not an array");
          }

          // Validate each cigar in the array
          const validatedCigars = parsedData.map((cigar) =>
            this.validateCigarData(cigar)
          );

          return {
            success: true,
            data: validatedCigars,
            method: ProcessingMethod.OCR,
            confidence: ocrResult.data.confidence,
            cost: 0.002,
            duration: Date.now() - startTime,
          };
        } catch (jsonError) {
          console.error("Error parsing GPT-4 response:", jsonError);
          console.error("Raw GPT-4 response:", gptResponse);
          throw new ProcessingError("Failed to parse GPT-4 response");
        }
      }

      // Fall back to Vision API for low confidence results
      console.log("Low OCR confidence, falling back to Vision API...");
      const base64Image = file.buffer.toString("base64");
      const visionResponse = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a cigar analysis assistant. When analyzing cigar images, extract and return data in the following JSON format WITHOUT ANY COMMENTS: 
          {
            "brand": "string (required)",
            "name": "string (required)",
            "quantity": number (default to 1 if not specified),
            "purchasePrice": number or null,
            "purchaseDate": "YYYY-MM-DD" or null,
            "purchaseLocation": "string" or null,
            "notes": "string" or null,
            "length": number or null,
            "ringGauge": number or null,
            "wrapper": "string" or null,
            "binder": "string" or null,
            "filler": "string" or null,
            "color": "string" or null,
            "strength": "MILD" | "MILD_MEDIUM" | "MEDIUM" | "MEDIUM_FULL" | "FULL" | null
          }
          
          Important rules:
          1. Return ONLY valid JSON without any comments or markdown
          2. Quantity MUST be provided - default to 1 if not specified
          3. Look for price information in various formats ($XX.XX, $XX, XX.XX)
          4. Extract purchase date if present (any date format)
          5. Look for store/vendor names as purchase location
          6. Capture any additional notes or comments
          
          When analyzing the image, pay special attention to:
          1. Price tags or stickers
          2. Store labels or receipts
          3. Box dates or purchase dates
          4. Store/vendor information
          5. Any handwritten notes or markings
          6. Quantity indicators (2x, qty: 3, etc.)
          7. Common abbreviations (AF = Arturo Fuente, PSD4 = Partagas Serie D No. 4, etc.)
          
          Return ONLY the JSON object with no additional formatting or comments.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.mimetype};base64,${base64Image}`,
                },
              },
              {
                type: "text",
                text: "Analyze this cigar and provide detailed information in JSON format. Focus on any visible text, packaging, or distinguishing characteristics.",
              },
            ],
          },
        ],
        max_tokens: 4096,
      });

      console.log(
        "Vision API Response:",
        visionResponse.choices[0]?.message?.content
      );

      try {
        const rawResponse = visionResponse.choices[0]?.message?.content || "{}";
        console.log("Vision API Response:", rawResponse);

        // Clean the response by removing markdown code blocks
        const cleanedResponse = rawResponse
          .replace(/```json\n?/g, "") // Remove opening ```json
          .replace(/```\n?/g, "") // Remove closing ```
          .trim(); // Remove any extra whitespace

        console.log("Cleaned Response:", cleanedResponse);

        const visionData = JSON.parse(cleanedResponse);
        console.log("Successfully parsed Vision API response:", visionData);

        return {
          success: true,
          data: [this.validateCigarData(visionData)],
          method: ProcessingMethod.VISION,
          confidence: 90,
          cost: 0.03,
          duration: Date.now() - startTime,
        };
      } catch (jsonError) {
        console.error("Error parsing Vision API response:", jsonError);
        console.error(
          "Raw Vision API response:",
          visionResponse.choices[0]?.message?.content
        );
        throw new ProcessingError("Failed to parse Vision API response");
      }
    } catch (error) {
      console.error("Image processing error:", error);
      if (error instanceof Error) {
        console.error("Error stack:", error.stack);
      }
      throw new ProcessingError(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  private async processSpreadsheet(
    file: Express.Multer.File
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      let rawData: any[] = [];

      if (file.mimetype === "text/csv") {
        const csvText = file.buffer.toString("utf-8");
        const parseResult = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        });

        if (parseResult.errors.length > 0) {
          throw new ProcessingError(
            `CSV parsing error: ${parseResult.errors[0].message}`
          );
        }

        rawData = parseResult.data;
      } else {
        const workbook = XLSX.read(file.buffer, { type: "buffer" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        rawData = XLSX.utils.sheet_to_json(firstSheet);
      }

      const processedData = rawData
        .map((row) => this.mapSpreadsheetRow(row))
        .filter((data) => data.brand && data.name);

      return {
        success: true,
        data: processedData,
        method: ProcessingMethod.DIRECT_PARSE,
        confidence: 100,
        cost: 0.001,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      throw new ProcessingError(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  private mapSpreadsheetRow(row: any): CigarImportData {
    return {
      brand: row.brand || row.Brand || "",
      name: row.name || row.Name || "",
      quantity: this.validateQuantity(row.quantity || row.Quantity),
      purchasePrice: this.parseNumber(
        row.price || row.Price || row.purchasePrice
      ),
      purchaseDate: this.parseDate(row.date || row.purchaseDate || row.Date),
      purchaseLocation:
        row.location || row.store || row.purchaseLocation || null,
      notes: row.notes || row.Notes || null,
      imageUrl: row.imageUrl || row.image || null,
      length: this.parseNumber(row.length || row.Length),
      ringGauge: this.parseNumber(
        row.ringGauge || row.ring_gauge || row["Ring Gauge"]
      ),
      country: row.country || row.Country || null,
      wrapper: row.wrapper || row.Wrapper || null,
      binder: row.binder || row.Binder || null,
      filler: row.filler || row.Filler || null,
      color: row.color || row.Color || null,
      strength: this.validateStrength(row.strength || row.Strength),
    };
  }
  // Inside src/services/import.service.ts
  // Add this method before the private parseNumber method

  async findMatches(importData: CigarImportData[]): Promise<MatchResult> {
    const result: MatchResult = {
      exactMatches: [],
      possibilities: [],
      newEntries: [],
    };
  
    // Process all cigars in parallel
    const matchPromises = importData.map(async (cigar) => {
      try {
        const searchTerm = `${cigar.brand} ${cigar.name}`.toLowerCase().trim();
        const matches = await this.prisma.$queryRaw<SimilarityMatch[]>`
          WITH search_terms AS (
            SELECT ${searchTerm} as full_term,
                   string_to_array(${searchTerm}, ' ') as terms
          ),
          matched_cigars AS (
            SELECT 
              c.id,
              c.name as cigar_name,
              b.name as brand_name,
              c.length,
              c."ringGauge",
              c.wrapper,
              c.binder,
              c.filler,
              c.country,
              c.strength,
              GREATEST(
                CASE 
                  WHEN LOWER(b.name || ' ' || c.name) = (SELECT full_term FROM search_terms) THEN 1.0
                  WHEN (
                    SELECT bool_and(
                      LOWER(b.name || ' ' || c.name) LIKE '%' || LOWER(term) || '%'
                    )
                    FROM unnest((SELECT terms FROM search_terms)) as term
                  ) THEN 0.8
                  ELSE
                    SIMILARITY(LOWER(b.name || ' ' || c.name), ${searchTerm})
                END
              ) as similarity
            FROM "Cigar" c
            JOIN "Brand" b ON c."brandId" = b.id
            WHERE 
              SIMILARITY(LOWER(b.name || ' ' || c.name), ${searchTerm}) > 0.3
          )
          SELECT *
          FROM matched_cigars
          WHERE similarity > 0.3
          ORDER BY similarity DESC, brand_name, cigar_name
          LIMIT 10
        `;
  
        return { cigar, matches };
      } catch (error) {
        console.error(
          `Error processing match for cigar: ${cigar.brand} ${cigar.name}`,
          error
        );
        return { cigar, matches: [] };
      }
    });
  
    // Wait for all parallel operations to complete
    const matchResults = await Promise.all(matchPromises);
  
    // Collect all cigar IDs that need details
    const allCigarIds = matchResults.flatMap(({ matches }) => 
      matches.map(m => m.id)
    );
  
    // Fetch all cigar details in one batch query
    const cigarDetailsMap = new Map(
      (await this.fetchCigarDetails(allCigarIds))
        .map(cigar => [cigar.id, cigar])
    );
  
    // Process the results using the cached details
    for (const { cigar, matches } of matchResults) {
      if (matches.length === 0) {
        result.newEntries.push(cigar);
        continue;
      }
  
      // Handle exact matches (similarity >= 0.8)
      const exactMatches = matches.filter((m) => m.similarity >= 0.8);
      if (exactMatches.length > 0) {
        const existingCigar = cigarDetailsMap.get(exactMatches[0].id);
        if (existingCigar) {
          result.exactMatches.push({
            importData: cigar,
            existingCigar,
          });
          continue;
        }
      }
  
      // Handle possible matches
      const top3Matches = matches
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3);
  
      const possibleMatches = top3Matches
        .map(match => cigarDetailsMap.get(match.id))
        .filter((c): c is NonNullable<typeof c> => c !== undefined);
  
      result.possibilities.push({
        importData: cigar,
        possibleMatches,
        scores: top3Matches.map((m) => ({
          similarity: m.similarity,
          matchDetails: this.getMatchDetails(cigar, m),
        })),
      });
    }
  
    return result;
  }
  
  private async fetchCigarDetails(cigarIds: number[]) {
    if (cigarIds.length === 0) return [];
    
    const chunkSize = 100;
    const chunks = [];
    for (let i = 0; i < cigarIds.length; i += chunkSize) {
      chunks.push(cigarIds.slice(i, i + chunkSize));
    }
  
    const results = await Promise.all(
      chunks.map(chunk =>
        this.prisma.cigar.findMany({
          where: {
            id: {
              in: chunk
            }
          },
          include: {
            brand: true
          }
        })
      )
    );
  
    return results.flat();
  }

  private getMatchDetails(
    importData: CigarImportData,
    match: SimilarityMatch
  ): string[] {
    const details: string[] = [];

    // Brand match analysis
    if (match.brand_name.toLowerCase() === importData.brand.toLowerCase()) {
      details.push("Exact brand match");
    } else {
      details.push(
        `Similar brand: '${match.brand_name}' vs '${importData.brand}'`
      );
    }

    // Name match analysis
    if (match.cigar_name.toLowerCase() === importData.name.toLowerCase()) {
      details.push("Exact name match");
    } else {
      details.push(
        `Similar name: '${match.cigar_name}' vs '${importData.name}'`
      );
    }

    // Specifications match
    if (importData.length && match.length) {
      const lengthDiff = Math.abs(importData.length - match.length);
      if (lengthDiff < 0.25) {
        details.push("Length matches");
      } else {
        details.push(`Length differs by ${lengthDiff.toFixed(2)} inches`);
      }
    }

    if (importData.ringGauge && match.ringGauge) {
      const rgDiff = Math.abs(importData.ringGauge - match.ringGauge);
      if (rgDiff < 2) {
        details.push("Ring gauge matches");
      } else {
        details.push(`Ring gauge differs by ${rgDiff}`);
      }
    }

    // Additional attributes
    const attributes = [
      { name: "wrapper", value: match.wrapper },
      { name: "strength", value: match.strength },
      { name: "country", value: match.country },
    ];

    attributes.forEach((attr) => {
      if (importData[attr.name as keyof CigarImportData] && attr.value) {
        if (importData[attr.name as keyof CigarImportData] === attr.value) {
          details.push(`${attr.name} matches`);
        } else {
          details.push(`Different ${attr.name}`);
        }
      }
    });

    return details;
  }

  private parseNumber(value: any): number | undefined {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }

  private validateCigarData(data: any): CigarImportData {
    return {
      brand: data.brand || "",
      name: data.name || "",
      quantity: this.validateQuantity(data.quantity),
      purchasePrice: this.parseNumber(data.purchasePrice),
      purchaseDate: this.parseDate(data.purchaseDate),
      purchaseLocation: data.purchaseLocation || null,
      notes: data.notes || null,
      imageUrl: data.imageUrl || null,
      length: this.parseNumber(data.length),
      ringGauge: this.parseNumber(data.ringGauge),
      country: data.country || null,
      wrapper: data.wrapper || null,
      binder: data.binder || null,
      filler: data.filler || null,
      color: data.color || null,
      strength: this.validateStrength(data.strength),
    };
  }

  private validateQuantity(value: any): number {
    if (typeof value === "number" && value > 0) {
      return Math.floor(value); // Ensure whole number
    }
    if (typeof value === "string") {
      // Try to extract number from string (e.g., "2x", "qty: 3")
      const match = value.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > 0) return num;
      }
    }
    return 1; // Default to 1 if no valid quantity found
  }

  private parseDate(value: any): Date | null {
    if (!value) return null;

    try {
      if (value instanceof Date) return value;

      // Try parsing ISO format
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date;

      // Try parsing common date formats
      const formats = [
        "MM/DD/YYYY",
        "DD/MM/YYYY",
        "YYYY-MM-DD",
        "MM-DD-YYYY",
        "DD-MM-YYYY",
      ];

      for (const format of formats) {
        const parsed = moment(value, format);
        if (parsed.isValid()) return parsed.toDate();
      }

      return null;
    } catch {
      return null;
    }
  }

  private validateStrength(strength?: string): string | undefined {
    if (!strength) return undefined;

    const normalized = strength.toUpperCase().trim();

    // Direct matches
    if (Object.values(CigarStrength).includes(normalized as CigarStrength)) {
      return normalized;
    }

    // Common variations
    const strengthMap: Record<string, CigarStrength> = {
      LIGHT: CigarStrength.MILD,
      "MILD TO MEDIUM": CigarStrength.MILD_MEDIUM,
      "MEDIUM TO FULL": CigarStrength.MEDIUM_FULL,
    };

    return strengthMap[normalized] || undefined;
  }
}
