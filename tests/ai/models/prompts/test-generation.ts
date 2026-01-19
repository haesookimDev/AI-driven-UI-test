export const testGenerationPrompt = (context: {
  description: string;
  pageUrl?: string;
  pageHtml?: string;
  existingTests?: string[];
}) => {
  return `당신은 Playwright 테스트 전문가입니다. 다음 요구사항에 맞는 E2E 테스트를 작성해주세요.

테스트 요구사항:
${context.description}

${context.pageUrl ? `페이지 URL: ${context.pageUrl}` : ''}

${context.pageHtml ? `페이지 HTML 구조:\n${context.pageHtml.slice(0, 2000)}` : ''}

${context.existingTests?.length ? `\n기존 테스트 참고:\n${context.existingTests.join('\n')}` : ''}

다음 규칙을 따라주세요:
1. Page Object Model 패턴 사용
2. 의미있는 test 이름 (한글 가능)
3. 명확한 assertion 사용
4. 적절한 타임아웃 설정
5. 에러 처리 포함
6. data-testid 선호, 없으면 다른 셀렉터 사용
7. TypeScript로 작성
8. @playwright/test 사용

테스트 코드만 반환해주세요 (설명 불필요):`;
};

export const bugReportPrompt = (issueNumber: string, issueDescription: string) => {
  return `다음 버그 리포트를 재현하는 Playwright 테스트를 작성해주세요:

Issue #${issueNumber}
${issueDescription}

다음을 포함해주세요:
1. 버그 재현 단계
2. 예상 동작과 실제 동작 비교
3. 적절한 assertion
4. Page Object Model 패턴 사용

TypeScript로 작성해주세요.`;
};

export const selectorSuggestionPrompt = (
  originalSelector: string,
  description: string,
  htmlContext: string
) => {
  return `다음 HTML에서 "${description}" 요소를 찾기 위한 최적의 CSS 셀렉터를 제안해주세요.

원래 셀렉터 (실패함): ${originalSelector}

HTML (일부):
${htmlContext.slice(0, 5000)}

요구사항:
1. 가장 안정적인 셀렉터 (data-testid > id > 의미있는 class > 구조)
2. 하나의 셀렉터만 반환 (설명 없이)
3. 유효한 CSS 또는 Playwright 셀렉터

셀렉터:`;
};

export const visualAnalysisPrompt = (context: string) => {
  return `다음 두 스크린샷을 비교하여 변경 사항이 버그인지 의도적인 디자인 변경인지 판단해주세요.

컨텍스트: ${context}

첫 번째 이미지는 베이스라인(예상)이고, 두 번째 이미지는 현재 상태입니다.

다음 형식으로 답변해주세요:
{
  "verdict": "pass" | "fail" | "unclear",
  "reason": "변경 사항 설명",
  "suggestions": ["제안 1", "제안 2"]
}

판단 기준:
- pass: 의도적인 디자인 변경 (색상, 폰트, 레이아웃 개선 등)
- fail: 버그 가능성 높음 (텍스트 잘림, 요소 누락, 깨진 레이아웃 등)
- unclear: 판단하기 어려움`;
};
