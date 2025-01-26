"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = isAuthenticated;
exports.hasFile = hasFile;
function isAuthenticated(req) {
    return req.user !== undefined;
}
function hasFile(req) {
    return 'file' in req && req.file !== undefined;
}
//# sourceMappingURL=auth.js.map