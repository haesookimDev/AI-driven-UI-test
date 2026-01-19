import { aiClient } from './ai-client';
import { testGenerationPrompt, bugReportPrompt } from '../models/prompts/test-generation';

export class AITestGenerator {
  async generateTest(description: string, context?: {
    pageUrl?: string;
    pageHtml?: string;
    existingTests?: string[];
  }): Promise<string> {
    if (!aiClient.isAvailable()) {
      throw new Error('AI client is not available. Please configure API keys.');
    }

    const prompt = testGenerationPrompt({
      description,
      pageUrl: context?.pageUrl,
      pageHtml: context?.pageHtml,
      existingTests: context?.existingTests,
    });

    const testCode = await aiClient.generateText(prompt);

    // 생성된 코드 검증 및 정제
    return this.cleanupGeneratedCode(testCode);
  }

  async generateFromBugReport(
    issueNumber: string,
    issueDescription: string
  ): Promise<string> {
    if (!aiClient.isAvailable()) {
      throw new Error('AI client is not available. Please configure API keys.');
    }

    const prompt = bugReportPrompt(issueNumber, issueDescription);
    const testCode = await aiClient.generateText(prompt);

    return this.cleanupGeneratedCode(testCode);
  }

  private cleanupGeneratedCode(code: string): string {
    // 코드 블록 마크다운 제거
    let cleaned = code.replace(/```typescript\n?/g, '').replace(/```\n?/g, '');

    // 불필요한 주석 제거
    cleaned = cleaned.replace(/\/\/ AI generated.*\n/g, '');

    return cleaned.trim();
  }

  /**
   * 생성된 테스트 코드를 파일로 저장
   */
  async saveGeneratedTest(code: string, fileName: string, directory: string = './tests/e2e/specs/generated'): Promise<void> {
    const fs = require('fs');
    const path = require('path');

    // 디렉토리 생성
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    const filePath = path.join(directory, fileName);
    fs.writeFileSync(filePath, code, 'utf-8');

    console.log(`✅ Test saved: ${filePath}`);
  }
}

export const testGenerator = new AITestGenerator();
