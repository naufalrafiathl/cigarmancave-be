"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CigarInsightsService = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../errors");
const openai_1 = __importDefault(require("openai"));
const prisma = new client_1.PrismaClient();
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
function isCigarInsights(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'history' in value &&
        'blend' in value &&
        'notes' in value &&
        typeof value.history === 'string' &&
        typeof value.blend === 'string' &&
        typeof value.notes === 'string');
}
class CigarInsightsService {
    async getOrCreateInsights(cigarId, userId) {
        var _a, _b;
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { isPremium: true }
            });
            if (!user) {
                throw new errors_1.UnauthorizedError('User not found');
            }
            if (!user.isPremium) {
                throw new errors_1.UnauthorizedError('This feature is only available for premium users');
            }
            const cigar = await prisma.cigar.findUnique({
                where: { id: cigarId },
                select: {
                    id: true,
                    name: true,
                    premiumAssistantMessage: true
                }
            });
            if (!cigar) {
                throw new errors_1.BadRequestError('Cigar not found');
            }
            if (cigar.premiumAssistantMessage) {
                const existingInsights = cigar.premiumAssistantMessage;
                if (isCigarInsights(existingInsights)) {
                    return existingInsights;
                }
            }
            const completion = await openai.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a cigar expert. Provide responses in valid JSON format only."
                    },
                    {
                        role: "user",
                        content: `Provide insights about the "${cigar.name}" cigar in this exact JSON format. Do not include any text outside of the JSON object:
{
  "history": "2-3 sentences about the brand and cigar history",
  "blend": "2-3 sentences about the cigar's construction, wrapper, and origin",
  "notes": "2-3 sentences about expected flavor profile and smoking experience"
}`
                    }
                ],
                model: "gpt-3.5-turbo",
                temperature: 0.7
            });
            const content = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
            if (!content) {
                throw new Error('No response from OpenAI');
            }
            let parsedJson;
            try {
                parsedJson = JSON.parse(content.trim());
            }
            catch (error) {
                console.error('Failed to parse OpenAI response:', content);
                throw new Error('Invalid JSON response from OpenAI');
            }
            if (!isCigarInsights(parsedJson)) {
                console.error('Invalid response structure:', parsedJson);
                throw new Error('Invalid response structure from OpenAI');
            }
            const insightsForPrisma = {
                history: parsedJson.history,
                blend: parsedJson.blend,
                notes: parsedJson.notes
            };
            await prisma.cigar.update({
                where: { id: cigarId },
                data: {
                    premiumAssistantMessage: insightsForPrisma
                }
            });
            return insightsForPrisma;
        }
        catch (error) {
            console.error('Error in getOrCreateInsights:', error);
            throw error;
        }
    }
}
exports.CigarInsightsService = CigarInsightsService;
//# sourceMappingURL=cigar-insights.service.js.map