"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../config/auth");
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => {
    res.json({
        status: 'OK',
        message: 'Auth service is running',
        timestamp: new Date().toISOString()
    });
});
router.get('/protected', auth_1.validateAuth0Token, (req, res) => {
    res.json({
        status: 'OK',
        message: 'You have accessed a protected endpoint',
        user: req.auth,
        timestamp: new Date().toISOString()
    });
});
router.post('/callback', auth_1.validateAuth0Token, async (req, res, next) => {
    console.log('CALLBACK REQUEST tester:', req);
    try {
        await auth_controller_1.AuthController.handleCallback(req, res);
    }
    catch (error) {
        next(error);
    }
});
router.get('/profile', auth_1.validateAuth0Token, async (req, res, next) => {
    try {
        await auth_controller_1.AuthController.getProfile(req, res);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map