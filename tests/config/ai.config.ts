import { z } from 'zod';

export const AIConfig = {
  // 메인 모델
  primaryModel: {
    provider: 'anthropic' as const,
    model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
  },

  // 폴백 모델
  fallbackModel: {
    provider: 'openai' as const,
    model: process.env.AI_MODEL_FALLBACK || 'gpt-4-turbo-preview',
    maxTokens: 4000,
    temperature: 0.3,
  },

  // 기능 토글
  features: {
    testGeneration: process.env.ENABLE_AI_TEST_GENERATION === 'true',
    selfHealing: process.env.ENABLE_SELF_HEALING === 'true',
    visualValidation: process.env.ENABLE_AI_VISUAL_VALIDATION === 'true',
    anomalyDetection: process.env.ENABLE_ANOMALY_DETECTION === 'true',
  },

  // 비주얼 테스팅 설정
  visual: {
    threshold: parseFloat(process.env.VISUAL_DIFF_THRESHOLD || '0.05'),
    updateBaseline: process.env.VISUAL_UPDATE_BASELINE === 'true',
    baselinePath: './tests/data/baselines/screenshots',
  },

  // 성능 설정
  performance: {
    baselineFile: process.env.PERF_BASELINE_FILE || './tests/data/performance-baseline.json',
    alertThreshold: 2.0, // 2배 느려지면 알림
  },
} as const;

// 설정 검증 스키마
export const AIConfigSchema = z.object({
  primaryModel: z.object({
    provider: z.enum(['anthropic', 'openai']),
    model: z.string(),
    maxTokens: z.number().positive(),
    temperature: z.number().min(0).max(1),
  }),
  fallbackModel: z.object({
    provider: z.enum(['anthropic', 'openai']),
    model: z.string(),
    maxTokens: z.number().positive(),
    temperature: z.number().min(0).max(1),
  }),
  features: z.object({
    testGeneration: z.boolean(),
    selfHealing: z.boolean(),
    visualValidation: z.boolean(),
    anomalyDetection: z.boolean(),
  }),
  visual: z.object({
    threshold: z.number().min(0).max(1),
    updateBaseline: z.boolean(),
    baselinePath: z.string(),
  }),
  performance: z.object({
    baselineFile: z.string(),
    alertThreshold: z.number().positive(),
  }),
});

// 타입 추론
export type AIConfigType = typeof AIConfig;

// 설정 검증 함수
export function validateAIConfig(): boolean {
  try {
    AIConfigSchema.parse(AIConfig);
    return true;
  } catch (error) {
    console.error('AI 설정 검증 실패:', error);
    return false;
  }
}
