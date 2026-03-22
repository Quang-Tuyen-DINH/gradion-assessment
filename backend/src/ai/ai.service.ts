import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ExpenseCategory } from '../common/enums/expense-category.enum';

const VALID_CATEGORIES = Object.values(ExpenseCategory);

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  private sanitize(input: string): string {
    return input.replace(/[^\x20-\x7E]/g, '').slice(0, 200);
  }

  async suggestCategory(merchantName: string): Promise<{ category: string }> {
    const safe = this.sanitize(merchantName);
    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 20,
        messages: [{
          role: 'user',
          content: `Classify the expense category for merchant: "${safe}". Reply with exactly one of the following values: ${VALID_CATEGORIES.join(', ')}. No explanation.`,
        }],
      });
    } catch (err) {
      this.logger.error('Anthropic API call failed', err);
      throw new InternalServerErrorException('AI service unavailable');
    }

    const firstBlock = response.content[0];
    const raw = firstBlock?.type === 'text'
      ? firstBlock.text.trim().toUpperCase()
      : '';
    const category = VALID_CATEGORIES.includes(raw as ExpenseCategory)
      ? raw
      : ExpenseCategory.OTHER;
    return { category };
  }
}
