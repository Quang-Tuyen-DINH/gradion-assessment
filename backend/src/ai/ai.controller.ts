import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { IsString, IsNotEmpty } from 'class-validator';

class SuggestCategoryDto {
  @IsNotEmpty()
  @IsString()
  merchantName: string;
}

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('suggest-category')
  suggest(@Body() dto: SuggestCategoryDto) {
    return this.ai.suggestCategory(dto.merchantName);
  }
}
