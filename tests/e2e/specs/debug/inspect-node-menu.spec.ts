import { test, expect } from '../../fixtures/auth.fixture';

/**
 * 노드 메뉴 구조 분석 테스트
 *
 * 가이드:
 * 1. 6번째 메뉴 버튼 클릭 → 노드 정보 메뉴 열기
 * 2. 사이드 메뉴 버튼 렌더링 됨
 * 3. 첫 번째 사이드 메뉴 버튼 = 노드 추가 버튼 → 클릭하면 노드 정보 표시
 * 4. 노드 카테고리 클릭 → 세부 노드 목록 표시
 * 5. 대안: 캔버스 빈 공간 더블클릭 → 노드 생성 메뉴 열기
 */
test.describe('노드 메뉴 구조 분석', () => {

  test('Step 1: 메뉴 버튼 구조 확인', async ({ authenticatedPage }) => {
    console.log('🔍 Step 1: 메뉴 버튼 구조 확인');

    await authenticatedPage.goto('/canvas');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    // 모든 버튼 찾기
    console.log('\n=== 모든 버튼 요소 ===');
    const allButtons = authenticatedPage.locator('button');
    const buttonCount = await allButtons.count();
    console.log(`전체 버튼 개수: ${buttonCount}개`);

    // 각 버튼 정보 출력
    for (let i = 0; i < Math.min(buttonCount, 15); i++) {
      const btn = allButtons.nth(i);
      try {
        const text = await btn.textContent();
        const ariaLabel = await btn.getAttribute('aria-label');
        const className = await btn.getAttribute('class');
        const title = await btn.getAttribute('title');

        console.log(`\n버튼 ${i + 1}:`);
        console.log(`  - text: "${text?.trim() || '(없음)'}"`);
        console.log(`  - aria-label: "${ariaLabel || '(없음)'}"`);
        console.log(`  - title: "${title || '(없음)'}"`);
        console.log(`  - class: "${className?.substring(0, 50) || '(없음)'}..."`);
      } catch (e) {
        console.log(`버튼 ${i + 1}: 정보 가져오기 실패`);
      }
    }

    // 메뉴/툴바 영역 찾기
    console.log('\n=== 메뉴/툴바 영역 ===');
    const menuSelectors = [
      '[class*="menu"]',
      '[class*="Menu"]',
      '[class*="toolbar"]',
      '[class*="Toolbar"]',
      '[class*="header"]',
      '[class*="Header"]',
      '[role="toolbar"]',
      '[role="menubar"]',
      'nav',
    ];

    for (const selector of menuSelectors) {
      const count = await authenticatedPage.locator(selector).count();
      if (count > 0) {
        console.log(`✅ "${selector}": ${count}개`);

        // 해당 영역 내 버튼 개수
        const buttonsInMenu = await authenticatedPage.locator(`${selector} button`).count();
        console.log(`   -> 내부 버튼: ${buttonsInMenu}개`);
      }
    }

    // 스크린샷 저장
    await authenticatedPage.screenshot({
      path: 'test-results/node-menu-step1-buttons.png',
      fullPage: true
    });
    console.log('\n📸 스크린샷 저장: test-results/node-menu-step1-buttons.png');

    expect(true).toBeTruthy();
  });

  test('Step 2: 6번째 메뉴 버튼 클릭 후 사이드 메뉴 확인', async ({ authenticatedPage }) => {
    console.log('🔍 Step 2: 6번째 메뉴 버튼 클릭 후 사이드 메뉴 확인');

    await authenticatedPage.goto('/canvas');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    // 사이드 메뉴 버튼 전 상태 캡처
    await authenticatedPage.screenshot({
      path: 'test-results/node-menu-step2-before.png',
      fullPage: true
    });

    // 메뉴 버튼 찾기 (여러 선택자 시도)
    const menuButtonSelectors = [
      '[class*="menu"] button',
      '[class*="Menu"] button',
      '[class*="toolbar"] button',
      '[class*="Toolbar"] button',
      'header button',
      'nav button',
    ];

    let menuButtons = null;
    let usedSelector = '';

    for (const selector of menuButtonSelectors) {
      const count = await authenticatedPage.locator(selector).count();
      if (count >= 6) {
        menuButtons = authenticatedPage.locator(selector);
        usedSelector = selector;
        console.log(`✅ 사용할 선택자: "${selector}" (${count}개 버튼)`);
        break;
      }
    }

    if (!menuButtons) {
      // 폴백: 모든 버튼 사용
      menuButtons = authenticatedPage.locator('button');
      usedSelector = 'button';
      console.log('⚠️ 폴백: 모든 버튼 사용');
    }

    const totalButtons = await menuButtons.count();
    console.log(`\n전체 메뉴 버튼 수: ${totalButtons}`);

    if (totalButtons >= 6) {
      // 6번째 버튼 클릭 (0-indexed로 5번째)
      const sixthButton = menuButtons.nth(5);

      const btnText = await sixthButton.textContent();
      const btnAriaLabel = await sixthButton.getAttribute('aria-label');
      console.log(`\n6번째 버튼 정보:`);
      console.log(`  - text: "${btnText?.trim() || '(없음)'}"`);
      console.log(`  - aria-label: "${btnAriaLabel || '(없음)'}"`);

      console.log('\n🖱️ 6번째 버튼 클릭...');
      await sixthButton.click();
      await authenticatedPage.waitForTimeout(1000);

      // 클릭 후 상태 캡처
      await authenticatedPage.screenshot({
        path: 'test-results/node-menu-step2-after-click.png',
        fullPage: true
      });

      // 새로 나타난 사이드 메뉴 확인
      console.log('\n=== 클릭 후 나타난 사이드 메뉴 요소 ===');
      const sideMenuSelectors = [
        '[class*="sideMenu"]',
        '[class*="SideMenu"]',
        '[class*="sidebar"]',
        '[class*="Sidebar"]',
        '[class*="panel"]',
        '[class*="Panel"]',
        '[class*="drawer"]',
        '[class*="Drawer"]',
        'aside',
      ];

      for (const selector of sideMenuSelectors) {
        const count = await authenticatedPage.locator(selector).count();
        if (count > 0) {
          console.log(`✅ "${selector}": ${count}개`);

          // 해당 영역 내 버튼 개수
          const buttonsInSide = await authenticatedPage.locator(`${selector} button`).count();
          console.log(`   -> 내부 버튼: ${buttonsInSide}개`);
        }
      }
    } else {
      console.log('⚠️ 메뉴 버튼이 6개 미만입니다.');
    }

    console.log('\n📸 스크린샷 저장: test-results/node-menu-step2-after-click.png');

    expect(true).toBeTruthy();
  });

  test('Step 3: 첫 번째 사이드 메뉴 버튼(노드 추가) 클릭 후 노드 정보 확인', async ({ authenticatedPage }) => {
    console.log('🔍 Step 3: 첫 번째 사이드 메뉴 버튼(노드 추가) 클릭');

    await authenticatedPage.goto('/canvas');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    // 먼저 6번째 메뉴 버튼 클릭
    const menuButtons = authenticatedPage.locator('[class*="menu"] button, [class*="toolbar"] button, header button');
    const menuButtonCount = await menuButtons.count();

    if (menuButtonCount >= 6) {
      console.log('🖱️ 6번째 메뉴 버튼 클릭...');
      await menuButtons.nth(5).click();
      await authenticatedPage.waitForTimeout(1000);
    }

    // 사이드 메뉴 버튼 찾기
    console.log('\n=== 사이드 메뉴 버튼 찾기 ===');
    const sideButtonSelectors = [
      '[class*="sideMenu"] button',
      '[class*="sidebar"] button',
      '[class*="panel"] button',
      'aside button',
    ];

    let sideButtons = null;

    for (const selector of sideButtonSelectors) {
      const count = await authenticatedPage.locator(selector).count();
      if (count > 0) {
        sideButtons = authenticatedPage.locator(selector);
        console.log(`✅ 사이드 메뉴 버튼 발견: "${selector}" (${count}개)`);
        break;
      }
    }

    if (sideButtons) {
      const sideButtonCount = await sideButtons.count();
      console.log(`\n사이드 메뉴 버튼 목록 (${sideButtonCount}개):`);

      for (let i = 0; i < Math.min(sideButtonCount, 10); i++) {
        const btn = sideButtons.nth(i);
        const text = await btn.textContent();
        const ariaLabel = await btn.getAttribute('aria-label');
        const title = await btn.getAttribute('title');

        console.log(`  ${i + 1}. text: "${text?.trim() || '(없음)'}", aria-label: "${ariaLabel || '(없음)'}", title: "${title || '(없음)'}"`);
      }

      // 첫 번째 사이드 메뉴 버튼 클릭 (노드 추가 버튼)
      console.log('\n🖱️ 첫 번째 사이드 메뉴 버튼(노드 추가) 클릭...');
      await sideButtons.first().click();
      await authenticatedPage.waitForTimeout(1000);

      // 클릭 후 상태 캡처
      await authenticatedPage.screenshot({
        path: 'test-results/node-menu-step3-node-info.png',
        fullPage: true
      });

      // 노드 정보/카테고리 확인
      console.log('\n=== 노드 정보/카테고리 요소 ===');
      const nodeInfoSelectors = [
        '[class*="node"]',
        '[class*="Node"]',
        '[class*="category"]',
        '[class*="Category"]',
        '[class*="list"]',
        '[class*="List"]',
        '[class*="item"]',
        '[class*="Item"]',
      ];

      for (const selector of nodeInfoSelectors) {
        const count = await authenticatedPage.locator(selector).count();
        if (count > 0) {
          console.log(`✅ "${selector}": ${count}개`);
        }
      }
    } else {
      console.log('⚠️ 사이드 메뉴 버튼을 찾을 수 없습니다.');
    }

    console.log('\n📸 스크린샷 저장: test-results/node-menu-step3-node-info.png');

    expect(true).toBeTruthy();
  });

  test('Step 4: 노드 카테고리 클릭 후 세부 노드 확인', async ({ authenticatedPage }) => {
    console.log('🔍 Step 4: 노드 카테고리 클릭 후 세부 노드 확인');

    await authenticatedPage.goto('/canvas');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    // 6번째 메뉴 버튼 → 첫 번째 사이드 버튼 순서로 클릭
    const menuButtons = authenticatedPage.locator('[class*="menu"] button, [class*="toolbar"] button, header button');
    if (await menuButtons.count() >= 6) {
      await menuButtons.nth(5).click();
      await authenticatedPage.waitForTimeout(500);
    }

    const sideButtons = authenticatedPage.locator('[class*="sideMenu"] button, [class*="sidebar"] button, aside button');
    if (await sideButtons.count() > 0) {
      await sideButtons.first().click();
      await authenticatedPage.waitForTimeout(500);
    }

    // 카테고리 요소 찾기
    console.log('\n=== 카테고리 요소 찾기 ===');
    const categorySelectors = [
      '[class*="category"]',
      '[class*="Category"]',
      '[class*="accordion"]',
      '[class*="Accordion"]',
      '[class*="collapse"]',
      '[class*="Collapse"]',
      '[class*="group"]',
      '[class*="Group"]',
    ];

    for (const selector of categorySelectors) {
      const elements = authenticatedPage.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        console.log(`✅ "${selector}": ${count}개`);

        // 각 카테고리 텍스트 출력
        for (let i = 0; i < Math.min(count, 5); i++) {
          const text = await elements.nth(i).textContent();
          console.log(`   ${i + 1}. "${text?.trim().substring(0, 50) || '(없음)'}"`);
        }
      }
    }

    // 클릭 가능한 카테고리 찾아서 클릭
    const clickableCategories = authenticatedPage.locator('[class*="category"], [class*="accordion"] > div:first-child, [class*="group"] > button');
    const categoryCount = await clickableCategories.count();

    if (categoryCount > 0) {
      console.log('\n🖱️ 첫 번째 카테고리 클릭...');
      await clickableCategories.first().click();
      await authenticatedPage.waitForTimeout(1000);

      await authenticatedPage.screenshot({
        path: 'test-results/node-menu-step4-category-expanded.png',
        fullPage: true
      });

      // 세부 노드 목록 확인
      console.log('\n=== 세부 노드 목록 ===');
      const nodeItemSelectors = [
        '[class*="nodeItem"]',
        '[class*="NodeItem"]',
        '[class*="listItem"]',
        '[class*="ListItem"]',
        '[data-node-type]',
        '[data-testid*="node"]',
      ];

      for (const selector of nodeItemSelectors) {
        const items = authenticatedPage.locator(selector);
        const itemCount = await items.count();
        if (itemCount > 0) {
          console.log(`✅ "${selector}": ${itemCount}개`);

          for (let i = 0; i < Math.min(itemCount, 5); i++) {
            const text = await items.nth(i).textContent();
            console.log(`   ${i + 1}. "${text?.trim().substring(0, 50) || '(없음)'}"`);
          }
        }
      }
    }

    console.log('\n📸 스크린샷 저장: test-results/node-menu-step4-category-expanded.png');

    expect(true).toBeTruthy();
  });

  test('Step 5: 캔버스 더블클릭으로 노드 생성 메뉴 확인', async ({ authenticatedPage }) => {
    console.log('🔍 Step 5: 캔버스 더블클릭으로 노드 생성 메뉴 확인');

    await authenticatedPage.goto('/canvas');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    // 캔버스 영역 찾기
    const canvasSelectors = [
      '[class*="canvasContainer"]',
      '[class*="canvasGrid"]',
      '[class*="canvas"]',
      '[class*="Canvas"]',
    ];

    let canvas = null;

    for (const selector of canvasSelectors) {
      const count = await authenticatedPage.locator(selector).count();
      if (count > 0) {
        canvas = authenticatedPage.locator(selector).first();
        console.log(`✅ 캔버스 발견: "${selector}"`);
        break;
      }
    }

    if (canvas) {
      const canvasBounds = await canvas.boundingBox();

      if (canvasBounds) {
        console.log(`캔버스 위치: x=${canvasBounds.x}, y=${canvasBounds.y}`);
        console.log(`캔버스 크기: ${canvasBounds.width}x${canvasBounds.height}`);

        // 더블클릭 전 스크린샷
        await authenticatedPage.screenshot({
          path: 'test-results/node-menu-step5-before-dblclick.png',
          fullPage: true
        });

        // 캔버스 중앙 더블클릭
        console.log('\n🖱️ 캔버스 중앙 더블클릭...');
        await authenticatedPage.mouse.dblclick(
          canvasBounds.x + canvasBounds.width / 2,
          canvasBounds.y + canvasBounds.height / 2
        );
        await authenticatedPage.waitForTimeout(1000);

        // 더블클릭 후 스크린샷
        await authenticatedPage.screenshot({
          path: 'test-results/node-menu-step5-after-dblclick.png',
          fullPage: true
        });

        // 나타난 메뉴/팝업 확인
        console.log('\n=== 더블클릭 후 나타난 메뉴/팝업 ===');
        const popupSelectors = [
          '[class*="popup"]',
          '[class*="Popup"]',
          '[class*="modal"]',
          '[class*="Modal"]',
          '[class*="dropdown"]',
          '[class*="Dropdown"]',
          '[class*="contextMenu"]',
          '[class*="ContextMenu"]',
          '[role="menu"]',
          '[role="dialog"]',
        ];

        for (const selector of popupSelectors) {
          const count = await authenticatedPage.locator(selector).count();
          if (count > 0) {
            console.log(`✅ "${selector}": ${count}개`);
          }
        }
      }
    } else {
      console.log('⚠️ 캔버스를 찾을 수 없습니다.');
    }

    console.log('\n📸 스크린샷 저장: test-results/node-menu-step5-after-dblclick.png');

    expect(true).toBeTruthy();
  });

  test('전체 노드 메뉴 워크플로우 분석', async ({ authenticatedPage }) => {
    console.log('🔍 전체 노드 메뉴 워크플로우 분석');

    await authenticatedPage.goto('/canvas');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    const fs = require('fs');
    const results: string[] = [];

    results.push('# 노드 메뉴 워크플로우 분석 결과\n');
    results.push(`분석 시간: ${new Date().toISOString()}\n`);

    // Step 1: 초기 상태
    results.push('\n## Step 1: 초기 상태\n');
    const allButtons = await authenticatedPage.locator('button').count();
    results.push(`- 전체 버튼 개수: ${allButtons}\n`);

    // Step 2: 6번째 메뉴 버튼 클릭
    results.push('\n## Step 2: 6번째 메뉴 버튼 클릭\n');
    const menuButtons = authenticatedPage.locator('[class*="menu"] button, [class*="toolbar"] button, header button');
    const menuCount = await menuButtons.count();
    results.push(`- 메뉴 버튼 개수: ${menuCount}\n`);

    if (menuCount >= 6) {
      const sixthBtn = menuButtons.nth(5);
      const btnText = await sixthBtn.textContent();
      results.push(`- 6번째 버튼 텍스트: "${btnText?.trim()}"\n`);

      await sixthBtn.click();
      await authenticatedPage.waitForTimeout(500);
      results.push('- 클릭 완료\n');
    }

    // Step 3: 사이드 메뉴 버튼
    results.push('\n## Step 3: 사이드 메뉴 버튼\n');
    const sideButtons = authenticatedPage.locator('[class*="sideMenu"] button, [class*="sidebar"] button, aside button');
    const sideCount = await sideButtons.count();
    results.push(`- 사이드 버튼 개수: ${sideCount}\n`);

    if (sideCount > 0) {
      for (let i = 0; i < Math.min(sideCount, 5); i++) {
        const text = await sideButtons.nth(i).textContent();
        results.push(`- 버튼 ${i + 1}: "${text?.trim()}"\n`);
      }

      await sideButtons.first().click();
      await authenticatedPage.waitForTimeout(500);
      results.push('- 첫 번째 버튼 클릭 완료\n');
    }

    // Step 4: 노드 정보
    results.push('\n## Step 4: 노드 정보/카테고리\n');
    const nodeElements = await authenticatedPage.locator('[class*="node"], [class*="category"]').count();
    results.push(`- 노드/카테고리 요소 개수: ${nodeElements}\n`);

    // 결과 파일 저장
    fs.writeFileSync('test-results/node-menu-analysis.md', results.join(''));
    console.log('📝 분석 결과 저장: test-results/node-menu-analysis.md');

    // 최종 스크린샷
    await authenticatedPage.screenshot({
      path: 'test-results/node-menu-final.png',
      fullPage: true
    });

    expect(true).toBeTruthy();
  });
});
