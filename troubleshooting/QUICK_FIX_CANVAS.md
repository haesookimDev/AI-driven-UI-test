# ⚡ Canvas Locator 빠른 수정 가이드

## 🎯 문제
React Flow를 사용하지 않는데 React Flow 기반 locator를 사용 중

## ✅ 해결 단계

### 1️⃣ 실제 DOM 구조 확인

```bash
npx playwright test tests/e2e/specs/debug/inspect-canvas.spec.ts --headed
```

**확인할 파일:**
- 콘솔 출력 (Canvas 관련 요소 리스트)
- `test-results/canvas-dom-structure.png` (스크린샷)
- `test-results/canvas-dom-structure.html` (HTML 구조)

### 2️⃣ CanvasPage.ts 수정

**[tests/e2e/pages/CanvasPage.ts](tests/e2e/pages/CanvasPage.ts:22)** 파일에서:

```typescript
// ❌ 기존 (React Flow 가정)
this.canvas = page.locator('[data-testid="react-flow-canvas"]');

// ✅ 수정 (실제 DOM에 맞게)
this.canvas = page.locator('canvas'); // 또는 실제 선택자
```

**[tests/e2e/pages/CanvasPage.ts](tests/e2e/pages/CanvasPage.ts:159)** 파일에서:

```typescript
// ❌ 기존
const nodes = await this.page.locator('.react-flow__node').count();

// ✅ 수정 (실제 노드 선택자로)
const nodes = await this.page.locator('.node').count(); // 또는 실제 선택자
```

### 3️⃣ 테스트 실행

```bash
npx playwright test tests/e2e/specs/canvas/canvas-basic.spec.ts --headed
```

---

## 🔍 일반적인 선택자 패턴

Debug 테스트 결과에 따라 다음 중 하나를 사용:

### Canvas 메인 영역
```typescript
// HTML Canvas
this.canvas = page.locator('canvas');
this.canvas = page.locator('canvas#main-canvas');

// SVG Canvas
this.canvas = page.locator('svg.workflow-canvas');

// DIV Canvas
this.canvas = page.locator('.canvas-container');
this.canvas = page.locator('[role="application"]');
```

### 노드 개수 확인
```typescript
// 클래스 기반
const nodes = await this.page.locator('.node').count();
const nodes = await this.page.locator('.workflow-node').count();

// Data 속성 기반
const nodes = await this.page.locator('[data-type="node"]').count();
const nodes = await this.page.locator('[data-node-id]').count();

// SVG 기반
const nodes = await this.page.locator('svg g[data-node-type]').count();
```

---

## 🛡️ 안전한 방법: 셀프힐링 사용

정확한 선택자를 모르면 여러 fallback 제공:

```typescript
async getNodeCount(): Promise<number> {
  const nodeLocator = await selfHealingLocator.find(this.page, {
    original: '.node',
    description: '워크플로우 노드',
    fallbacks: [
      '.workflow-node',
      '[data-type="node"]',
      '[data-node-id]',
      'g[data-node-type]',
      '[class*="node"]',
    ],
  });

  return await nodeLocator.count();
}
```

---

## 📝 예시: 전체 수정

```typescript
// tests/e2e/pages/CanvasPage.ts

constructor(page: Page) {
  this.page = page;

  // Debug 테스트 결과를 바탕으로 수정
  this.canvas = page.locator('canvas#xgen-canvas'); // ✅ 실제 선택자
  this.sideMenu = page.locator('.node-palette');
  this.header = page.locator('header');

  this.saveButton = page.locator('button:has-text("저장")');
  this.executeButton = page.locator('button:has-text("실행")');
}

async goto() {
  await this.page.goto('/canvas');
  await this.canvas.waitFor({ timeout: 10000 });
}

async getNodeCount(): Promise<number> {
  // ✅ 실제 노드 클래스
  const nodes = await this.page.locator('.xgen-node').count();
  return nodes;
}
```

---

## 🚀 빠른 실행 명령

```bash
# 1. DOM 구조 확인
npx playwright test tests/e2e/specs/debug/inspect-canvas.spec.ts --headed

# 2. CanvasPage.ts 수정 (위 내용 참고)

# 3. 테스트 실행
npx playwright test tests/e2e/specs/canvas/canvas-basic.spec.ts --headed
```

---

## 📖 상세 가이드

전체 설명은 [CANVAS_LOCATOR_FIX.md](CANVAS_LOCATOR_FIX.md)를 참고하세요.

**성공!** 🚀
