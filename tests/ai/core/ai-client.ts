import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { AIConfig } from '../../config/ai.config';

export class AIClient {
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async generateText(prompt: string, usePrimary = true): Promise<string> {
    const config = usePrimary ? AIConfig.primaryModel : AIConfig.fallbackModel;

    try {
      if (config.provider === 'anthropic' && this.anthropic) {
        const message = await this.anthropic.messages.create({
          model: config.model,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          messages: [{ role: 'user', content: prompt }],
        });

        const textBlock = message.content.find(block => block.type === 'text');
        return textBlock?.type === 'text' ? textBlock.text : '';
      } else if (config.provider === 'openai' && this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: config.model,
          max_completion_tokens: config.maxTokens,
          temperature: config.temperature,
          messages: [{ role: 'user', content: prompt }],
        });

        return completion.choices[0]?.message?.content || '';
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      // 폴백 시도
      if (usePrimary) {
        console.log('Falling back to secondary model...');
        return this.generateText(prompt, false);
      }
      throw error;
    }

    throw new Error('No AI provider available');
  }

  async analyzeImage(imageBase64: string, prompt: string, useFallback = false): Promise<string> {
    // 2차: OpenAI (GPT-4V) 폴백
    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: AIConfig.fallbackModel.model,
          max_completion_tokens: 2000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${imageBase64}`,
                },
              },
              { type: 'text', text: prompt },
            ],
          }],
        });

        return response.choices[0]?.message?.content || '';
      } catch (error) {
        console.error('OpenAI 이미지 분석도 실패:', error);
        throw error;
      }
    }
    // 1차: Anthropic (Claude) 시도
    // if (this.anthropic && !useFallback) {
    //   try {
    //     const message = await this.anthropic.messages.create({
    //       model: AIConfig.primaryModel.model,
    //       max_tokens: 2000,
    //       messages: [{
    //         role: 'user',
    //         content: [
    //           {
    //             type: 'image',
    //             source: {
    //               type: 'base64',
    //               media_type: 'image/png',
    //               data: imageBase64,
    //             },
    //           },
    //           { type: 'text', text: prompt },
    //         ],
    //       }],
    //     });

    //     const textBlock = message.content.find(block => block.type === 'text');
    //     return textBlock?.type === 'text' ? textBlock.text : '';
    //   } catch (error) {
    //     console.warn('Anthropic 이미지 분석 실패, 폴백 시도:', error);
    //     return this.analyzeImage(imageBase64, prompt, true);
    //   }
    // }

    

    throw new Error('이미지 분석 가능한 AI 제공자가 없습니다');
  }

  /**
   * AI 제공자가 사용 가능한지 확인
   */
  isAvailable(): boolean {
    return this.anthropic !== null || this.openai !== null;
  }

  /**
   * 사용 중인 AI 제공자 정보 반환
   */
  getProviderInfo(): { primary: string | null; fallback: string | null } {
    return {
      primary: this.anthropic ? 'anthropic' : null,
      fallback: this.openai ? 'openai' : null,
    };
  }
}

// 싱글톤 인스턴스
export const aiClient = new AIClient();
