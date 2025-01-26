"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const client_1 = require("@prisma/client");
const openai_1 = __importDefault(require("openai"));
const tesseract_js_1 = require("tesseract.js");
const papaparse_1 = __importDefault(require("papaparse"));
const XLSX = __importStar(require("xlsx"));
const import_1 = require("../types/import");
const moment_1 = __importDefault(require("moment"));
class ImportService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async getUserQuota(userId) {
        var _a, _b;
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
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { isPremium: true },
        });
        const imageQuota = (user === null || user === void 0 ? void 0 : user.isPremium) ? 40 : 0;
        const documentQuota = (user === null || user === void 0 ? void 0 : user.isPremium) ? 40 : 0;
        const imageUsage = ((_a = usage.find((u) => u.fileType === import_1.ImportFileType.IMAGE)) === null || _a === void 0 ? void 0 : _a._count.id) || 0;
        const documentUsage = ((_b = usage.find((u) => u.fileType === import_1.ImportFileType.PDF ||
            u.fileType === import_1.ImportFileType.SPREADSHEET)) === null || _b === void 0 ? void 0 : _b._count.id) || 0;
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
    async validateImport(userId, fileType, fileSize) {
        const errors = [];
        const maxSize = 10 * 1024 * 1024;
        if (fileSize > maxSize) {
            errors.push(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
        }
        const quota = await this.getUserQuota(userId);
        if (fileType === import_1.ImportFileType.IMAGE && quota.images.remaining <= 0) {
            errors.push("Monthly image import quota exceeded");
        }
        else if ((fileType === import_1.ImportFileType.PDF ||
            fileType === import_1.ImportFileType.SPREADSHEET) &&
            quota.documents.remaining <= 0) {
            errors.push("Monthly document import quota exceeded");
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    async logImport(userId, fileType, result) {
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
    async processImport(userId, file, fileType) {
        const startTime = Date.now();
        try {
            const validation = await this.validateImport(userId, fileType, file.size);
            if (!validation.isValid) {
                throw new import_1.ValidationError(validation.errors.join(", "));
            }
            let result;
            switch (fileType) {
                case import_1.ImportFileType.IMAGE:
                    result = await this.processImage(file);
                    break;
                case import_1.ImportFileType.PDF:
                    throw new import_1.ValidationError("PDF processing not yet implemented");
                case import_1.ImportFileType.SPREADSHEET:
                    result = await this.processSpreadsheet(file);
                    break;
                default:
                    throw new import_1.ValidationError("Unsupported file type");
            }
            const duration = Date.now() - startTime;
            result.duration = duration;
            await this.logImport(userId, fileType, result);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const result = {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                method: import_1.ProcessingMethod.OCR,
                cost: 0,
                duration,
            };
            await this.logImport(userId, fileType, result);
            throw error;
        }
    }
    async processImage(file) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        try {
            console.log("Starting image processing...");
            const worker = await (0, tesseract_js_1.createWorker)();
            const startTime = Date.now();
            console.log("Running Tesseract OCR...");
            const ocrResult = await worker.recognize(file.buffer);
            await worker.terminate();
            console.log("OCR Result:", {
                confidence: ocrResult.data.confidence,
                text: ocrResult.data.text.substring(0, 200) + "...",
            });
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
                const gptResponse = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                console.log("GPT-4 Response:", gptResponse);
                if (!gptResponse)
                    throw new import_1.ProcessingError("No response from GPT");
                try {
                    const cleanedResponse = gptResponse
                        .replace(/```json\n?/g, "")
                        .replace(/```\n?/g, "")
                        .trim();
                    const parsedData = JSON.parse(cleanedResponse);
                    console.log("Successfully parsed GPT-4 response:", parsedData);
                    if (!Array.isArray(parsedData)) {
                        throw new import_1.ProcessingError("GPT response is not an array");
                    }
                    const validatedCigars = parsedData.map((cigar) => this.validateCigarData(cigar));
                    return {
                        success: true,
                        data: validatedCigars,
                        method: import_1.ProcessingMethod.OCR,
                        confidence: ocrResult.data.confidence,
                        cost: 0.002,
                        duration: Date.now() - startTime,
                    };
                }
                catch (jsonError) {
                    console.error("Error parsing GPT-4 response:", jsonError);
                    console.error("Raw GPT-4 response:", gptResponse);
                    throw new import_1.ProcessingError("Failed to parse GPT-4 response");
                }
            }
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
            console.log("Vision API Response:", (_d = (_c = visionResponse.choices[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content);
            try {
                const rawResponse = ((_f = (_e = visionResponse.choices[0]) === null || _e === void 0 ? void 0 : _e.message) === null || _f === void 0 ? void 0 : _f.content) || "{}";
                console.log("Vision API Response:", rawResponse);
                const cleanedResponse = rawResponse
                    .replace(/```json\n?/g, "")
                    .replace(/```\n?/g, "")
                    .trim();
                console.log("Cleaned Response:", cleanedResponse);
                const visionData = JSON.parse(cleanedResponse);
                console.log("Successfully parsed Vision API response:", visionData);
                return {
                    success: true,
                    data: [this.validateCigarData(visionData)],
                    method: import_1.ProcessingMethod.VISION,
                    confidence: 90,
                    cost: 0.03,
                    duration: Date.now() - startTime,
                };
            }
            catch (jsonError) {
                console.error("Error parsing Vision API response:", jsonError);
                console.error("Raw Vision API response:", (_h = (_g = visionResponse.choices[0]) === null || _g === void 0 ? void 0 : _g.message) === null || _h === void 0 ? void 0 : _h.content);
                throw new import_1.ProcessingError("Failed to parse Vision API response");
            }
        }
        catch (error) {
            console.error("Image processing error:", error);
            if (error instanceof Error) {
                console.error("Error stack:", error.stack);
            }
            throw new import_1.ProcessingError(error instanceof Error ? error.message : "Unknown error");
        }
    }
    async processSpreadsheet(file) {
        const startTime = Date.now();
        try {
            let rawData = [];
            if (file.mimetype === "text/csv") {
                const csvText = file.buffer.toString("utf-8");
                const parseResult = papaparse_1.default.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: true,
                });
                if (parseResult.errors.length > 0) {
                    throw new import_1.ProcessingError(`CSV parsing error: ${parseResult.errors[0].message}`);
                }
                rawData = parseResult.data;
            }
            else {
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
                method: import_1.ProcessingMethod.DIRECT_PARSE,
                confidence: 100,
                cost: 0.001,
                duration: Date.now() - startTime,
            };
        }
        catch (error) {
            throw new import_1.ProcessingError(error instanceof Error ? error.message : "Unknown error");
        }
    }
    mapSpreadsheetRow(row) {
        return {
            brand: row.brand || row.Brand || "",
            name: row.name || row.Name || "",
            quantity: this.validateQuantity(row.quantity || row.Quantity),
            purchasePrice: this.parseNumber(row.price || row.Price || row.purchasePrice),
            purchaseDate: this.parseDate(row.date || row.purchaseDate || row.Date),
            purchaseLocation: row.location || row.store || row.purchaseLocation || null,
            notes: row.notes || row.Notes || null,
            imageUrl: row.imageUrl || row.image || null,
            length: this.parseNumber(row.length || row.Length),
            ringGauge: this.parseNumber(row.ringGauge || row.ring_gauge || row["Ring Gauge"]),
            country: row.country || row.Country || null,
            wrapper: row.wrapper || row.Wrapper || null,
            binder: row.binder || row.Binder || null,
            filler: row.filler || row.Filler || null,
            color: row.color || row.Color || null,
            strength: this.validateStrength(row.strength || row.Strength),
        };
    }
    async findMatches(importData) {
        const result = {
            exactMatches: [],
            possibilities: [],
            newEntries: [],
        };
        const matchPromises = importData.map(async (cigar) => {
            try {
                const searchTerm = `${cigar.brand} ${cigar.name}`.toLowerCase().trim();
                const matches = await this.prisma.$queryRaw `
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
            }
            catch (error) {
                console.error(`Error processing match for cigar: ${cigar.brand} ${cigar.name}`, error);
                return { cigar, matches: [] };
            }
        });
        const matchResults = await Promise.all(matchPromises);
        const allCigarIds = matchResults.flatMap(({ matches }) => matches.map((m) => m.id));
        const cigarDetailsMap = new Map((await this.fetchCigarDetails(allCigarIds)).map((cigar) => [
            cigar.id,
            cigar,
        ]));
        for (const { cigar, matches } of matchResults) {
            if (matches.length === 0) {
                result.newEntries.push(cigar);
                continue;
            }
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
            const top3Matches = matches
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 3);
            const possibleMatches = top3Matches
                .map((match) => cigarDetailsMap.get(match.id))
                .filter((c) => c !== undefined);
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
    async fetchCigarDetails(cigarIds) {
        if (cigarIds.length === 0)
            return [];
        const chunkSize = 100;
        const chunks = [];
        for (let i = 0; i < cigarIds.length; i += chunkSize) {
            chunks.push(cigarIds.slice(i, i + chunkSize));
        }
        const results = await Promise.all(chunks.map((chunk) => this.prisma.cigar.findMany({
            where: {
                id: {
                    in: chunk,
                },
            },
            include: {
                brand: true,
            },
        })));
        return results.flat();
    }
    getMatchDetails(importData, match) {
        const details = [];
        if (match.brand_name.toLowerCase() === importData.brand.toLowerCase()) {
            details.push("Exact brand match");
        }
        else {
            details.push(`Similar brand: '${match.brand_name}' vs '${importData.brand}'`);
        }
        if (match.cigar_name.toLowerCase() === importData.name.toLowerCase()) {
            details.push("Exact name match");
        }
        else {
            details.push(`Similar name: '${match.cigar_name}' vs '${importData.name}'`);
        }
        if (importData.length && match.length) {
            const lengthDiff = Math.abs(importData.length - match.length);
            if (lengthDiff < 0.25) {
                details.push("Length matches");
            }
            else {
                details.push(`Length differs by ${lengthDiff.toFixed(2)} inches`);
            }
        }
        if (importData.ringGauge && match.ringGauge) {
            const rgDiff = Math.abs(importData.ringGauge - match.ringGauge);
            if (rgDiff < 2) {
                details.push("Ring gauge matches");
            }
            else {
                details.push(`Ring gauge differs by ${rgDiff}`);
            }
        }
        const attributes = [
            { name: "wrapper", value: match.wrapper },
            { name: "strength", value: match.strength },
            { name: "country", value: match.country },
        ];
        attributes.forEach((attr) => {
            if (importData[attr.name] && attr.value) {
                if (importData[attr.name] === attr.value) {
                    details.push(`${attr.name} matches`);
                }
                else {
                    details.push(`Different ${attr.name}`);
                }
            }
        });
        return details;
    }
    parseNumber(value) {
        const num = parseFloat(value);
        return isNaN(num) ? undefined : num;
    }
    validateCigarData(data) {
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
    validateQuantity(value) {
        if (typeof value === "number" && value > 0) {
            return Math.floor(value);
        }
        if (typeof value === "string") {
            const match = value.match(/\d+/);
            if (match) {
                const num = parseInt(match[0], 10);
                if (num > 0)
                    return num;
            }
        }
        return 1;
    }
    parseDate(value) {
        if (!value)
            return null;
        try {
            if (value instanceof Date)
                return value;
            const date = new Date(value);
            if (!isNaN(date.getTime()))
                return date;
            const formats = [
                "MM/DD/YYYY",
                "DD/MM/YYYY",
                "YYYY-MM-DD",
                "MM-DD-YYYY",
                "DD-MM-YYYY",
            ];
            for (const format of formats) {
                const parsed = (0, moment_1.default)(value, format);
                if (parsed.isValid())
                    return parsed.toDate();
            }
            return null;
        }
        catch (_a) {
            return null;
        }
    }
    validateStrength(strength) {
        if (!strength)
            return undefined;
        const normalized = strength.toUpperCase().trim();
        if (Object.values(import_1.CigarStrength).includes(normalized)) {
            return normalized;
        }
        const strengthMap = {
            LIGHT: import_1.CigarStrength.MILD,
            "MILD TO MEDIUM": import_1.CigarStrength.MILD_MEDIUM,
            "MEDIUM TO FULL": import_1.CigarStrength.MEDIUM_FULL,
        };
        return strengthMap[normalized] || undefined;
    }
    async confirmImport(userId, selections) {
        const result = {
            success: true,
            created: 0,
            matched: 0,
            addedToHumidor: 0,
            errors: [],
        };
        try {
            await this.prisma.$transaction(async (tx) => {
                var _a, _b, _c, _d;
                for (const selection of selections) {
                    try {
                        let cigarId;
                        switch (selection.matchType) {
                            case "exact":
                            case "possible":
                                cigarId = selection.selectedCigarId;
                                result.matched++;
                                break;
                            case "new":
                                let brand = await tx.brand.findFirst({
                                    where: {
                                        name: {
                                            equals: selection.importData.brand,
                                            mode: "insensitive",
                                        },
                                    },
                                });
                                if (!brand) {
                                    brand = await tx.brand.create({
                                        data: { name: selection.importData.brand },
                                    });
                                }
                                const newCigar = await tx.cigar.create({
                                    data: {
                                        name: selection.importData.name,
                                        brandId: brand.id,
                                        length: selection.importData.length || null,
                                        ringGauge: selection.importData.ringGauge || null,
                                        wrapper: selection.importData.wrapper || null,
                                        binder: selection.importData.binder || null,
                                        filler: selection.importData.filler || null,
                                        country: selection.importData.country || null,
                                        color: selection.importData.color || null,
                                        strength: selection.importData.strength || null,
                                    },
                                });
                                cigarId = newCigar.id;
                                result.created++;
                                break;
                            default:
                                throw new import_1.ValidationError("Invalid match type");
                        }
                        if (selection.addToHumidor && selection.humidorId) {
                            const humidor = await tx.humidor.findUnique({
                                where: {
                                    id: selection.humidorId,
                                    userId: userId,
                                },
                            });
                            if (!humidor) {
                                throw new import_1.ValidationError("Invalid humidor selection");
                            }
                            const parseDate = (dateString) => {
                                if (!dateString)
                                    return null;
                                if (dateString instanceof Date)
                                    return dateString;
                                const date = new Date(dateString);
                                return isNaN(date.getTime()) ? null : date;
                            };
                            const existingEntry = await tx.humidorCigar.findFirst({
                                where: {
                                    humidorId: selection.humidorId,
                                    cigarId: cigarId,
                                },
                            });
                            const humidorData = selection.humidorData || {};
                            const parsedPurchaseDate = parseDate(humidorData.purchaseDate);
                            if (existingEntry) {
                                await tx.humidorCigar.update({
                                    where: { id: existingEntry.id },
                                    data: {
                                        quantity: existingEntry.quantity + (humidorData.quantity || 1),
                                        purchasePrice: (_a = humidorData.purchasePrice) !== null && _a !== void 0 ? _a : existingEntry.purchasePrice,
                                        purchaseDate: parsedPurchaseDate !== null && parsedPurchaseDate !== void 0 ? parsedPurchaseDate : existingEntry.purchaseDate,
                                        purchaseLocation: (_b = humidorData.purchaseLocation) !== null && _b !== void 0 ? _b : existingEntry.purchaseLocation,
                                        notes: (_c = humidorData.notes) !== null && _c !== void 0 ? _c : existingEntry.notes,
                                        imageUrl: (_d = humidorData.imageUrl) !== null && _d !== void 0 ? _d : existingEntry.imageUrl,
                                    },
                                });
                            }
                            else {
                                await tx.humidorCigar.create({
                                    data: {
                                        humidorId: selection.humidorId,
                                        cigarId: cigarId,
                                        quantity: humidorData.quantity || 1,
                                        purchasePrice: humidorData.purchasePrice || 0,
                                        purchaseDate: parsedPurchaseDate || new Date(),
                                        purchaseLocation: humidorData.purchaseLocation || null,
                                        notes: humidorData.notes || null,
                                        imageUrl: humidorData.imageUrl || null,
                                    },
                                });
                            }
                            result.addedToHumidor++;
                        }
                    }
                    catch (error) {
                        const errorMessage = selection.matchType === "new"
                            ? `Error processing ${selection.importData.brand} ${selection.importData.name}`
                            : `Error processing cigar ID ${selection.selectedCigarId}`;
                        result.errors.push(`${errorMessage}: ${error instanceof Error ? error.message : "Unknown error"}`);
                    }
                }
            });
            result.success = result.errors.length === 0;
            return result;
        }
        catch (error) {
            console.error("Import confirmation error:", error);
            throw new import_1.ProcessingError(error instanceof Error
                ? error.message
                : "Failed to process import confirmation");
        }
    }
}
exports.ImportService = ImportService;
//# sourceMappingURL=import.service.js.map