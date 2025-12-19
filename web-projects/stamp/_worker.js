export default {
  async fetch(request) {
    const url = new URL(request.url);
    // /api/* 인지 체크
    if (url.pathname.startsWith("/api/")) {
      url.hostname = "192.168.0.12";   // 우분투 노트북 주소
      url.port = "5000";
      return fetch(url, request);
    }

    return new Response("OK from stamp-pages Worker");
  }
};
