#!/usr/bin/env node

/**
 * 설치 및 설정 검증 스크립트
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 XGEN AI E2E 테스트 프레임워크 설정 검증\n');

let hasErrors = false;

// 1. 필수 파일 확인
console.log('📁 필수 파일 확인...');
const requiredFiles = [
  'package.json',
  'playwright.config.ts',
  'tsconfig.json',
  '.env.test',
  'tests/ai/core/ai-client.ts',
  'tests/ai/core/self-healing.ts',
  'tests/ai/core/test-generator.ts',
  'tests/e2e/pages/LoginPage.ts',
  'tests/e2e/pages/CanvasPage.ts',
  'tests/e2e/specs/auth/login.spec.ts',
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) hasErrors = true;
});

// 2. node_modules 확인
console.log('\n📦 패키지 설치 확인...');
const hasNodeModules = fs.existsSync('node_modules');
console.log(`  ${hasNodeModules ? '✅' : '❌'} node_modules 디렉토리`);
if (!hasNodeModules) {
  console.log('  ⚠️  npm install을 실행하세요');
  hasErrors = true;
}

// 3. 환경 변수 확인
console.log('\n🔑 환경 변수 확인...');
if (fs.existsSync('.env.test')) {
  const envContent = fs.readFileSync('.env.test', 'utf-8');

  const checks = {
    'ANTHROPIC_API_KEY': envContent.includes('ANTHROPIC_API_KEY=') && !envContent.includes('your-anthropic-api-key-here'),
    'TEST_BASE_URL': envContent.includes('TEST_BASE_URL='),
    'TEST_USER_EMAIL': envContent.includes('TEST_USER_EMAIL='),
  };

  Object.entries(checks).forEach(([key, isSet]) => {
    if (isSet) {
      console.log(`  ✅ ${key} 설정됨`);
    } else {
      console.log(`  ⚠️  ${key} 설정 필요`);
      if (key === 'ANTHROPIC_API_KEY') {
        console.log('     → https://console.anthropic.com/ 에서 API 키 발급');
      }
    }
  });
} else {
  console.log('  ❌ .env.test 파일이 없습니다');
  hasErrors = true;
}

// 4. TypeScript 컴파일 확인
console.log('\n🔨 TypeScript 설정 확인...');
try {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
  console.log(`  ✅ tsconfig.json 파싱 성공`);
  console.log(`  ✅ Target: ${tsconfig.compilerOptions.target}`);
} catch (error) {
  console.log('  ❌ tsconfig.json 파싱 실패');
  hasErrors = true;
}

// 5. Playwright 설정 확인
console.log('\n🎭 Playwright 설정 확인...');
if (fs.existsSync('playwright.config.ts')) {
  console.log('  ✅ playwright.config.ts 존재');

  // Playwright 브라우저 확인
  const playwrightPath = path.join(
    process.env.LOCALAPPDATA || process.env.HOME,
    'ms-playwright'
  );

  if (fs.existsSync(playwrightPath)) {
    console.log('  ✅ Playwright 브라우저 설치됨');
  } else {
    console.log('  ⚠️  Playwright 브라우저 설치 필요');
    console.log('     → npx playwright install 실행');
  }
} else {
  console.log('  ❌ playwright.config.ts 없음');
  hasErrors = true;
}

// 6. 디렉토리 구조 확인
console.log('\n📂 디렉토리 구조 확인...');
const requiredDirs = [
  'tests/e2e/specs/auth',
  'tests/e2e/specs/canvas',
  'tests/e2e/pages',
  'tests/ai/core',
  'tests/ai/models/prompts',
  'tests/config',
];

requiredDirs.forEach(dir => {
  const exists = fs.existsSync(dir);
  console.log(`  ${exists ? '✅' : '❌'} ${dir}`);
  if (!exists) hasErrors = true;
});

// 최종 결과
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('❌ 일부 설정이 완료되지 않았습니다.');
  console.log('\n다음을 확인하세요:');
  console.log('1. npm install 실행');
  console.log('2. npx playwright install 실행');
  console.log('3. .env.test 파일 설정');
  process.exit(1);
} else {
  console.log('✅ 모든 설정이 완료되었습니다!');
  console.log('\n다음 단계:');
  console.log('1. .env.test에서 API 키 설정');
  console.log('2. npm run test:e2e:ui 로 테스트 실행');
  console.log('3. QUICK_START.md 문서 참조');
  process.exit(0);
}
