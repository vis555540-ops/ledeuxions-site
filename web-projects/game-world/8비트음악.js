/* 8비트음악.js — 옛날 게임기 소리를 코드로 만든다. 파일이 없다.
 *
 *   <script src="/web-projects/game-world/8비트음악.js"></script>
 *   <script>팔비트.틀기('산책')</script>
 *
 * 왜 파일을 안 쓰나 —
 *   ① 남의 음악을 쓰면 저작권을 계속 신경 써야 한다
 *   ② 파일이 없으니 내려받을 게 없다. 게임이 바로 뜬다
 *   ③ 8비트는 파형이 단순해서 코드로 그대로 만들어진다
 *
 * 🚨 소리는 사람이 누른 뒤에만 난다. 브라우저가 그렇게 막아 놨다.
 *    (자동으로 소리 내면 사용자가 놀라니까)
 */
(function (전역) {
  'use strict';

  // 음이름 → 진동수(Hz). 4옥타브 도가 261.63
  var 음표 = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
    'C6': 1046.50, '-': 0   // '-' 는 쉼표
  };

  // 곡들. [음, 길이(박)] 로 적는다.
  var 곡 = {
    // 걸어다니는 게임에 — 밝고 단순하게
    '산책': { 빠르기: 140, 가락: [
      ['C5',1],['E5',1],['G5',1],['E5',1], ['F5',1],['A5',1],['G5',2],
      ['C5',1],['E5',1],['G5',1],['E5',1], ['D5',1],['F5',1],['E5',2]
    ]},
    // 쌓거나 맞추는 게임에 — 또박또박
    '쌓기': { 빠르기: 120, 가락: [
      ['E5',1],['E5',1],['-',1],['E5',1], ['C5',1],['E5',1],['G5',2],
      ['G4',2],['-',2], ['C5',1],['G4',1],['-',1],['E4',1], ['A4',1],['B4',1],['A4',1],['G4',1]
    ]},
    // 빨라지는 게임에 — 조금 급하게
    '달리기': { 빠르기: 168, 가락: [
      ['C5',1],['C5',1],['D5',1],['E5',1], ['E5',1],['D5',1],['C5',1],['G4',1],
      ['A4',1],['A4',1],['B4',1],['C5',1], ['C5',2],['G4',2]
    ]},
    // 생각하는 게임에 — 느리고 조용하게
    '생각': { 빠르기: 92, 가락: [
      ['A4',2],['C5',2], ['E5',2],['D5',2], ['C5',2],['A4',2], ['G4',4],
      ['F4',2],['A4',2], ['C5',2],['B4',2], ['A4',4],['-',2]
    ]}
  };

  var 소리통 = null, 지금돌아감 = null, 켜짐 = true;

  function 통열기() {
    if (!소리통) {
      var C = 전역.AudioContext || 전역.webkitAudioContext;
      if (!C) return null;
      소리통 = new C();
    }
    if (소리통.state === 'suspended') 소리통.resume();
    return 소리통;
  }

  function 한음(진동수, 시작, 길이, 크기) {
    if (!진동수) return;                 // 쉼표
    var 파형 = 소리통.createOscillator();
    var 볼륨 = 소리통.createGain();
    파형.type = 'square';                // ← 이게 8비트 소리의 정체다
    파형.frequency.value = 진동수;
    // 딱 끊으면 「틱」 소리가 난다. 끝을 부드럽게 줄인다
    볼륨.gain.setValueAtTime(0, 시작);
    볼륨.gain.linearRampToValueAtTime(크기, 시작 + 0.01);
    볼륨.gain.setValueAtTime(크기, 시작 + 길이 * 0.8);
    볼륨.gain.linearRampToValueAtTime(0, 시작 + 길이);
    파형.connect(볼륨); 볼륨.connect(소리통.destination);
    파형.start(시작); 파형.stop(시작 + 길이 + 0.02);
    return 파형;
  }

  var 팔비트 = {
    곡목록: function () { return Object.keys(곡); },

    틀기: function (이름, 크기) {
      if (!켜짐) return;
      var 것 = 곡[이름] || 곡['산책'];
      if (!통열기()) return;
      this.끄기();
      var 한박 = 60 / 것.빠르기;
      var 소리크기 = (크기 == null ? 0.06 : 크기);   // 배경음이니 작게
      var 총길이 = 것.가락.reduce(function (합, n) { return 합 + n[1] * 한박 * 0.5; }, 0);

      function 한바퀴(시작) {
        var 때 = 시작;
        것.가락.forEach(function (n) {
          var 길이 = n[1] * 한박 * 0.5;
          한음(음표[n[0]], 때, 길이, 소리크기);
          때 += 길이;
        });
      }
      한바퀴(소리통.currentTime + 0.05);
      지금돌아감 = 전역.setInterval(function () {
        한바퀴(소리통.currentTime + 0.05);
      }, 총길이 * 1000);
    },

    끄기: function () {
      if (지금돌아감) { 전역.clearInterval(지금돌아감); 지금돌아감 = null; }
    },

    켜고끄기: function () {
      켜짐 = !켜짐;
      if (!켜짐) this.끄기();
      return 켜짐;
    },

    /** 사람이 처음 누를 때 저절로 시작되게 한다 (브라우저가 그 전엔 소리를 막는다) */
    누르면시작: function (이름, 크기) {
      var 나 = this, 했나 = false;
      function 시작() {
        if (했나) return;
        했나 = true;
        나.틀기(이름, 크기);
      }
      ['click', 'keydown', 'touchstart'].forEach(function (무엇) {
        전역.addEventListener(무엇, 시작, { once: false, passive: true });
      });
    }
  };

  전역.팔비트 = 팔비트;
})(window);
