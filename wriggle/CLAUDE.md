# CLAUDE.md — 꿈틀 (Wriggle)

형이 2026-08-23 새벽에 기획한 게임. 원본 명세는 `SPEC.md`(형 작성)에 있고
이 폴더는 그 명세를 그대로 구현한 것이다.

## 지금 상태

```
Phase: 0.5 (§22 v4.1 반영 완료 · 실기기 확인 대기)
완료 파일: index.html, src/{config,main,input,save,juice,audio,render,player,world,entities}.js,
          src/scenes/{title,play,gameover}.js
다음 작업: 형 실기기 확인 → Phase 1 (레벨업 카드·특성 4종·게임필)
막힌 것: 없음
```

## §22 (v4.1) 반영 내역 — 형 1차 플레이테스트 결과

| 절 | 문제 | 조치 |
|---|---|---|
| 22.1 | 점프 궤적이 하나뿐 | 가변 높이(pointerup 절삭) + 가변 각도(탭 x) + 입력버퍼 0.10s + 코요테 0.06s |
| 22.2 | 발판이 좁고 초반이 어렵다 | `DIFF` 난이도 곡선 4구간. 초반 폭 80~88 |
| 22.3 | 못 닿는 발판이 나온다 | REACH 물리표 클램프 + 벽 탈출 규칙 + 5번째마다 안전 발판 |
| 22.4 | 특성 시스템을 모른다 | 시작 카드 3장. **고르기 전엔 수분이 안 준다** |
| 22.5 | 타이틀 없음 | `scenes/title.js`. BOOT → TITLE → PLAY |

검증: `node /tmp/wtest2.mjs` — 6종 통과 (짧은탭 87px vs 꾹 195px, 중앙 vx144 vs 가장자리 276,
카드 전 수분 정지, 못 닿는 발판 0, 안전발판 4/21, 초반 폭 84~88)

## 검증 방법 (감으로 튜닝하지 않는다)

- 물리 검증은 브라우저 없이 노드로 돌린다: `node /tmp/wtest.mjs` (헤드리스 6종)
- 로컬 실행: `python3 -m http.server 8000` — ES Modules 는 file:// 에서 차단된다
- 디버그 오버레이: `?debug=1`
- 사망 시 콘솔에 `[RUN] ...` 한 줄이 항상 찍힌다. 튜닝은 그 로그로만.

## DECISIONS

- [2026-08-23] 배포는 nginx/rsync 대신 git push → Cloudflare Pages (더 단순한 쪽)
- [2026-08-23] 발판 충돌 폭을 `pl.w || PLATFORM_W` 로 (시작 발판만 폭 360)
- [2026-08-23] 게임오버는 화면 아무 데나 눌러도 재시작 (마찰 0 원칙)
