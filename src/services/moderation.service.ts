import OpenAI from 'openai';
import { BadRequestError } from '../errors';
import { AppError } from '../errors/base.error';


type ModerationInput = {
  type: 'text';
  text: string;
} | {
  type: 'image_url';
  image_url: {
    url: string;
  };
};

interface ModerationCategories {
  sexual: boolean;
  'sexual/minors': boolean;
  harassment: boolean;
  'harassment/threatening': boolean;
  hate: boolean;
  'hate/threatening': boolean;
  illicit: boolean;
  'illicit/violent': boolean;
  'self-harm': boolean;
  'self-harm/intent': boolean;
  'self-harm/instructions': boolean;
  violence: boolean;
  'violence/graphic': boolean;
}

interface ModerationCategoryScores {
  sexual: number;
  'sexual/minors': number;
  harassment: number;
  'harassment/threatening': number;
  hate: number;
  'hate/threatening': number;
  illicit: number;
  'illicit/violent': number;
  'self-harm': number;
  'self-harm/intent': number;
  'self-harm/instructions': number;
  violence: number;
  'violence/graphic': number;
}

interface ModerationViolation {
    contentType: 'text' | 'image';
    flaggedCategories: {
      category: string;
      score: number;
      appliedInputTypes: string[];
    }[];
    originalContent: string;
  }

export class ModerationError extends AppError  {
    public violations: ModerationViolation[];
    public moderationId: string;
  constructor(
    message: string,
    violations: ModerationViolation[],
    moderationId: string
  ) {
    super(message, 400); // Use 400 Bad Request for moderation failures
    this.violations = violations;
    this.moderationId = moderationId;
  }
}

export class ModerationService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private async moderateContent(inputs: ModerationInput[]): Promise<void> {
    try {
      const moderationResponse = await this.openai.moderations.create({
        model: "omni-moderation-latest",
        input: inputs,
      });

      const violations: ModerationViolation[] = [];

      moderationResponse.results.forEach((result, index) => {
        if (result.flagged) {
          const input = inputs[index];
          const flaggedCategories = Object.entries(result.categories)
            .filter(([_, value]) => value)
            .map(([category]) => ({
              category,
              score: result.category_scores[category as keyof ModerationCategoryScores],
              appliedInputTypes: result.category_applied_input_types[category as keyof ModerationCategories] || []
            }));

          violations.push({
            contentType: input.type === 'text' ? 'text' : 'image',
            flaggedCategories,
            originalContent: input.type === 'text' ? input.text : input.image_url.url,
          });
        }
      });

      if (violations.length > 0) {
        throw new ModerationError(
          'Content violates community guidelines',
          violations,
          moderationResponse.id
        );
      }
    } catch (error) {
      if (error instanceof ModerationError) {
        throw error;
      }
      throw new BadRequestError('Content moderation failed');
    }
  }

  async validateContent({
    text,
    imageUrls,
  }: {
    text?: string;
    imageUrls?: string[];
  }): Promise<void> {
    const moderationInputs: ModerationInput[] = [];

    if (text) {
      moderationInputs.push({
        type: 'text',
        text,
      });
    }

    if (imageUrls?.length) {
      moderationInputs.push(
        ...imageUrls.map((url) => ({
          type: 'image_url' as const,
          image_url: { url },
        }))
      );
    }

    if (moderationInputs.length > 0) {
      await this.moderateContent(moderationInputs);
    }
  }
}