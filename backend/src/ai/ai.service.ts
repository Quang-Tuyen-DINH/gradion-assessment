import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ExpenseCategory } from '../common/enums/expense-category.enum';

const VALID_CATEGORIES = Object.values(ExpenseCategory);

@Injectable()
export class AiService {
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  private sanitize(input: string): string {
    // Strip non-printable/control characters, then truncate to 200 chars
    return input.replace(/[^\x20-\x7E]/g, '').slice(0, 200);
  }

  async suggestCategory(merchantName: string): Promise<{ category: string }> {
    const safe = this.sanitize(merchantName);
    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      messages: [{
        role: 'user',
        content: `Classify the expense category for merchant: "${safe}". Reply with exactly one word from: ${VALID_CATEGORIES.join(', ')}. No explanation.`,
      }],
    });
    const raw = (response.content[0] as { type: string; text: string }).text?.trim().toUpperCase();
    const category = VALID_CATEGORIES.includes(raw as ExpenseCategory) ? raw : ExpenseCategory.OTHER;
    return { category };
  }
}
