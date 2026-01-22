/**
 * 기본 Playwright 조작 프롬프트
 * 모든 테스트에서 공통으로 사용되는 액션 정의
 */

export const BASE_ACTIONS_PROMPT = `
## 사용 가능한 액션
1. **click**: 단일 클릭 (x, y 좌표 필수)
2. **doubleClick**: 더블 클릭 (x, y 좌표 필수)
3. **drag**: 드래그 앤 드롭 (x, y: 시작점, toX, toY: 끝점 필수)
4. **type**: 키보드 입력 (value 필수, 현재 포커스된 요소에 입력)
5. **hover**: 마우스 호버 (x, y 좌표 필수)
6. **scroll**: 스크롤 (y: 스크롤 양)
7. **zoom**: 캔버스 줌 인/아웃 (Ctrl+휠) - value: "in" 또는 "out", delta: 휠 양
8. **wait**: 1초 대기
9. **done**: 목적 달성 완료
10. **failed**: 진행 불가

## JSON 응답 형식
{
  "type": "click" | "doubleClick" | "drag" | "type" | "hover" | "scroll" | "zoom" | "wait" | "done" | "failed",
  "target": "대상 요소 설명",
  "x": 시작_X좌표,
  "y": 시작_Y좌표,
  "toX": 드래그_종료_X좌표 (drag인 경우),
  "toY": 드래그_종료_Y좌표 (drag인 경우),
  "value": "입력값 또는 zoom방향",
  "delta": 줌_휠_델타값,
  "reason": "이 액션을 선택한 이유"
}
`;

export const BASE_DRAG_PROMPT = `
## 드래그 (drag) 기본 규칙
- **노드 이동**: 노드의 헤더(타이틀 바) 부분을 시작점으로 드래그
- **노드 연결**: 출력 포트 → 입력 포트로 드래그
`;

export const BASE_ZOOM_PROMPT = `
## 줌 (zoom) 기본 규칙
- zoom out: value="out", delta=120 (노드가 너무 크게 보일 때)
- zoom in: value="in", delta=-120 (노드가 너무 작을 때)
`;

export const BASE_SUCCESS_PROMPT = `
## 성공 판단 기본 규칙
- 요청된 액션이 완료되면 done
- 화면에서 결과를 확인 후 done
- 더 이상 진행 불가능하면 failed
`;
