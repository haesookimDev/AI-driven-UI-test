# XGEN E2E 테스트 시나리오

> XGEN 플랫폼의 전체 테스트 시나리오 및 케이스 정의

## 📋 목차

1. [인증 테스트](#1-인증-테스트)
2. [캔버스 워크플로우 테스트](#2-캔버스-워크플로우-테스트-핵심)
3. [챗봇 테스트](#3-챗봇-테스트)
4. [관리자 테스트](#4-관리자-테스트)
5. [통합 관리 센터 테스트](#5-통합-관리-센터-테스트)
6. [크로스 브라우저 테스트](#6-크로스-브라우저-테스트)
7. [성능 테스트](#7-성능-테스트)
8. [AI 자동 생성 테스트](#8-ai-자동-생성-테스트)

---

## 1. 인증 테스트

### 1.1 로그인 (`/login`)

#### TC-AUTH-001: 정상 로그인
```typescript
Priority: P0 (Critical)
Path: /login
AI-Generated: Yes

시나리오:
1. 로그인 페이지 접속
2. 유효한 이메일/비밀번호 입력
3. "로그인" 버튼 클릭
4. 메인 페이지로 리디렉션 확인
5. 사용자 정보 표시 확인

예상 결과:
- 로그인 성공
- 토큰 저장 확인 (LocalStorage/Cookie)
- 메인 대시보드로 이동
```

#### TC-AUTH-002: 잘못된 자격 증명
```typescript
Priority: P0
Path: /login
AI-Generated: Yes

시나리오:
1. 잘못된 이메일 또는 비밀번호 입력
2. "로그인" 버튼 클릭
3. 에러 메시지 표시 확인

예상 결과:
- "이메일 또는 비밀번호가 올바르지 않습니다" 메시지 표시
- 로그인 페이지 유지
```

#### TC-AUTH-003: 빈 필드 검증
```typescript
Priority: P1
Path: /login
AI-Generated: Yes

시나리오:
1. 이메일 또는 비밀번호 필드를 비워둠
2. "로그인" 버튼 클릭
3. 유효성 검사 메시지 확인

예상 결과:
- 필드별 에러 메시지 표시
- 폼 제출 차단
```

### 1.2 회원가입 (`/signup`)

#### TC-AUTH-004: 정상 회원가입
```typescript
Priority: P0
Path: /signup

시나리오:
1. 회원가입 페이지 접속
2. 모든 필수 정보 입력
   - 이메일
   - 비밀번호 (8자 이상, 특수문자 포함)
   - 비밀번호 확인
   - 이름
3. "가입하기" 버튼 클릭
4. 가입 완료 후 로그인 페이지 또는 메인 페이지로 이동

예상 결과:
- 회원가입 성공 메시지
- 자동 로그인 또는 로그인 페이지 이동
```

#### TC-AUTH-005: 중복 이메일 검증
```typescript
Priority: P1
Path: /signup

시나리오:
1. 이미 존재하는 이메일로 회원가입 시도
2. "가입하기" 버튼 클릭

예상 결과:
- "이미 사용 중인 이메일입니다" 에러 메시지
```

#### TC-AUTH-006: 비밀번호 유효성 검사
```typescript
Priority: P1
Path: /signup
AI-Generated: Yes

테스트 케이스:
1. 8자 미만 비밀번호
2. 특수문자 없는 비밀번호
3. 비밀번호와 확인 불일치

예상 결과:
- 각 케이스별 적절한 에러 메시지 표시
```

### 1.3 비밀번호 재설정 (`/forgot-password`)

#### TC-AUTH-007: 비밀번호 재설정 요청
```typescript
Priority: P2
Path: /forgot-password

시나리오:
1. "비밀번호를 잊으셨나요?" 클릭
2. 등록된 이메일 입력
3. "재설정 링크 보내기" 클릭

예상 결과:
- 이메일 전송 성공 메시지
- (실제로는 백엔드 확인 필요)
```

---

## 2. 캔버스 워크플로우 테스트 (핵심)

### 2.1 캔버스 기본 기능 (`/canvas`)

#### TC-CANVAS-001: 캔버스 페이지 로드
```typescript
Priority: P0
Path: /canvas
AI-Generated: Yes
Visual Validation: Yes

시나리오:
1. 로그인 후 캔버스 페이지 접속
2. 캔버스 UI 로드 확인

검증 항목:
- 캔버스 영역 렌더링
- 사이드 메뉴 표시 (노드 목록)
- 헤더 (저장/로드 버튼) 표시
- 실행 패널 표시
- 빈 캔버스 상태

AI 검증:
- 레이아웃 정상 여부
- UI 요소 정렬 확인
```

#### TC-CANVAS-002: 노드 추가 (Drag & Drop)
```typescript
Priority: P0
Path: /canvas
AI-Generated: Yes
Self-Healing: Yes

시나리오:
1. 사이드 메뉴에서 "Agent Xgen" 노드 선택
2. 캔버스로 드래그 앤 드롭
3. 노드가 캔버스에 추가되는지 확인

검증 항목:
- 노드 정상 렌더링
- 노드 ID 자동 생성
- 노드 기본 위치 설정
- 노드 설정 패널 표시

셀프힐링:
- 노드 셀렉터 자동 복구
- 드래그 앤 드롭 좌표 자동 조정
```

#### TC-CANVAS-003: 여러 노드 추가
```typescript
Priority: P0
Path: /canvas
AI-Generated: Yes

시나리오:
1. Agent Xgen 노드 추가
2. VectorStore 노드 추가
3. PromptTemplate 노드 추가
4. 모든 노드가 겹치지 않고 배치되는지 확인

검증 항목:
- 각 노드 정상 렌더링
- 노드 간 적절한 간격
- 노드 카운트 정확성
```

#### TC-CANVAS-004: 노드 연결 (Edge)
```typescript
Priority: P0
Path: /canvas
AI-Generated: Yes
Visual Validation: Yes

시나리오:
1. PromptTemplate 노드 추가
2. Agent Xgen 노드 추가
3. PromptTemplate의 출력 포트를 Agent Xgen의 입력 포트에 연결
4. 연결선(Edge) 생성 확인

검증 항목:
- 연결선 정상 렌더링
- 데이터 플로우 방향 표시
- 연결 정보 저장

AI 비주얼 검증:
- 연결선이 올바른 포트에 연결되었는지
- 시각적 피드백 정상 여부
```

#### TC-CANVAS-005: 잘못된 연결 방지
```typescript
Priority: P1
Path: /canvas

시나리오:
1. 두 개의 출력 포트를 연결 시도
2. 또는 호환되지 않는 타입 연결 시도

예상 결과:
- 연결 거부
- 에러 메시지 또는 시각적 피드백
```

#### TC-CANVAS-006: 노드 선택 및 하이라이트
```typescript
Priority: P1
Path: /canvas
Visual Validation: Yes

시나리오:
1. 캔버스에 노드 추가
2. 노드 클릭
3. 선택 상태 확인

검증 항목:
- 노드 하이라이트 (테두리 색상 변경)
- 디테일 패널 표시
- 노드 설정 옵션 표시

AI 비주얼 검증:
- 하이라이트 효과 정상 여부
```

#### TC-CANVAS-007: 노드 이동
```typescript
Priority: P1
Path: /canvas
Self-Healing: Yes

시나리오:
1. 노드 선택
2. 드래그하여 새 위치로 이동
3. 위치 업데이트 확인

검증 항목:
- 노드 위치 변경
- 연결선 자동 업데이트
- 부드러운 애니메이션
```

#### TC-CANVAS-008: 노드 삭제
```typescript
Priority: P1
Path: /canvas

시나리오:
1. 노드 선택
2. Delete 키 또는 우클릭 메뉴에서 "삭제" 선택
3. 노드 삭제 확인

검증 항목:
- 노드 제거
- 연결된 엣지도 함께 제거
- 캔버스 상태 업데이트
```

#### TC-CANVAS-009: 다중 노드 선택
```typescript
Priority: P2
Path: /canvas

시나리오:
1. Shift 키를 누른 채 여러 노드 클릭
2. 또는 드래그하여 영역 선택

검증 항목:
- 여러 노드 동시 선택
- 선택된 노드 하이라이트
- 그룹 작업 가능 (이동, 삭제)
```

### 2.2 노드 설정

#### TC-CANVAS-010: 노드 파라미터 수정
```typescript
Priority: P0
Path: /canvas
AI-Generated: Yes

시나리오:
1. Agent Xgen 노드 추가 및 선택
2. 디테일 패널에서 파라미터 수정:
   - Model: gpt-4
   - Temperature: 0.7
   - Max Tokens: 1000
3. 설정 저장 확인

검증 항목:
- 파라미터 정상 입력
- 실시간 업데이트
- 설정 데이터 저장
```

#### TC-CANVAS-011: 필수 파라미터 검증
```typescript
Priority: P1
Path: /canvas

시나리오:
1. 노드 추가
2. 필수 파라미터를 입력하지 않고 저장 시도

예상 결과:
- 유효성 검사 에러
- 필수 필드 하이라이트
```

### 2.3 워크플로우 저장/로드

#### TC-CANVAS-012: 워크플로우 저장
```typescript
Priority: P0
Path: /canvas
AI-Generated: Yes

시나리오:
1. 여러 노드와 연결로 워크플로우 생성
2. 헤더의 "저장" 버튼 클릭
3. 워크플로우 이름 입력
4. 저장 완료 확인

검증 항목:
- LocalStorage에 워크플로우 저장
- 저장 성공 토스트 메시지
- 워크플로우 목록에 추가
```

#### TC-CANVAS-013: 워크플로우 로드
```typescript
Priority: P0
Path: /canvas
AI-Generated: Yes

시나리오:
1. 저장된 워크플로우 선택
2. "로드" 버튼 클릭
3. 워크플로우가 캔버스에 복원되는지 확인

검증 항목:
- 모든 노드 정상 복원
- 노드 위치 정확
- 연결선 복원
- 노드 파라미터 복원
```

#### TC-CANVAS-014: 오토세이브
```typescript
Priority: P2
Path: /canvas

시나리오:
1. 워크플로우 작업 중
2. 일정 시간 경과 또는 변경 사항 발생
3. 자동 저장 확인

검증 항목:
- LocalStorage 자동 업데이트
- "자동 저장됨" 피드백
```

### 2.4 워크플로우 실행

#### TC-CANVAS-015: 워크플로우 실행
```typescript
Priority: P0
Path: /canvas
AI-Generated: Yes
Anomaly Detection: Yes

시나리오:
1. 완전한 워크플로우 생성
   - Input 노드
   - Agent Xgen 노드
   - Output 노드
2. "실행" 버튼 클릭
3. 실행 진행 상황 모니터링

검증 항목:
- 실행 패널 표시
- 각 노드 실행 상태 업데이트 (pending → running → completed)
- 최종 결과 출력
- 실행 시간 표시

AI 이상 탐지:
- 비정상적인 실행 시간 (너무 길거나 짧음)
- 메모리 사용량 급증
- API 에러율 증가
```

#### TC-CANVAS-016: 워크플로우 실행 실패
```typescript
Priority: P1
Path: /canvas

시나리오:
1. 잘못된 설정의 워크플로우 실행 (예: API 키 없음)
2. 에러 처리 확인

예상 결과:
- 에러 메시지 표시
- 실패한 노드 하이라이트
- 에러 로그 확인 가능
```

#### TC-CANVAS-017: 워크플로우 중지
```typescript
Priority: P2
Path: /canvas

시나리오:
1. 장시간 실행되는 워크플로우 시작
2. "중지" 버튼 클릭
3. 실행 중단 확인

검증 항목:
- 즉시 중지
- 중지 상태 표시
- 리소스 정리
```

### 2.5 템플릿

#### TC-CANVAS-018: 템플릿 로드
```typescript
Priority: P1
Path: /canvas
Visual Validation: Yes

시나리오:
1. "템플릿" 메뉴 열기
2. "RAG 챗봇" 템플릿 선택
3. 템플릿이 캔버스에 로드되는지 확인

검증 항목:
- 템플릿의 모든 노드 로드
- 사전 설정된 연결 유지
- 파라미터 기본값 설정

AI 비주얼 검증:
- 노드 레이아웃 정상 여부
- 템플릿 구조 무결성
```

### 2.6 캔버스 인터랙션

#### TC-CANVAS-019: 줌 인/아웃
```typescript
Priority: P2
Path: /canvas

시나리오:
1. 마우스 휠로 줌 인/아웃
2. 또는 줌 컨트롤 버튼 사용

검증 항목:
- 부드러운 줌 애니메이션
- 노드 크기 비례 조정
- 최소/최대 줌 레벨 제한
```

#### TC-CANVAS-020: 캔버스 패닝
```typescript
Priority: P2
Path: /canvas

시나리오:
1. 캔버스 빈 공간 드래그
2. 뷰포트 이동 확인

검증 항목:
- 부드러운 패닝
- 노드 위치 상대적 유지
```

#### TC-CANVAS-021: 우클릭 컨텍스트 메뉴
```typescript
Priority: P2
Path: /canvas
Self-Healing: Yes

시나리오:
1. 노드 우클릭
2. 컨텍스트 메뉴 표시 확인
3. 메뉴 옵션 선택 (복제, 삭제 등)

검증 항목:
- 메뉴 정상 표시
- 메뉴 옵션 동작
- 메뉴 닫기
```

### 2.7 히스토리 & Undo/Redo

#### TC-CANVAS-022: Undo/Redo
```typescript
Priority: P2
Path: /canvas

시나리오:
1. 노드 추가/삭제/이동 작업 수행
2. Ctrl+Z (Undo) 실행
3. Ctrl+Y (Redo) 실행

검증 항목:
- 작업 취소 정상 동작
- 작업 재실행 정상 동작
- 히스토리 스택 관리
```

---

## 3. 챗봇 테스트

### 3.1 챗봇 인터페이스 (`/chatbot/[chatId]`)

#### TC-CHATBOT-001: 챗봇 페이지 로드
```typescript
Priority: P0
Path: /chatbot/[chatId]
AI-Generated: Yes

시나리오:
1. 챗봇 링크 접속
2. 챗봇 UI 로드 확인

검증 항목:
- 챗 인터페이스 렌더링
- 워크플로우 정보 표시
- 입력창 활성화
- 이전 대화 기록 로드 (있는 경우)
```

#### TC-CHATBOT-002: 메시지 전송
```typescript
Priority: P0
Path: /chatbot/[chatId]
AI-Generated: Yes
Anomaly Detection: Yes

시나리오:
1. 입력창에 메시지 입력: "안녕하세요"
2. 전송 버튼 클릭 또는 Enter
3. AI 응답 대기

검증 항목:
- 사용자 메시지 표시
- 로딩 인디케이터 표시
- AI 응답 타이핑 애니메이션
- 응답 완료 후 정상 표시

AI 이상 탐지:
- 응답 시간 지연 (>10초)
- 에러율 증가
```

#### TC-CHATBOT-003: 연속 대화
```typescript
Priority: P1
Path: /chatbot/[chatId]

시나리오:
1. 첫 번째 메시지: "파이썬이 뭐야?"
2. AI 응답 확인
3. 두 번째 메시지: "예제 코드 보여줘"
4. 컨텍스트 유지 확인

검증 항목:
- 대화 기록 누적
- 컨텍스트 유지
- 스크롤 자동 하단 이동
```

#### TC-CHATBOT-004: 긴 응답 처리
```typescript
Priority: P2
Path: /chatbot/[chatId]
Visual Validation: Yes

시나리오:
1. 긴 응답을 유발하는 질문
2. 응답 렌더링 확인

검증 항목:
- 스트리밍 응답 (타이핑 효과)
- 마크다운 렌더링 (코드 블록, 리스트 등)
- 스크롤 정상 동작

AI 비주얼 검증:
- 텍스트 줄바꿈 정상
- 코드 블록 하이라이트
```

#### TC-CHATBOT-005: 에러 처리
```typescript
Priority: P1
Path: /chatbot/[chatId]

시나리오:
1. 네트워크 오류 시뮬레이션
2. 또는 워크플로우 실행 실패

예상 결과:
- 사용자 친화적 에러 메시지
- 재시도 옵션
- 이전 대화는 유지
```

### 3.2 임베드 챗봇 (`/chatbot/embed/[chatId]`)

#### TC-CHATBOT-006: 임베드 챗봇 로드
```typescript
Priority: P2
Path: /chatbot/embed/[chatId]
Visual Validation: Yes

시나리오:
1. 임베드 챗봇 페이지 접속
2. iframe 또는 임베드 형태 확인

검증 항목:
- 최소화된 UI
- 반응형 레이아웃
- 외부 사이트 임베드 가능

AI 비주얼 검증:
- 다양한 화면 크기에서 정상 표시
```

---

## 4. 관리자 테스트

### 4.1 관리자 로그인 (`/admin/login-superuser`)

#### TC-ADMIN-001: 슈퍼유저 로그인
```typescript
Priority: P0
Path: /admin/login-superuser

시나리오:
1. 슈퍼유저 자격증명 입력
2. 관리자 대시보드 접근 확인

검증 항목:
- 로그인 성공
- 관리자 권한 확인
- 관리자 페이지로 리디렉션
```

### 4.2 설정 관리 (`/admin`)

#### TC-ADMIN-002: LLM 모델 설정
```typescript
Priority: P1
Path: /admin
AI-Generated: Yes

시나리오:
1. "모델 관리" 섹션 접속
2. LLM 모델 설정 수정
   - API 키 입력
   - 모델 선택 (GPT-4, Claude 등)
   - 파라미터 설정
3. 저장 및 적용

검증 항목:
- 설정 저장 성공
- 변경사항 즉시 반영
- 설정 유효성 검사
```

#### TC-ADMIN-003: 벡터 데이터베이스 설정
```typescript
Priority: P1
Path: /admin

시나리오:
1. "벡터 DB" 섹션 접속
2. 데이터베이스 연결 정보 입력
3. 연결 테스트

검증 항목:
- 연결 테스트 성공/실패
- 설정 저장
- 에러 처리
```

#### TC-ADMIN-004: 크롤러 설정
```typescript
Priority: P2
Path: /admin

시나리오:
1. "크롤러" 섹션 접속
2. 크롤링 대상 URL 설정
3. 크롤링 실행

검증 항목:
- 크롤링 작업 시작
- 진행 상황 모니터링
- 결과 확인
```

---

## 5. 통합 관리 센터 테스트

### 5.1 모니터링 (`/main`)

#### TC-MAIN-001: 대시보드 로드
```typescript
Priority: P0
Path: /main
Visual Validation: Yes

시나리오:
1. 관리 센터 접속
2. 대시보드 렌더링 확인

검증 항목:
- 워크플로우 실행 통계
- 리소스 사용량 차트
- 최근 활동 로그

AI 비주얼 검증:
- 차트 정상 렌더링
- 데이터 정확성
```

#### TC-MAIN-002: 실시간 모니터링
```typescript
Priority: P1
Path: /main
Anomaly Detection: Yes

시나리오:
1. 워크플로우 실행 시작
2. 실시간 모니터링 확인

검증 항목:
- 실행 상태 실시간 업데이트
- 성능 메트릭 표시
- 리소스 사용량 추적

AI 이상 탐지:
- 성능 저하 감지
- 비정상 패턴 알림
```

### 5.2 워크플로우 관리

#### TC-MAIN-003: 완료된 워크플로우 목록
```typescript
Priority: P1
Path: /main

시나리오:
1. "완료된 워크플로우" 섹션 접속
2. 워크플로우 목록 확인

검증 항목:
- 실행 기록 표시
- 상태별 필터링
- 실행 시간, 결과 표시
```

#### TC-MAIN-004: 워크플로우 상세 보기
```typescript
Priority: P2
Path: /main

시나리오:
1. 완료된 워크플로우 선택
2. 상세 정보 확인

검증 항목:
- 실행 로그
- 각 노드 실행 결과
- 에러 로그 (있는 경우)
```

---

## 6. 크로스 브라우저 테스트

### TC-BROWSER-001: Chrome
```typescript
Priority: P0
Browser: Chromium

테스트 범위:
- 모든 핵심 기능 (P0, P1)
- 특히 캔버스 드래그 앤 드롭
```

### TC-BROWSER-002: Firefox
```typescript
Priority: P1
Browser: Firefox

테스트 범위:
- 핵심 기능 (P0)
- 호환성 검증
```

### TC-BROWSER-003: Safari/WebKit
```typescript
Priority: P1
Browser: WebKit

테스트 범위:
- 핵심 기능 (P0)
- iOS Safari 특이사항 확인
```

### TC-BROWSER-004: Edge
```typescript
Priority: P2
Browser: Edge (Chromium)

테스트 범위:
- 핵심 기능 (P0)
```

---

## 7. 성능 테스트

### TC-PERF-001: 페이지 로드 시간
```typescript
Priority: P1
Anomaly Detection: Yes

시나리오:
1. 각 주요 페이지 접속
2. 로드 시간 측정

기준:
- 초기 로드: < 3초
- 캔버스 렌더링: < 2초
- 챗봇 응답 시작: < 1초

AI 이상 탐지:
- 평소보다 2배 이상 느린 경우 알림
```

### TC-PERF-002: 대량 노드 처리
```typescript
Priority: P2
Path: /canvas
Anomaly Detection: Yes

시나리오:
1. 캔버스에 50개 이상 노드 추가
2. 성능 측정

기준:
- 렌더링 지연 없음
- 드래그 앤 드롭 반응성 유지
- 메모리 사용량 안정적

AI 이상 탐지:
- 메모리 누수 감지
- 프레임 드롭 증가
```

### TC-PERF-003: 장시간 세션
```typescript
Priority: P2
Anomaly Detection: Yes

시나리오:
1. 30분 이상 지속적인 작업
2. 메모리, CPU 사용량 모니터링

기준:
- 메모리 누수 없음
- 성능 저하 없음

AI 이상 탐지:
- 점진적 성능 저하
- 메모리 증가 패턴
```

---

## 8. AI 자동 생성 테스트

### TC-AI-GEN-001: 자연어로 테스트 생성
```typescript
Priority: P0
AI Feature: Test Generation

입력 예시:
"사용자가 로그인한 후 새로운 RAG 워크플로우를 템플릿에서 로드하고,
벡터 데이터베이스를 설정한 다음 실행하여 응답을 확인하는 시나리오"

예상 출력:
- 완전한 Playwright 테스트 코드
- Page Object 사용
- 적절한 assertion
```

### TC-AI-GEN-002: 버그 리포트에서 테스트 생성
```typescript
Priority: P1
AI Feature: Test Generation

입력 예시:
"Issue #123: 노드를 10개 이상 추가하면 캔버스가 느려짐"

예상 출력:
- 버그 재현 테스트
- 성능 측정 코드
- 기대값 검증
```

---

## 📊 테스트 우선순위 정의

- **P0 (Critical)**: 핵심 기능, 반드시 통과해야 함
- **P1 (High)**: 중요 기능, 대부분 통과해야 함
- **P2 (Medium)**: 보조 기능, 선택적 통과

---

## 🏷️ 테스트 태그

- `AI-Generated`: AI로 자동 생성된 테스트
- `Self-Healing`: 셀프힐링 기능 활성화
- `Visual Validation`: AI 비주얼 검증 포함
- `Anomaly Detection`: AI 이상 탐지 활성화

---

## 📈 커버리지 목표

- **전체 라인 커버리지**: 80% 이상
- **핵심 기능 커버리지**: 95% 이상
- **AI 자동 생성 비율**: 60% 이상
- **셀프힐링 활용**: 모든 P0 테스트

---

**다음 단계**: [AI 기능 명세](./AI_FEATURES.md)에서 AI 기능 구현 방법 확인
