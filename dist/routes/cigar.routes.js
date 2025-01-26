"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cigar_controller_1 = require("../controllers/cigar.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const cigarController = new cigar_controller_1.CigarController();
router.get('/search', auth_middleware_1.authenticate, cigarController.search.bind(cigarController));
router.get('/:id', cigarController.getCigar.bind(cigarController));
router.post('/', auth_middleware_1.authenticate, cigarController.createCigar.bind(cigarController));
exports.default = router;
//# sourceMappingURL=cigar.routes.js.map