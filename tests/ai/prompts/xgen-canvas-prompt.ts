/**
 * XGEN 캔버스 관련 프롬프트
 * 노드, 포트, 연결에 대한 정의
 */

/**
 * XGEN 포트 정의 프롬프트
 */
export const XGEN_PORT_DEFINITION = `
## XGEN 포트(Port) 정의

### 포트란?
- 포트는 노드 내부에 있는 **배지(badge) 형태의 라벨**입니다
- INPUT 섹션: 노드 왼쪽에 입력 포트들이 있음
- OUTPUT 섹션: 노드 오른쪽에 출력 포트들이 있음

### 포트 타입 (배지에 표시됨)
- STREAM STR, STREAM STR|STR: 텍스트 스트림
- FILE: 파일
- TOOL: 도구/함수
- OBJECT: 객체
- InputSchema, OutputSchema: 스키마 정의
- (ANY): 모든 타입과 연결 가능

### 포트 타입 매칭 규칙 (중요!)
- **같은 타입끼리만 연결 가능**
- TOOL → TOOL ✅
- STREAM STR → STREAM STR|STR ✅
- FILE → FILE ✅
- (ANY) → 모든 타입 ✅
- TOOL → STREAM STR ❌ (타입 불일치)
`;

/**
 * 노드 연결 프롬프트
 */
export const XGEN_NODE_CONNECTION_PROMPT = `
## 노드 연결 방법

### 워크플로우 방향
- 워크플로우는 **왼쪽 → 오른쪽**으로 흐릅니다
- 왼쪽 노드의 OUTPUT → 오른쪽 노드의 INPUT으로 연결

### 연결 좌표 설정
- 시작점(x, y): 출력 포트 배지의 **오른쪽 가장자리**
- 끝점(toX, toY): 입력 포트 배지의 **왼쪽 가장자리**

### 연결 성공 확인
- drag 후 두 노드 사이에 **곡선 연결선(edge)**이 보여야 함
- 연결선이 없으면 done 하지 말고 재시도
`;

/**
 * Agent Xgen 노드 정보
 */
export const AGENT_XGEN_NODE_INFO = `
## Agent Xgen 노드

### INPUT 포트 (왼쪽)
- STREAM STR|STR: 텍스트 입력
- FILE: 파일 입력
- TOOL: 도구/함수 입력 ⭐
- OBJECT: 객체 입력
- DocsContext: RAG 컨텍스트
- OutputSchema: 출력 스키마
- PLAN: 플랜

### OUTPUT 포트 (오른쪽)
- STREAM STR: 텍스트 스트림 출력
`;

/**
 * API Calling Tool 노드 정보
 */
export const API_CALLING_TOOL_NODE_INFO = `
## API Calling Tool 노드

### INPUT 포트 (왼쪽)
- InputSchema: 입력 스키마 정의

### OUTPUT 포트 (오른쪽)
- TOOL: 도구/함수 출력 ⭐
`;

/**
 * API Calling Tool → Agent Xgen 연결 프롬프트
 */
export const API_TO_AGENT_CONNECTION_PROMPT = `
## API Calling Tool → Agent Xgen 연결

### 노드 배치 (중요!)
- **왼쪽**: API Calling Tool (먼저 출력을 생성)
- **오른쪽**: Agent Xgen (출력을 입력으로 받음)

### 연결할 포트
- 출력: API Calling Tool의 "TOOL" 배지 (OUTPUT 섹션)
- 입력: Agent Xgen의 "TOOL" 배지 (INPUT 섹션)

### 연결 좌표
- 시작(x, y): API Calling Tool 노드의 "TOOL" 배지 오른쪽 끝
- 끝(toX, toY): Agent Xgen 노드의 "TOOL" 배지 왼쪽 끝

### 포트 타입
- TOOL → TOOL (타입 일치 ✅)
`;

/**
 * 노드 추가 프롬프트
 */
export const ADD_NODE_PROMPT = `
## 노드 추가 방법

1. 캔버스의 빈 공간을 **doubleClick**
2. 노드 추가 팝업이 열림
3. 원하는 노드를 **click**하여 선택
4. 노드가 캔버스에 추가됨

### 노드 배치 팁
- 워크플로우 방향: 왼쪽 → 오른쪽
- 입력을 제공하는 노드: 왼쪽에 배치
- 입력을 받는 노드: 오른쪽에 배치
`;

/**
 * 캔버스 상태 기반 프롬프트 생성
 */
export function getCanvasStatePrompt(nodesCount: number, edgesCount: number): string {
  let prompt = `
## 현재 캔버스 상태
- 노드 수: ${nodesCount}개
- 연결선 수: ${edgesCount}개
`;

  if (nodesCount === 0) {
    prompt += `
⛔ **노드가 없습니다!**
- 먼저 노드를 추가하세요 (doubleClick으로 팝업 열기)
- zoom, scroll 불필요
`;
  } else if (nodesCount === 1) {
    prompt += `
⛔ **노드가 1개뿐입니다!**
- 연결하려면 두 번째 노드가 필요합니다
- 다른 위치에 노드를 추가하세요 (doubleClick)
- 화면 밖에 다른 노드 없음 (zoom/scroll 불필요)
`;
  } else if (nodesCount >= 2 && edgesCount === 0) {
    prompt += `
✅ 노드 ${nodesCount}개 있음 - 연결 가능!
⚠️ 연결선이 없습니다 - drag로 포트 연결 필요
`;
  } else {
    prompt += `
✅ 노드 ${nodesCount}개, 연결선 ${edgesCount}개
`;
  }

  return prompt;
}
