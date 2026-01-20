import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// 테스트 환경변수 로드
dotenv.config({ path: '.env.test' });

export default defineConfig({
  // 테스트 디렉토리
  testDir: './tests/e2e/specs',

  // 테스트 파일 패턴
  testMatch: '**/*.spec.ts',

  // 병렬 실행 설정
  // 인증 필요 테스트는 세션 충돌 방지를 위해 직렬 실행
  fullyParallel: false,
  workers: 1, // 동일 계정 세션 제한으로 인해 1개의 worker만 사용

  // 재시도 정책
  retries: process.env.CI ? 2 : 0,

  // 타임아웃
  timeout: parseInt(process.env.TEST_TIMEOUT || '60000'),

  // 글로벌 설정
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',

    // 스크린샷
    screenshot: 'only-on-failure',

    // 비디오
    video: 'retain-on-failure',

    // 트레이스
    trace: 'on-first-retry',

    // 헤드리스 모드
    headless: process.env.TEST_HEADLESS === 'true',

    // 뷰포트
    viewport: { width: 1920, height: 1080 },

    // 내비게이션 타임아웃
    navigationTimeout: 30000,

    // 액션 타임아웃
    actionTimeout: 10000,
  },

  // 브라우저 프로젝트
  // 세션 충돌 방지를 위해 chromium만 사용 (필요시 다른 브라우저 추가)
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // AI 기능 활성화
        contextOptions: {
          recordVideo: process.env.ENABLE_ANOMALY_DETECTION === 'true'
            ? { dir: './test-results/videos' }
            : undefined,
        },
      },
    },
    // 다른 브라우저 테스트는 필요시 활성화
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // 리포터
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
    // AI 분석 리포터는 나중에 추가
  ],

  // 웹서버 (개발 서버 자동 시작) - 실제 XGEN 서버 설정에 맞게 수정
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },
});
