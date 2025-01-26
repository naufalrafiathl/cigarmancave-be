"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationService = exports.ModerationError = void 0;
const openai_1 = __importDefault(require("openai"));
const errors_1 = require("../errors");
const base_error_1 = require("../errors/base.error");
class ModerationError extends base_error_1.AppError {
    constructor(message, violations, moderationId) {
        super(message, 400);
        this.violations = violations;
        this.moderationId = moderationId;
    }
}
exports.ModerationError = ModerationError;
class ModerationService {
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async moderateContent(inputs) {
        try {
            console.log('Starting content moderation for:', inputs);
            const violations = [];
            let moderationId = '';
            const textInputs = inputs.filter(input => input.type === 'text');
            const imageInputs = inputs.filter(input => input.type === 'image_url');
            if (textInputs.length > 0) {
                const textModerationResponse = await this.openai.moderations.create({
                    model: "omni-moderation-latest",
                    input: textInputs,
                });
                moderationId = textModerationResponse.id;
                textModerationResponse.results.forEach((result, index) => {
                    this.processModeratedContent(result, textInputs[index], violations);
                });
            }
            for (const imageInput of imageInputs) {
                const imageModerationResponse = await this.openai.moderations.create({
                    model: "omni-moderation-latest",
                    input: [imageInput],
                });
                moderationId = imageModerationResponse.id;
                this.processModeratedContent(imageModerationResponse.results[0], imageInput, violations);
            }
            if (violations.length > 0) {
                console.log('\n❌ Moderation failed with violations:');
                console.log(JSON.stringify(violations, null, 2));
                throw new ModerationError('Content violates community guidelines', violations, moderationId);
            }
            else {
                console.log('\n✅ Content passed moderation');
            }
        }
        catch (error) {
            console.error('\n⚠️ Moderation error:', error);
            if (error instanceof ModerationError) {
                throw error;
            }
            throw new errors_1.BadRequestError(error instanceof Error ? error.message : 'Content moderation failed');
        }
    }
    processModeratedContent(result, input, violations) {
        console.log('\nModeration scores for:', input.type === 'text' ? input.text : input.image_url.url);
        Object.entries(result.category_scores).forEach(([category, score]) => {
            console.log(`${category}: ${(Number(score) * 100).toFixed(2)}%`);
        });
        if (result.flagged) {
            console.log('\n🚨 Content flagged!');
            console.log('Input type:', input.type);
            console.log('Content:', input.type === 'text' ? input.text : input.image_url.url);
            const flaggedCategories = Object.entries(result.categories)
                .filter(([_, value]) => value)
                .map(([category]) => {
                const score = result.category_scores[category];
                const appliedTypes = result.category_applied_input_types[category] || [];
                console.log(`\nViolation category: ${category}`);
                console.log(`Score: ${(score * 100).toFixed(2)}%`);
                console.log('Applied to:', appliedTypes);
                return {
                    category,
                    score,
                    appliedInputTypes: appliedTypes
                };
            });
            violations.push({
                contentType: input.type === 'text' ? 'text' : 'image',
                flaggedCategories,
                originalContent: input.type === 'text' ? input.text : input.image_url.url,
            });
        }
    }
    async validateContent({ text, imageUrls, }) {
        console.log('\n🔍 Starting content validation');
        console.log('Text:', text);
        console.log('Image URLs:', imageUrls);
        const moderationInputs = [];
        if (text) {
            moderationInputs.push({
                type: 'text',
                text,
            });
        }
        if (imageUrls === null || imageUrls === void 0 ? void 0 : imageUrls.length) {
            moderationInputs.push(...imageUrls.map((url) => ({
                type: 'image_url',
                image_url: { url },
            })));
        }
        if (moderationInputs.length > 0) {
            await this.moderateContent(moderationInputs);
        }
        else {
            console.log('No content to moderate');
        }
    }
}
exports.ModerationService = ModerationService;
//# sourceMappingURL=moderation.service.js.map