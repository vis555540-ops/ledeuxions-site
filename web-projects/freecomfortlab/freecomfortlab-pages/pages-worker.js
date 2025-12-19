// Cloudflare Worker for FreeComfortLab
// 로컬 Flask 서버와 연결하는 프록시 역할

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname

  // 1) /api/ping → 헬스체크 엔드포인트
  if (path === '/api/ping') {
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }

  // 2) /api/convert → Flask 서버로 프록시
  if (path === '/api/convert') {
    const flaskUrl = 'http://127.0.0.1:5000/api/convert'

    try {
      const response = await fetch(flaskUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
      })

      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    } catch (error) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Flask 서버 연결 실패'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
  }

  // 그 외 경로는 404
  return new Response(JSON.stringify({ status: 'not found' }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
