# CLAUDE.md — 꿈틀 (Wriggle)

형이 2026-08-23 새벽에 기획한 게임. 원본 명세는 `SPEC.md`(형 작성)에 있고
이 폴더는 그 명세를 그대로 구현한 것이다.

## 지금 상태

```
Phase: 0 (구현 완료 · 실기기 확인 대기)
완료 파일: index.html, src/{config,main,input,save,juice,audio,render,player,world}.js,
          src/scenes/{play,gameover}.js
다음 작업: 형 실기기 확인 → Phase 1 (물방울 EXP·레벨업 카드·특성·타이틀)
막힌 것: 없음
```

## 검증 방법 (감으로 튜닝하지 않는다)

- 물리 검증은 브라우저 없이 노드로 돌린다: `node /tmp/wtest.mjs` (헤드리스 6종)
- 로컬 실행: `python3 -m http.server 8000` — ES Modules 는 file:// 에서 차단된다
- 디버그 오버레이: `?debug=1`
- 사망 시 콘솔에 `[RUN] ...` 한 줄이 항상 찍힌다. 튜닝은 그 로그로만.

## DECISIONS

- [2026-08-23] 배포는 nginx/rsync 대신 git push → Cloudflare Pages (더 단순한 쪽)
- [2026-08-23] 발판 충돌 폭을 `pl.w || PLATFORM_W` 로 (시작 발판만 폭 360)
- [2026-08-23] 게임오버는 화면 아무 데나 눌러도 재시작 (마찰 0 원칙)
