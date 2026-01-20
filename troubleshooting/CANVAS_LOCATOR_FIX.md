# 🎨 Canvas Locator 수정 가이드

## 📋 문제 상황

현재 CanvasPage.ts에서 **React Flow** 기반의 locator를 사용하고 있지만, 실제 XGEN은 React Flow를 사용하지 않습니다.

### 문제가 되는 Locator

**[tests/e2e/pages/CanvasPage.ts](tests/e2e/pages/CanvasPage.ts)**

```typescript
// Line 22 - Canvas 메인 영역
this.canvas = page.locator('[data-testid="react-flow-canvas"]'); // ❌ react-flow 가정

// Line 159 - 노드 개수 확인
async getNodeCount(): Promise<number> {
  const nodes = await this.page.locator('.react-flow__node').count(); // ❌ react-flow 가정
  return nodes;
}
```

---

## 🔍 Step 1: 실제 DOM 구조 분석

### 1. Debug 테스트 실행

실제 XGEN Canvas의 DOM 구조를 파악하기 위한 테스트를 실행합니다:

```bash
# Canvas DOM 구조 분석 테스트 실행
npx playwright test tests/e2e/specs/debug/inspect-canvas.spec.ts --headed
```

**이 테스트가 수행하는 작업:**
1. Canvas 페이지로 이동 (자동 로그인)
2. 모든 가능한 canvas 관련 선택자 탐색
3. 큰 영역을 차지하는 요소 찾기 (canvas 후보)
4. 노드/버튼 요소 찾기
5. 모든 클래스와 data-* 속성 수집
6. **스크린샷 저장**: `test-results/canvas-dom-structure.png`
7. **HTML 저장**: `test-results/canvas-dom-structure.html`

### 2. 콘솔 출력 확인

테스트 실행 시 콘솔에 다음과 같은 정보가 출력됩니다:

```
🔍 Canvas 페이지 DOM 구조 분석 시작
현재 URL: http://localhost:3000/canvas

=== Canvas 관련 요소 찾기 ===
✅ "canvas" 발견: 1개
   - 태그: CANVAS
   - class: my-canvas-class
   - id: workflow-canvas

✅ "[class*="canvas"]" 발견: 3개
✅ "svg" 발견: 15개

=== 노드/컴포넌트 요소 찾기 ===
✅ "[class*="node"]" 발견: 0개
✅ "button" 발견: 20개

=== 모든 고유 클래스 이름 ===
   - canvas-container
   - workflow-editor
   - node-palette
   ...
```

### 3. 생성된 파일 확인

**test-results/canvas-dom-structure.html** 파일을 브라우저로 열어서 실제 HTML 구조를 확인하세요.

**중요한 요소를 찾아야 합니다:**
- Canvas 메인 영역 (가장 큰 영역)
- 사이드 메뉴/노드 팔레트
- 개별 노드 요소
- 헤더/툴바

---

## 🛠 Step 2: CanvasPage.ts 수정

Debug 테스트 결과를 바탕으로 CanvasPage.ts의 locator를 수정합니다.

### 예시 1: HTML Canvas 사용하는 경우

```typescript
// tests/e2e/pages/CanvasPage.ts

constructor(page: Page) {
  this.page = page;

  // ✅ 실제 XGEN의 구조에 맞게 수정
  this.canvas = page.locator('canvas#workflow-canvas'); // 또는 적절한 선택자
  this.sideMenu = page.locator('.node-palette'); // 또는 aside, nav 등
  this.header = page.locator('header'); // 또는 .toolbar 등

  this.saveButton = page.locator('button:has-text("저장")');
  this.loadButton = page.locator('button:has-text("로드")');
  this.executeButton = page.locator('button:has-text("실행")');
}

async goto() {
  await this.page.goto('/canvas');
  // ✅ 실제 canvas 요소로 대기
  await this.canvas.waitFor({ timeout: 10000 }).catch(() => {
    console.warn('Canvas element not found');
  });
}

async getNodeCount(): Promise<number> {
  // ✅ 실제 노드 선택자로 수정
  // 옵션 1: 특정 클래스 사용
  const nodes = await this.page.locator('.workflow-node').count();

  // 옵션 2: data 속성 사용
  // const nodes = await this.page.locator('[data-type="node"]').count();

  // 옵션 3: 여러 선택자 시도
  // const nodes = await this.page.locator('.node, [data-node-id]').count();

  return nodes;
}
```

### 예시 2: SVG 기반 Canvas 사용하는 경우

```typescript
constructor(page: Page) {
  this.page = page;

  // SVG 기반 canvas
  this.canvas = page.locator('svg.workflow-canvas');

  // SVG 내부 요소
  // this.canvas = page.locator('#canvas-root svg').first();
}

async getNodeCount(): Promise<number> {
  // SVG 내부의 노드 그룹
  const nodes = await this.page.locator('svg g[data-type="node"]').count();
  return nodes;
}
```

### 예시 3: DIV 기반 Canvas 사용하는 경우

```typescript
constructor(page: Page) {
  this.page = page;

  // DIV 기반 canvas
  this.canvas = page.locator('.canvas-container');
  // 또는
  // this.canvas = page.locator('[role="application"]');
}

async getNodeCount(): Promise<number> {
  // DIV 노드들
  const nodes = await this.page.locator('.canvas-container .node-item').count();
  return nodes;
}
```

---

## 📝 Step 3: 셀프힐링 Locator 활용

정확한 선택자를 모르거나 여러 가능성이 있다면, 셀프힐링 기능을 활용하세요:

```typescript
constructor(page: Page) {
  this.page = page;

  // 여러 fallback 선택자 제공
  // this.canvas는 Locator 타입이므로 직접 할당하고
  // goto()에서 셀프힐링 사용
}

async goto() {
  await this.page.goto('/canvas');

  // 셀프힐링으로 canvas 찾기
  const canvas = await selfHealingLocator.find(this.page, {
    original: 'canvas#workflow-canvas',
    description: 'Canvas 메인 영역',
    fallbacks: [
      '[data-testid="canvas"]',
      '.canvas-container',
      '[role="application"]',
      'svg.workflow-canvas',
      '#canvas',
      '.workflow-editor',
    ],
  });

  await canvas.waitFor({ timeout: 10000 });
}

async getNodeCount(): Promise<number> {
  // 셀프힐링으로 노드 찾기
  const nodeLocator = await selfHealingLocator.find(this.page, {
    original: '.workflow-node',
    description: '워크플로우 노드',
    fallbacks: [
      '[data-type="node"]',
      '[class*="node"]',
      '.node-item',
      'g[data-node-type]',
      '[data-node-id]',
    ],
  });

  return await nodeLocator.count();
}
```

---

## 🧪 Step 4: 테스트 실행 및 검증

수정 후 Canvas 테스트를 실행하여 정상 작동하는지 확인합니다:

```bash
# Canvas 기본 테스트 실행
npx playwright test tests/e2e/specs/canvas/canvas-basic.spec.ts --headed
```

**예상 출력:**
```
✅ 인증된 상태로 캔버스 테스트 시작
현재 URL: http://localhost:3000/canvas
초기 노드 개수: 0
최종 노드 개수: 1
✅ 노드 추가 - ChatGPT: PASSED
```

---

## 📊 일반적인 Canvas 구조 패턴

실제 웹 애플리케이션에서 사용하는 일반적인 canvas 구조:

### 패턴 1: HTML Canvas
```html
<div class="canvas-wrapper">
  <canvas id="workflow-canvas" width="1920" height="1080"></canvas>
</div>
```
**Locator**: `canvas#workflow-canvas`

### 패턴 2: SVG Canvas
```html
<div class="editor">
  <svg class="workflow-svg">
    <g class="nodes">
      <g data-node-id="1">...</g>
      <g data-node-id="2">...</g>
    </g>
  </svg>
</div>
```
**Locator**: `svg.workflow-svg`

### 패턴 3: DIV 기반
```html
<div class="canvas-container">
  <div class="node" data-id="1">...</div>
  <div class="node" data-id="2">...</div>
</div>
```
**Locator**: `.canvas-container`

### 패턴 4: 커스텀 Web Component
```html
<workflow-canvas>
  <workflow-node id="node1"></workflow-node>
  <workflow-node id="node2"></workflow-node>
</workflow-canvas>
```
**Locator**: `workflow-canvas`

---

## 🔧 실전 수정 예시

### Debug 테스트 결과 예시

```
=== Canvas 관련 요소 찾기 ===
✅ "canvas" 발견: 1개
   - 태그: CANVAS
   - class: xgen-canvas
   - id: main-canvas

✅ "[class*="node"]" 발견: 5개
   - 태그: DIV
   - class: canvas-node draggable
```

### 이 결과를 바탕으로 수정:

```typescript
// tests/e2e/pages/CanvasPage.ts

constructor(page: Page) {
  this.page = page;

  // ✅ 발견된 실제 선택자 사용
  this.canvas = page.locator('canvas#main-canvas');
  this.sideMenu = page.locator('.node-palette');
  this.header = page.locator('header.canvas-header');

  this.saveButton = page.locator('button:has-text("저장")');
  this.executeButton = page.locator('button:has-text("실행")');
}

async goto() {
  await this.page.goto('/canvas');
  await this.canvas.waitFor({ timeout: 10000 });
}

async getNodeCount(): Promise<number> {
  // ✅ 발견된 노드 클래스 사용
  const nodes = await this.page.locator('.canvas-node').count();
  return nodes;
}
```

---

## ✅ 체크리스트

Canvas Locator 수정 단계:

- [ ] Debug 테스트 실행: `npx playwright test tests/e2e/specs/debug/inspect-canvas.spec.ts --headed`
- [ ] 콘솔 출력에서 Canvas 메인 요소 식별
- [ ] `test-results/canvas-dom-structure.html` 파일 확인
- [ ] CanvasPage.ts의 `this.canvas` locator 수정
- [ ] `getNodeCount()` 메서드의 노드 선택자 수정
- [ ] 필요시 `sideMenu`, `header` 등 다른 locator도 수정
- [ ] Canvas 테스트 실행하여 검증
- [ ] 모든 테스트가 통과하는지 확인

---

## 🎯 다음 단계

1. **Debug 테스트 실행**
   ```bash
   npx playwright test tests/e2e/specs/debug/inspect-canvas.spec.ts --headed
   ```

2. **결과 확인**
   - 콘솔 출력 읽기
   - `test-results/canvas-dom-structure.png` 확인
   - `test-results/canvas-dom-structure.html` 브라우저로 열기

3. **CanvasPage.ts 수정**
   - 실제 선택자로 교체
   - 또는 셀프힐링 locator 사용

4. **테스트 재실행**
   ```bash
   npx playwright test tests/e2e/specs/canvas/canvas-basic.spec.ts --headed
   ```

---

## 📖 관련 문서

- [tests/e2e/pages/CanvasPage.ts](tests/e2e/pages/CanvasPage.ts) - 수정할 파일
- [tests/e2e/specs/debug/inspect-canvas.spec.ts](tests/e2e/specs/debug/inspect-canvas.spec.ts) - DOM 분석 테스트
- [tests/e2e/specs/canvas/canvas-basic.spec.ts](tests/e2e/specs/canvas/canvas-basic.spec.ts) - Canvas 기능 테스트
- [tests/ai/core/self-healing.ts](tests/ai/core/self-healing.ts) - 셀프힐링 구현

---

## 💡 팁

### 빠른 DOM 확인

브라우저 개발자 도구에서 직접 확인하는 방법:

```bash
# UI 모드로 실행
npx playwright test tests/e2e/specs/canvas/canvas-basic.spec.ts --ui
```

1. 테스트를 일시정지
2. 브라우저 개발자 도구 열기 (F12)
3. Elements 탭에서 Canvas 구조 확인
4. 적절한 선택자 찾기

### Playwright Inspector 사용

```bash
# Inspector 모드로 실행
npx playwright test tests/e2e/specs/canvas/canvas-basic.spec.ts --debug
```

Inspector에서 "Pick Locator" 버튼으로 요소 선택하면 자동으로 선택자 생성

---

## 🎉 완료!

Debug 테스트를 실행하여 실제 DOM 구조를 파악하고,
CanvasPage.ts의 locator를 수정하세요!

**다음 명령으로 시작:**
```bash
npx playwright test tests/e2e/specs/debug/inspect-canvas.spec.ts --headed
```

**성공!** 🚀
