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
    super(message, 400); 
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
        console.log('Starting content moderation for:', inputs);
  
        const violations: ModerationViolation[] = [];
        let moderationId: string = '';
  
        // Process inputs in batches: text content together, images one by one
        const textInputs = inputs.filter(input => input.type === 'text');
        const imageInputs = inputs.filter(input => input.type === 'image_url');
  
        // Process text inputs (if any)
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
  
        // Process image inputs one by one
        for (const imageInput of imageInputs) {
          const imageModerationResponse = await this.openai.moderations.create({
            model: "omni-moderation-latest",
            input: [imageInput],
          });
          moderationId = imageModerationResponse.id; // Update with latest ID
  
          this.processModeratedContent(imageModerationResponse.results[0], imageInput, violations);
        }
  
        if (violations.length > 0) {
          console.log('\n❌ Moderation failed with violations:');
          console.log(JSON.stringify(violations, null, 2));
          
          throw new ModerationError(
            'Content violates community guidelines',
            violations,
            moderationId
          );
        } else {
          console.log('\n✅ Content passed moderation');
        }
  
      } catch (error) {
        console.error('\n⚠️ Moderation error:', error);
        
        if (error instanceof ModerationError) {
          throw error;
        }
        throw new BadRequestError(
          error instanceof Error ? error.message : 'Content moderation failed'
        );
      }
    }
  
    private processModeratedContent(
      result: any,
      input: ModerationInput,
      violations: ModerationViolation[]
    ) {
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
            const score = result.category_scores[category as keyof ModerationCategoryScores];
            const appliedTypes = result.category_applied_input_types[category as keyof ModerationCategories] || [];
            
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
  
    async validateContent({
      text,
      imageUrls,
    }: {
      text?: string;
      imageUrls?: string[];
    }): Promise<void> {
      console.log('\n🔍 Starting content validation');
      console.log('Text:', text);
      console.log('Image URLs:', imageUrls);
  
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
      } else {
        console.log('No content to moderate');
      }
    }
  }