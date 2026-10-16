// 의견 보내기 — 메일 앱을 여는 mailto 주소만 만든다. 아무것도 자동으로 보내지 않는다.
// <a data-fb="도구 이름">의견 보내기</a> 에 붙인다. 주소·브라우저 한 줄은 메일 본문에 보이게 들어가고, 보내기 전에 지울 수 있다.
(function(){
  function ua(){
    var u = navigator.userAgent;
    var os = (u.match(/Android [\d.]+|iPhone OS [\d_]+|CPU OS [\d_]+|Windows NT [\d.]+|Mac OS X [\d_.]+|CrOS|Linux/) || ["?"])[0].replace(/_/g, ".");
    var br = (u.match(/KAKAOTALK|NAVER|SamsungBrowser\/\d+|Edg\/\d+|Firefox\/\d+|CriOS\/\d+|Chrome\/\d+|Version\/\d+[\s\S]*Safari/) || ["?"])[0].replace(/^Version\/(\d+)[\s\S]*$/, "Safari/$1");
    return os + " · " + br;
  }
  function href(tool){
    var body = [
      "안녕하세요. 말해요(" + tool + ")에 의견을 보냅니다.",
      "",
      "1. 어떤 분이 쓰시나요? (관계·상황 — 이름은 안 적으셔도 됩니다)",
      "", "",
      "2. 불편한 점",
      "", "",
      "3. 있었으면 하는 말·기능",
      "", "",
      "4. 쓰시는 기기 (폰·태블릿·PC)",
      "", "",
      "----------",
      "아래 두 줄은 문제를 똑같이 다시 살펴보려고 자동으로 넣었습니다. 보내기 전에 지우셔도 됩니다.",
      "주소: " + location.origin + location.pathname,
      "브라우저: " + ua()
    ].join("\r\n");
    return "mailto:vis555540@gmail.com?subject=" + encodeURIComponent("[말해요 의견] " + tool) + "&body=" + encodeURIComponent(body);
  }
  window.malhaeFbHref = href;
  function fill(){ document.querySelectorAll("a[data-fb]").forEach(function(a){ a.href = href(a.dataset.fb); }); }
  // 나중에 그려지는 링크(설정 창 등)도 누르는 순간 채운다
  document.addEventListener("click", function(e){
    var a = e.target && e.target.closest && e.target.closest("a[data-fb]");
    if(a) a.href = href(a.dataset.fb);
  }, true);
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fill); else fill();
})();
