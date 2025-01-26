"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_CONFIG = void 0;
exports.API_CONFIG = {
    baseURL: 'https://cigars.p.rapidapi.com',
    headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'cigars.p.rapidapi.com'
    },
    pagination: {
        BRANDS_PER_PAGE: 20,
        CIGARS_PER_PAGE: 10
    }
};
//# sourceMappingURL=api.config.js.map