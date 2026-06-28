# LeDeuxions API Gateway (Cloudflare Worker)

맥미니 백엔드 앞단의 게이트웨이. **인증·사용량 제한·결제 webhook·프록시** 담당.

```
브라우저 ─► api.ledeuxions.com (Worker)
              ├─ /signup        가입, API key 발급
              ├─ /me            내 정보·잔여 횟수
              ├─ /v1/*          AI 호출 (한도 체크 후 백엔드 프록시)
              ├─ /webhook/lemon Lemon Squeezy 결제 webhook
              └─ /health        gateway + backend 상태
                       │
                       ▼
              pdf.ledeuxions.com (Mac mini)
              └─ /v1/transcribe, /v1/remove-bg, /v1/ocr
```

## 설치

```bash
cd worker
npm install -g wrangler   # 처음 한 번
wrangler login            # Cloudflare 계정 연결
```

## KV namespace 만들기

```bash
wrangler kv:namespace create LEDEUXIONS_KV
# 출력:
#   id = "xxxxxxxxxxxxxxxx"
# → wrangler.toml의 id 필드에 붙여넣기
```

## 비밀 값 설정

```bash
# 맥미니 .env의 INTERNAL_API_KEY와 동일하게
wrangler secret put INTERNAL_API_KEY

# Lemon Squeezy webhook 시크릿
wrangler secret put LEMON_WEBHOOK_SECRET
```

## 배포

```bash
wrangler deploy
```

배포되면 `https://ledeuxions-api.{your-subdomain}.workers.dev` 주소가 나옵니다. Cloudflare 대시보드에서 `api.ledeuxions.com` 같은 커스텀 도메인 연결 권장.

## 사용 예

### 가입

```bash
curl -X POST https://api.ledeuxions.com/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# 응답:
# { "apiKey": "ld_xxxxx", "plan": "free" }
```

### 내 정보 조회

```bash
curl https://api.ledeuxions.com/me \
  -H "Authorization: Bearer ld_xxxxx"

# 응답:
# {
#   "email": "user@example.com",
#   "plan": "free",
#   "quotas": {
#     "transcribe": { "used": 0, "limit": 3 },
#     "remove-bg": { "used": 0, "limit": 5 },
#     "ocr": { "used": 0, "limit": 5 }
#   }
# }
```

### AI 호출

```bash
# 받아쓰기
curl -X POST https://api.ledeuxions.com/v1/transcribe \
  -H "Authorization: Bearer ld_xxxxx" \
  -F "file=@meeting.m4a" \
  -F "lang=ko"

# 배경 제거
curl -X POST https://api.ledeuxions.com/v1/remove-bg \
  -H "Authorization: Bearer ld_xxxxx" \
  -F "file=@photo.jpg" \
  --output out.png

# OCR
curl -X POST https://api.ledeuxions.com/v1/ocr \
  -H "Authorization: Bearer ld_xxxxx" \
  -F "file=@doc.png" \
  -F "lang=kor+eng"
```

응답 헤더에 잔여 횟수 포함:
```
X-Quota-Used: 1
X-Quota-Limit: 3
X-Plan: free
```

## 티어 한도 (src/index.js의 `TIERS` 수정 가능)

| 티어 | transcribe/day | remove-bg/day | ocr/day |
|---|---|---|---|
| free | 3 | 5 | 5 |
| pro (₩3,900/월) | 200 | 500 | 500 |
| business (₩29,900/월) | 1000 | 5000 | 5000 |

## Lemon Squeezy 연동

1. Lemon Squeezy 대시보드에서 webhook 만들기
   - URL: `https://api.ledeuxions.com/webhook/lemon`
   - Secret: 위에서 만든 `LEMON_WEBHOOK_SECRET` 값
   - 이벤트: subscription_created, subscription_updated, subscription_cancelled, subscription_expired, subscription_resumed
2. variant name에 `pro` / `business` 포함되게 상품 만들기
   - 예: "Pro Monthly", "Business Monthly"

결제 완료 시 webhook이 들어오면 자동으로 plan이 업그레이드됩니다.

## 프론트엔드 연동 (브라우저 코드 예시)

```js
// 가입 또는 기존 사용자 → API key 받기
async function ensureApiKey(email) {
    let key = localStorage.getItem('ld_key');
    if (key) return key;
    const r = await fetch('https://api.ledeuxions.com/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    const data = await r.json();
    localStorage.setItem('ld_key', data.apiKey);
    return data.apiKey;
}

// AI 호출
async function callAI(tool, file, params = {}) {
    const key = localStorage.getItem('ld_key');
    if (!key) throw new Error('로그인이 필요합니다');
    const fd = new FormData();
    fd.append('file', file);
    Object.entries(params).forEach(([k, v]) => fd.append(k, v));
    const r = await fetch('https://api.ledeuxions.com/v1/' + tool, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + key },
        body: fd
    });
    if (r.status === 429) {
        const e = await r.json();
        throw new Error(`오늘 한도 ${e.limit}회 사용 완료. 프리미엄으로 더 사용하기 →`);
    }
    if (!r.ok) throw new Error('서버 오류 ' + r.status);
    return r;
}
```

## 로컬 개발

```bash
wrangler dev
# http://localhost:8787
```

## 비용

Cloudflare Workers 무료 플랜:
- 일 100,000 요청
- KV 1000회 쓰기/일, 100,000회 읽기/일

웬만한 트래픽은 무료로 충분. 넘어가면 Workers Paid ($5/월).
