// src/services/cigar-insights.service.ts
import { PrismaClient, Prisma } from '@prisma/client';
import { BadRequestError, UnauthorizedError } from '../errors';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface CigarInsights {
  history: string;
  blend: string;
  notes: string;
}

function isCigarInsights(value: unknown): value is CigarInsights {
  return (
    typeof value === 'object' &&
    value !== null &&
    'history' in value &&
    'blend' in value &&
    'notes' in value &&
    typeof (value as CigarInsights).history === 'string' &&
    typeof (value as CigarInsights).blend === 'string' &&
    typeof (value as CigarInsights).notes === 'string'
  );
}

export class CigarInsightsService {
  async getOrCreateInsights(cigarId: number, userId: number): Promise<CigarInsights> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPremium: true }
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      if (!user.isPremium) {
        throw new UnauthorizedError('This feature is only available for premium users');
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
        throw new BadRequestError('Cigar not found');
      }

      // Check existing insights
      if (cigar.premiumAssistantMessage) {
        const existingInsights = cigar.premiumAssistantMessage as unknown;
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

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(content.trim());
      } catch (error) {
        console.error('Failed to parse OpenAI response:', content);
        throw new Error('Invalid JSON response from OpenAI');
      }

      if (!isCigarInsights(parsedJson)) {
        console.error('Invalid response structure:', parsedJson);
        throw new Error('Invalid response structure from OpenAI');
      }

      // Create a strongly typed object for Prisma
      const insightsForPrisma = {
        history: parsedJson.history,
        blend: parsedJson.blend,
        notes: parsedJson.notes
      } satisfies CigarInsights;

      await prisma.cigar.update({
        where: { id: cigarId },
        data: {
          premiumAssistantMessage: insightsForPrisma as Prisma.JsonObject
        }
      });

      return insightsForPrisma;
    } catch (error) {
      console.error('Error in getOrCreateInsights:', error);
      throw error;
    }
  }
}