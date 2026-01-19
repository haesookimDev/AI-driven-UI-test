import { Page, Locator } from '@playwright/test';
import { aiClient } from './ai-client';
import { selectorSuggestionPrompt } from '../models/prompts/test-generation';
import * as fs from 'fs';
import * as path from 'path';

interface SelectorContext {
  original: string;
  description: string;
  fallbacks?: string[];
}

export class SelfHealingLocator {
  private learningDB: Map<string, string[]> = new Map();
  private knowledgeFilePath: string;

  constructor(knowledgeFilePath: string = './tests/data/self-healing-knowledge.json') {
    this.knowledgeFilePath = knowledgeFilePath;
    this.loadKnowledge();
  }

  async find(page: Page, context: SelectorContext): Promise<Locator> {
    // 1. 원본 셀렉터 시도
    try {
      const locator = page.locator(context.original);
      await locator.waitFor({ timeout: 5000 });
      console.log(`[SelfHealing] ✅ 원본 셀렉터 성공: ${context.original}`);
      return locator;
    } catch (error) {
      console.log(`[SelfHealing] ❌ 원본 셀렉터 실패: ${context.original}`);
    }

    // 2. 학습된 셀렉터 시도
    const learned = this.learningDB.get(context.description);
    if (learned) {
      for (const selector of learned) {
        try {
          const locator = page.locator(selector);
          await locator.waitFor({ timeout: 3000 });
          console.log(`[SelfHealing] ✅ 학습된 셀렉터 성공: ${selector}`);
          return locator;
        } catch {
          // 다음 셀렉터 시도
        }
      }
    }

    // 3. 폴백 셀렉터 시도
    if (context.fallbacks) {
      for (const fallback of context.fallbacks) {
        try {
          const locator = page.locator(fallback);
          await locator.waitFor({ timeout: 3000 });
          console.log(`[SelfHealing] ✅ 폴백 셀렉터 성공: ${fallback}`);
          this.learn(context.description, fallback);
          return locator;
        } catch {
          // 다음 폴백 시도
        }
      }
    }

    // 4. AI에게 새 셀렉터 찾도록 요청
    if (aiClient.isAvailable()) {
      const newSelector = await this.aiSuggestSelector(page, context);
      if (newSelector) {
        try {
          const locator = page.locator(newSelector);
          await locator.waitFor({ timeout: 3000 });
          console.log(`[SelfHealing] ✅ AI 제안 셀렉터 성공: ${newSelector}`);
          this.learn(context.description, newSelector);
          return locator;
        } catch (error) {
          console.error(`[SelfHealing] ❌ AI 제안 셀렉터 실패: ${newSelector}`);
        }
      }
    }

    throw new Error(`[SelfHealing] ❌ 모든 시도 실패: ${context.description}`);
  }

  private async aiSuggestSelector(
    page: Page,
    context: SelectorContext
  ): Promise<string | null> {
    try {
      // 페이지 HTML 가져오기
      const html = await page.content();

      const prompt = selectorSuggestionPrompt(
        context.original,
        context.description,
        html
      );

      const suggestion = await aiClient.generateText(prompt);
      const cleanedSelector = suggestion.trim().replace(/[`'"]/g, '');

      console.log(`[SelfHealing] 🤖 AI 제안: ${cleanedSelector}`);
      return cleanedSelector;
    } catch (error) {
      console.error('[SelfHealing] AI 제안 실패:', error);
      return null;
    }
  }

  private learn(description: string, selector: string) {
    const existing = this.learningDB.get(description) || [];
    if (!existing.includes(selector)) {
      existing.unshift(selector); // 최신 것을 앞에
      this.learningDB.set(description, existing.slice(0, 5)); // 최대 5개 저장

      // 자동 저장
      this.saveKnowledge();
    }
  }

  // 학습 데이터 저장
  saveKnowledge() {
    try {
      const data = Object.fromEntries(this.learningDB);
      const dir = path.dirname(this.knowledgeFilePath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.knowledgeFilePath, JSON.stringify(data, null, 2));
      console.log('[SelfHealing] 💾 학습 데이터 저장됨');
    } catch (error) {
      console.error('[SelfHealing] 저장 실패:', error);
    }
  }

  // 학습 데이터 로드
  loadKnowledge() {
    try {
      if (fs.existsSync(this.knowledgeFilePath)) {
        const data = JSON.parse(fs.readFileSync(this.knowledgeFilePath, 'utf-8'));
        this.learningDB = new Map(Object.entries(data));
        console.log('[SelfHealing] 📖 학습 데이터 로드됨');
      }
    } catch (error) {
      console.error('[SelfHealing] 로드 실패:', error);
    }
  }

  // 통계 정보
  getStats() {
    return {
      totalLearned: this.learningDB.size,
      descriptions: Array.from(this.learningDB.keys()),
    };
  }
}

export const selfHealingLocator = new SelfHealingLocator();
