"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessingError = exports.ValidationError = exports.QuotaExceededError = exports.CigarStrength = exports.ProcessingMethod = exports.ImportFileType = void 0;
var ImportFileType;
(function (ImportFileType) {
    ImportFileType["IMAGE"] = "IMAGE";
    ImportFileType["PDF"] = "PDF";
    ImportFileType["SPREADSHEET"] = "SPREADSHEET";
})(ImportFileType || (exports.ImportFileType = ImportFileType = {}));
var ProcessingMethod;
(function (ProcessingMethod) {
    ProcessingMethod["OCR"] = "OCR";
    ProcessingMethod["VISION"] = "VISION";
    ProcessingMethod["DIRECT_PARSE"] = "DIRECT_PARSE";
})(ProcessingMethod || (exports.ProcessingMethod = ProcessingMethod = {}));
var CigarStrength;
(function (CigarStrength) {
    CigarStrength["MILD"] = "MILD";
    CigarStrength["MILD_MEDIUM"] = "MILD_MEDIUM";
    CigarStrength["MEDIUM"] = "MEDIUM";
    CigarStrength["MEDIUM_FULL"] = "MEDIUM_FULL";
    CigarStrength["FULL"] = "FULL";
})(CigarStrength || (exports.CigarStrength = CigarStrength = {}));
class QuotaExceededError extends Error {
    constructor(message) {
        super(message);
        this.name = 'QuotaExceededError';
    }
}
exports.QuotaExceededError = QuotaExceededError;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class ProcessingError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ProcessingError';
    }
}
exports.ProcessingError = ProcessingError;
//# sourceMappingURL=import.js.map