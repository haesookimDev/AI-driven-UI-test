/**
 * AI 프롬프트 모듈 내보내기
 */

// 기본 Playwright 조작 프롬프트
export {
  BASE_ACTIONS_PROMPT,
  BASE_DRAG_PROMPT,
  BASE_ZOOM_PROMPT,
  BASE_SUCCESS_PROMPT,
} from './base-prompt';

// XGEN 캔버스 관련 프롬프트
export {
  XGEN_PORT_DEFINITION,
  XGEN_NODE_CONNECTION_PROMPT,
  AGENT_XGEN_NODE_INFO,
  API_CALLING_TOOL_NODE_INFO,
  API_TO_AGENT_CONNECTION_PROMPT,
  ADD_NODE_PROMPT,
  getCanvasStatePrompt,
} from './xgen-canvas-prompt';
