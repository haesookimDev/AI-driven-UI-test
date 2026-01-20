import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Canvas 페이지 DOM 구조 분석 테스트
 * 실제 XGEN의 Canvas DOM 구조를 파악하기 위한 디버그 테스트
 */
test.describe('Canvas DOM 구조 분석', () => {
  test('Canvas 페이지 DOM 구조 확인', async ({ authenticatedPage }) => {
    console.log('🔍 Canvas 페이지 DOM 구조 분석 시작');

    // Canvas 페이지로 이동
    await authenticatedPage.goto('/canvas');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(3000);

    console.log('현재 URL:', authenticatedPage.url());

    // 1. 페이지 전체 구조 확인
    console.log('\n=== 페이지 전체 구조 ===');
    const bodyHTML = await authenticatedPage.locator('body').innerHTML();
    console.log('Body 내부 주요 요소:');

    // main, div, section 등 주요 컨테이너 확인
    const mainElements = await authenticatedPage.locator('main').count();
    const sections = await authenticatedPage.locator('section').count();
    const articles = await authenticatedPage.locator('article').count();

    console.log(`- main 요소: ${mainElements}개`);
    console.log(`- section 요소: ${sections}개`);
    console.log(`- article 요소: ${articles}개`);

    // 2. Canvas 관련 요소 찾기
    console.log('\n=== Canvas 관련 요소 찾기 ===');

    // 가능한 canvas 관련 선택자들
    const possibleSelectors = [
      'canvas',
      '[role="canvas"]',
      '[class*="canvas"]',
      '[id*="canvas"]',
      '[data-testid*="canvas"]',
      'svg',
      '[class*="workflow"]',
      '[class*="editor"]',
      '[class*="flow"]',
      '[class*="diagram"]',
      '.canvas',
      '#canvas',
      '[class*="Canvas"]',
      '[class*="Workflow"]',
    ];

    for (const selector of possibleSelectors) {
      const count = await authenticatedPage.locator(selector).count();
      if (count > 0) {
        console.log(`✅ "${selector}" 발견: ${count}개`);

        // 첫 번째 요소의 상세 정보
        try {
          const firstElement = authenticatedPage.locator(selector).first();
          const tagName = await firstElement.evaluate(el => el.tagName);
          const className = await firstElement.evaluate(el => el.className);
          const id = await firstElement.evaluate(el => el.id);

          console.log(`   - 태그: ${tagName}`);
          console.log(`   - class: ${className}`);
          console.log(`   - id: ${id}`);
        } catch (e) {
          console.log(`   - 상세 정보 가져오기 실패`);
        }
      }
    }

    // 3. 노드/컴포넌트 관련 요소 찾기
    console.log('\n=== 노드/컴포넌트 요소 찾기 ===');

    const nodeSelectors = [
      '[class*="node"]',
      '[data-testid*="node"]',
      '[class*="Node"]',
      '[class*="component"]',
      '[class*="Component"]',
      '[class*="block"]',
      '[class*="Block"]',
      '[role="button"]',
      'button',
    ];

    for (const selector of nodeSelectors) {
      const count = await authenticatedPage.locator(selector).count();
      if (count > 0) {
        console.log(`✅ "${selector}" 발견: ${count}개`);
      }
    }

    // 4. 모든 클래스 이름 수집
    console.log('\n=== 모든 고유 클래스 이름 (처음 20개) ===');
    const allClasses = await authenticatedPage.evaluate(() => {
      const classes = new Set<string>();
      document.querySelectorAll('*').forEach(el => {
        if (el.className && typeof el.className === 'string') {
          el.className.split(' ').forEach(cls => {
            if (cls.trim()) classes.add(cls.trim());
          });
        }
      });
      return Array.from(classes).sort();
    });

    allClasses.slice(0, 20).forEach(cls => {
      console.log(`   - ${cls}`);
    });

    // 5. 모든 data-* 속성 수집
    console.log('\n=== data-* 속성 ===');
    const dataAttributes = await authenticatedPage.evaluate(() => {
      const attrs = new Set<string>();
      document.querySelectorAll('*').forEach(el => {
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('data-')) {
            attrs.add(attr.name);
          }
        });
      });
      return Array.from(attrs).sort();
    });

    dataAttributes.slice(0, 20).forEach(attr => {
      console.log(`   - ${attr}`);
    });

    // 6. 스크린샷 저장
    await authenticatedPage.screenshot({
      path: 'test-results/canvas-dom-structure.png',
      fullPage: true
    });
    console.log('\n📸 스크린샷 저장: test-results/canvas-dom-structure.png');

    // 7. HTML 구조 저장
    const html = await authenticatedPage.content();
    const fs = require('fs');
    fs.writeFileSync('test-results/canvas-dom-structure.html', html);
    console.log('💾 HTML 저장: test-results/canvas-dom-structure.html');

    // 테스트는 항상 통과 (분석 목적)
    expect(true).toBeTruthy();
  });

  test('Canvas 메인 컨테이너 후보 찾기', async ({ authenticatedPage }) => {
    console.log('🔍 Canvas 메인 컨테이너 후보 찾기');

    await authenticatedPage.goto('/canvas');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    // 큰 영역을 차지하는 요소 찾기 (canvas의 주 영역일 가능성)
    const largeElements = await authenticatedPage.evaluate(() => {
      const elements: Array<{selector: string, width: number, height: number, area: number}> = [];

      document.querySelectorAll('*').forEach(el => {
        const rect = el.getBoundingClientRect();
        const area = rect.width * rect.height;

        // 충분히 큰 영역 (화면의 30% 이상)
        const screenArea = window.innerWidth * window.innerHeight;
        if (area > screenArea * 0.3) {
          // 선택자 생성
          let selector = el.tagName.toLowerCase();
          if (el.id) selector += `#${el.id}`;
          if (el.className && typeof el.className === 'string') {
            const classes = el.className.split(' ').filter(c => c.trim());
            if (classes.length > 0) {
              selector += `.${classes[0]}`;
            }
          }

          elements.push({
            selector,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            area: Math.round(area),
          });
        }
      });

      return elements.sort((a, b) => b.area - a.area).slice(0, 10);
    });

    console.log('\n=== 큰 영역을 차지하는 요소 (canvas 후보) ===');
    largeElements.forEach((el, idx) => {
      console.log(`${idx + 1}. ${el.selector}`);
      console.log(`   크기: ${el.width}x${el.height} (${el.area} px²)`);
    });

    expect(true).toBeTruthy();
  });

  test('사이드 메뉴와 노드 버튼 찾기', async ({ authenticatedPage }) => {
    console.log('🔍 사이드 메뉴와 노드 버튼 찾기');

    await authenticatedPage.goto('/canvas');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    // 사이드바/메뉴 찾기
    console.log('\n=== 사이드 메뉴 후보 ===');
    const sidebarSelectors = [
      'aside',
      '[role="navigation"]',
      '[class*="sidebar"]',
      '[class*="Sidebar"]',
      '[class*="side"]',
      '[class*="menu"]',
      '[class*="Menu"]',
      '[class*="panel"]',
      '[class*="Panel"]',
    ];

    for (const selector of sidebarSelectors) {
      const count = await authenticatedPage.locator(selector).count();
      if (count > 0) {
        console.log(`✅ "${selector}": ${count}개`);
      }
    }

    // 버튼 찾기
    console.log('\n=== 버튼 요소 ===');
    const buttons = await authenticatedPage.locator('button').count();
    console.log(`전체 버튼: ${buttons}개`);

    // 버튼 텍스트 수집
    const buttonTexts = await authenticatedPage.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .map(btn => btn.textContent?.trim())
        .filter(text => text && text.length > 0)
        .slice(0, 20);
    });

    console.log('버튼 텍스트 (처음 20개):');
    buttonTexts.forEach(text => {
      console.log(`   - "${text}"`);
    });

    expect(true).toBeTruthy();
  });
});
