"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportController = void 0;
const import_service_1 = require("../services/import.service");
const multer_1 = __importDefault(require("multer"));
const import_1 = require("../types/import");
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "text/csv",
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Invalid file type. Supported formats: JPEG, PNG, WebP, Excel, CSV"));
        }
    },
});
class ImportController {
    constructor() {
        this.uploadMiddleware = upload.single("file");
        this.getQuota = async (req, res, next) => {
            var _a;
            try {
                if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                    res.status(401).json({
                        status: "error",
                        error: "Unauthorized",
                    });
                    return;
                }
                const quota = await this.importService.getUserQuota(req.user.id);
                res.json({
                    status: "success",
                    data: quota,
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.processImport = async (req, res, next) => {
            var _a;
            try {
                if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                    res.status(401).json({
                        status: "error",
                        error: "Unauthorized",
                    });
                    return;
                }
                if (!req.file) {
                    res.status(400).json({
                        status: "error",
                        error: "No file provided",
                    });
                    return;
                }
                const fileType = this.determineFileType(req.file.mimetype);
                const result = await this.importService.processImport(req.user.id, req.file, fileType);
                if (result.success && result.data) {
                    const matches = await this.importService.findMatches(result.data);
                    res.json({
                        status: "success",
                        data: {
                            processingResult: result,
                            matches,
                            cost: result.cost,
                            duration: `${result.duration}ms`,
                        },
                    });
                }
                else {
                    res.status(422).json({
                        status: "error",
                        error: result.error || "Processing failed",
                        details: {
                            method: result.method,
                            confidence: result.confidence,
                            cost: result.cost,
                            duration: `${result.duration}ms`,
                        },
                    });
                }
            }
            catch (error) {
                if (error instanceof import_1.QuotaExceededError) {
                    res.status(402).json({
                        status: "error",
                        error: error.message,
                        code: "QUOTA_EXCEEDED",
                    });
                }
                else if (error instanceof import_1.ValidationError) {
                    res.status(400).json({
                        status: "error",
                        error: error.message,
                        code: "VALIDATION_ERROR",
                    });
                }
                else if (error instanceof import_1.ProcessingError) {
                    res.status(422).json({
                        status: "error",
                        error: error.message,
                        code: "PROCESSING_ERROR",
                    });
                }
                else if (error instanceof multer_1.default.MulterError) {
                    res.status(400).json({
                        status: "error",
                        error: this.getMulterErrorMessage(error),
                        code: "FILE_UPLOAD_ERROR",
                    });
                }
                else {
                    next(error);
                }
            }
        };
        this.confirmImport = async (req, res, next) => {
            var _a, _b, _c;
            try {
                if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                    res.status(401).json({
                        status: 'error',
                        error: 'Unauthorized'
                    });
                    return;
                }
                const { selections } = req.body;
                if (!selections || !Array.isArray(selections)) {
                    res.status(400).json({
                        status: 'error',
                        error: 'Invalid selections data',
                        code: 'VALIDATION_ERROR'
                    });
                    return;
                }
                for (const selection of selections) {
                    if (!selection.matchType) {
                        res.status(400).json({
                            status: 'error',
                            error: 'Match type is required for all selections',
                            code: 'VALIDATION_ERROR'
                        });
                        return;
                    }
                    switch (selection.matchType) {
                        case 'exact':
                        case 'possible':
                            if (!selection.selectedCigarId) {
                                res.status(400).json({
                                    status: 'error',
                                    error: `Selected cigar ID is required for ${selection.matchType} matches`,
                                    code: 'VALIDATION_ERROR'
                                });
                                return;
                            }
                            break;
                        case 'new':
                            if (!((_b = selection.importData) === null || _b === void 0 ? void 0 : _b.brand) || !((_c = selection.importData) === null || _c === void 0 ? void 0 : _c.name)) {
                                res.status(400).json({
                                    status: 'error',
                                    error: 'Brand and name are required for new cigars',
                                    code: 'VALIDATION_ERROR'
                                });
                                return;
                            }
                            break;
                        default:
                            res.status(400).json({
                                status: 'error',
                                error: 'Invalid match type',
                                code: 'VALIDATION_ERROR'
                            });
                            return;
                    }
                    if (selection.addToHumidor) {
                        if (!selection.humidorId) {
                            res.status(400).json({
                                status: 'error',
                                error: 'Humidor ID is required when adding to humidor',
                                code: 'VALIDATION_ERROR'
                            });
                            return;
                        }
                    }
                }
                const result = await this.importService.confirmImport(req.user.id, selections);
                if (result.success) {
                    res.json({
                        status: 'success',
                        data: {
                            created: result.created,
                            matched: result.matched,
                            addedToHumidor: result.addedToHumidor,
                            errors: result.errors,
                        },
                    });
                }
                else {
                    res.status(422).json({
                        status: 'error',
                        error: 'Some imports failed',
                        details: result.errors,
                        data: {
                            created: result.created,
                            matched: result.matched,
                            addedToHumidor: result.addedToHumidor,
                        },
                    });
                }
            }
            catch (error) {
                if (error instanceof import_1.ValidationError) {
                    res.status(400).json({
                        status: 'error',
                        error: error.message,
                        code: 'VALIDATION_ERROR'
                    });
                }
                else if (error instanceof import_1.ProcessingError) {
                    res.status(422).json({
                        status: 'error',
                        error: error.message,
                        code: 'PROCESSING_ERROR'
                    });
                }
                else {
                    next(error);
                }
            }
        };
        this.importService = new import_service_1.ImportService();
    }
    determineFileType(mimetype) {
        if (mimetype.startsWith("image/")) {
            return import_1.ImportFileType.IMAGE;
        }
        if (mimetype === "application/pdf") {
            return import_1.ImportFileType.PDF;
        }
        return import_1.ImportFileType.SPREADSHEET;
    }
    getMulterErrorMessage(error) {
        switch (error.code) {
            case "LIMIT_FILE_SIZE":
                return "File size exceeds the 10MB limit";
            case "LIMIT_UNEXPECTED_FILE":
                return "Unexpected field name in form data";
            case "LIMIT_FILE_COUNT":
                return "Too many files uploaded";
            default:
                return error.message;
        }
    }
}
exports.ImportController = ImportController;
//# sourceMappingURL=import.controller.js.map