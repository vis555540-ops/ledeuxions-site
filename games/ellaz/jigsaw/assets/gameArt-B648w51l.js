const e={ink:"#241C3B",inkSoft:"#4A4066",paper:"#FFF7EC",raspberry:"#FF4D8D",tangerine:"#FF8A3D",sunflower:"#FFC730",lime:"#6FD44E",jade:"#17B98A",lagoon:"#26B0E6",indigo:"#4F5BD5",orchid:"#A855C9",clay:"#E4572E"},t=e.ink,h={circle:r=>`<circle cx="168" cy="24" r="62" fill="${r}"/>`,band:r=>`<path d="M0 104 200 56v94H0z" fill="${r}"/>`,arc:r=>`<path d="M0 150C0 74 45 30 100 30s100 44 100 120z" fill="${r}"/>`,hill:r=>`<path d="M-10 150c30-46 62-62 110-62s72 22 110 62z" fill="${r}"/>`},a=(r,l)=>`<g fill="${r}" opacity="${l}"><circle cx="22" cy="26" r="4"/><circle cx="44" cy="14" r="2.6"/><circle cx="14" cy="52" r="2.6"/><circle cx="182" cy="118" r="3.4"/><circle cx="164" cy="136" r="2.4"/></g>`,c={memory:{a:"#FF4D8D",b:"#FF7FAC",d:"circle",s:`
    <g transform="rotate(-9 74 84)"><rect x="42" y="46" width="64" height="82" rx="9" fill="${e.paper}"/>
      <rect x="50" y="54" width="48" height="66" rx="6" fill="${e.indigo}"/>
      <circle cx="74" cy="87" r="13" fill="${e.paper}"/><circle cx="74" cy="87" r="6" fill="${e.indigo}"/></g>
    <g transform="rotate(8 130 82)"><rect x="98" y="42" width="64" height="82" rx="9" fill="${e.paper}"/>
      <path d="M130 58l7.4 15 16.6 2.4-12 11.7 2.8 16.5-14.8-7.8-14.8 7.8 2.8-16.5-12-11.7 16.6-2.4z" fill="${e.sunflower}"/></g>`},evolve:{a:"#17B98A",b:"#3FD1A4",d:"hill",s:`
    <ellipse cx="42" cy="112" rx="17" ry="21" fill="${e.paper}"/>
    <path d="M25 112a17 21 0 0 0 34 0z" fill="#E7DCC6"/>
    <g><ellipse cx="100" cy="106" rx="23" ry="21" fill="${e.sunflower}"/>
      <circle cx="94" cy="100" r="3.4" fill="${t}"/><path d="M104 104l11 4-11 4z" fill="${e.tangerine}"/>
      <path d="M92 127h5v8h-5zM106 127h5v8h-5z" fill="${e.tangerine}"/></g>
    <g><path d="M136 122c0-24 12-38 30-38s28 12 28 30c0 14-8 20-8 20z" fill="${e.lime}"/>
      <path d="M150 84l7-14 6 14zM166 82l7-16 6 16z" fill="${e.jade}"/>
      <circle cx="180" cy="98" r="3.6" fill="${t}"/><path d="M136 122h58v10h-58z" fill="${e.jade}"/></g>`},coloring:{a:"#FF8A3D",b:"#FFAA6B",d:"arc",s:`
    <path d="M100 40v78" stroke="${t}" stroke-width="6" stroke-linecap="round"/>
    <path d="M98 46c-26-22-56-16-56 10s26 40 56 30z" fill="${e.orchid}"/>
    <path d="M98 92c-22-6-44 6-44 24s22 24 44 4z" fill="${e.lagoon}"/>
    <path d="M102 46c26-22 56-16 56 10s-26 40-56 30z" fill="none" stroke="${t}" stroke-width="5"/>
    <path d="M102 92c22-6 44 6 44 24s-22 24-44 4z" fill="none" stroke="${t}" stroke-width="5"/>
    <path d="M100 40c-4-10-12-12-16-10M100 40c4-10 12-12 16-10" stroke="${t}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <g transform="rotate(28 168 120)"><rect x="162" y="88" width="13" height="40" rx="3" fill="${e.paper}"/>
      <path d="M162 128h13l-6.5 16z" fill="${e.raspberry}"/></g>`},finddiff:{a:"#26B0E6",b:"#5BC7F0",d:"band",s:`
    <rect x="14" y="34" width="76" height="82" rx="9" fill="${e.paper}"/>
    <rect x="110" y="34" width="76" height="82" rx="9" fill="${e.paper}"/>
    <g fill="${e.jade}"><circle cx="40" cy="62" r="12"/><circle cx="136" cy="62" r="12"/></g>
    <g fill="${e.tangerine}"><rect x="56" y="82" width="24" height="22" rx="4"/><rect x="152" y="82" width="24" height="22" rx="4"/></g>
    <circle cx="68" cy="58" r="7" fill="${e.raspberry}"/>
    <circle cx="164" cy="58" r="12" fill="none" stroke="${e.raspberry}" stroke-width="4" stroke-dasharray="5 4"/>`},hidden:{a:"#4F5BD5",b:"#6E78E6",d:"circle",s:`
    <g fill="${e.paper}"><ellipse cx="56" cy="70" rx="17" ry="12"/><ellipse cx="96" cy="70" rx="17" ry="12"/></g>
    <circle cx="58" cy="70" r="6.5" fill="${t}"/><circle cx="94" cy="70" r="6.5" fill="${t}"/>
    <g opacity=".45" fill="${e.paper}"><ellipse cx="44" cy="112" rx="12" ry="8"/><ellipse cx="74" cy="112" rx="12" ry="8"/></g>
    <circle cx="146" cy="86" r="34" fill="none" stroke="${e.sunflower}" stroke-width="8"/>
    <circle cx="146" cy="86" r="27" fill="${e.paper}" opacity=".3"/>
    <path d="M170 110l20 20" stroke="${e.sunflower}" stroke-width="10" stroke-linecap="round"/>`},math:{a:"#6FD44E",b:"#93E378",d:"hill",s:`
    <g transform="rotate(-7 46 84)"><rect x="18" y="56" width="56" height="56" rx="10" fill="${e.paper}"/>
      <path d="M46 70v28M32 84h28" stroke="${e.jade}" stroke-width="9" stroke-linecap="round"/></g>
    <path d="M92 84h20M102 74v20" stroke="${t}" stroke-width="8" stroke-linecap="round"/>
    <g transform="rotate(6 156 82)"><rect x="128" y="54" width="56" height="56" rx="10" fill="${e.paper}"/>
      <path d="M142 82h28" stroke="${e.raspberry}" stroke-width="9" stroke-linecap="round"/></g>
    ${a(e.paper,.55)}`},sequence:{a:"#A855C9",b:"#C079DC",d:"band",s:`
    <rect x="12" y="56" width="38" height="38" rx="7" fill="${e.sunflower}"/>
    <circle cx="79" cy="75" r="19" fill="${e.lagoon}"/>
    <rect x="98" y="56" width="38" height="38" rx="7" fill="${e.sunflower}"/>
    <rect x="146" y="52" width="46" height="46" rx="8" fill="${e.paper}" stroke="${t}" stroke-width="4" stroke-dasharray="7 6"/>
    <path d="M162 70c0-7 5-11 11-11s10 4 10 10c0 7-9 7-9 13" stroke="${t}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="174" cy="90" r="3.4" fill="${t}"/>`},vanish:{a:"#17B98A",b:"#4BD3AF",d:"circle",s:`
    <rect x="16" y="58" width="42" height="42" rx="8" fill="${e.sunflower}"/>
    <circle cx="164" cy="79" r="22" fill="${e.raspberry}"/>
    <g fill="${e.paper}" opacity=".9"><circle cx="96" cy="76" r="17"/><circle cx="114" cy="66" r="11"/><circle cx="82" cy="62" r="9"/><circle cx="110" cy="90" r="8"/></g>
    <g stroke="${e.paper}" stroke-width="4" stroke-linecap="round" opacity=".8">
      <path d="M96 44v-9M74 50l-6-7M120 50l6-7"/></g>`},2048:{a:"#FFC730",b:"#FFDD8A",d:"circle",s:`
    <rect x="20" y="52" width="52" height="52" rx="9" fill="${e.paper}"/>
    <rect x="128" y="52" width="52" height="52" rx="9" fill="${e.paper}"/>
    <text x="46" y="88" font-family="Rubik,system-ui,sans-serif" font-size="30" font-weight="700" fill="${e.tangerine}" text-anchor="middle">2</text>
    <text x="154" y="88" font-family="Rubik,system-ui,sans-serif" font-size="30" font-weight="700" fill="${e.tangerine}" text-anchor="middle">2</text>
    <path d="M84 78h32M104 66l12 12-12 12" stroke="${t}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <g fill="${e.paper}" opacity=".85"><circle cx="100" cy="34" r="4"/><circle cx="118" cy="122" r="3.4"/></g>`},tictactoe:{a:"#26B0E6",b:"#63C9F0",d:"hill",s:`
    <g stroke="${e.paper}" stroke-width="4" stroke-linecap="round" opacity=".75">
      <path d="M76 24v104M124 24v104M48 50h104M48 102h104"/></g>
    <g stroke="${e.raspberry}" stroke-width="9" stroke-linecap="round">
      <path d="M92 30l16 16M108 30l-16 16"/><path d="M56 108l16 16M72 108l-16 16"/></g>
    <!-- strike UNDER the winning marks, and in ink at low weight: drawn on top
         at 8px it swallowed the three Os it was supposed to be celebrating. -->
    <path d="M54 30l92 92" stroke="${t}" stroke-width="5" stroke-linecap="round" opacity=".38"/>
    <g stroke="${e.sunflower}" stroke-width="11" stroke-linecap="round" fill="none">
      <circle cx="62" cy="38" r="14"/><circle cx="100" cy="76" r="14"/><circle cx="138" cy="114" r="14"/></g>`},minesweeper:{a:"#4F5BD5",b:"#828BEE",d:"band",s:`
    <g fill="${e.paper}"><rect x="16" y="34" width="50" height="50" rx="6"/><rect x="74" y="34" width="50" height="50" rx="6"/>
      <rect x="16" y="92" width="50" height="50" rx="6"/></g>
    <g fill="${e.inkSoft}" opacity=".22"><rect x="132" y="34" width="50" height="50" rx="6"/><rect x="74" y="92" width="50" height="50" rx="6"/></g>
    <text x="41" y="72" font-family="Rubik,system-ui,sans-serif" font-size="30" font-weight="700" fill="${e.indigo}" text-anchor="middle">3</text>
    <text x="41" y="130" font-family="Rubik,system-ui,sans-serif" font-size="30" font-weight="700" fill="${e.jade}" text-anchor="middle">1</text>
    <path d="M96 74V44" stroke="${t}" stroke-width="5" stroke-linecap="round"/>
    <path d="M96 44l22 8-22 9z" fill="${e.raspberry}"/>
    <path d="M86 74h20v5H86z" fill="${t}"/>`},sudoku:{a:"#A855C9",b:"#C68BDC",d:"circle",s:`
    <rect x="26" y="16" width="148" height="118" rx="8" fill="${e.paper}"/>
    <g stroke="${e.orchid}" stroke-width="2.6" opacity=".5"><path d="M75 16v118M125 16v118M26 55h148M26 94h148"/></g>
    <g stroke="${t}" stroke-width="4"><path d="M75 16v118M125 16v118M26 55h148M26 94h148"/></g>
    <g font-family="Rubik,system-ui,sans-serif" font-size="24" font-weight="700" text-anchor="middle">
      <text x="50" y="45" fill="${e.indigo}">5</text><text x="150" y="45" fill="${e.indigo}">9</text>
      <text x="100" y="84" fill="${e.raspberry}">7</text>
      <text x="50" y="123" fill="${e.indigo}">2</text><text x="150" y="123" fill="${e.jade}">4</text></g>`},snake:{a:"#17B98A",b:"#4CD4B0",d:"hill",s:`
    <path d="M28 118h44a18 18 0 0 0 0-36H56a18 18 0 0 1 0-36h30" fill="none" stroke="${e.lime}"
          stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M28 118h44a18 18 0 0 0 0-36H56a18 18 0 0 1 0-36h30" fill="none" stroke="${e.paper}"
          stroke-width="6" stroke-linecap="round" stroke-dasharray="2 20" opacity=".55"/>
    <circle cx="92" cy="46" r="15" fill="${e.lime}"/>
    <circle cx="97" cy="42" r="3.6" fill="${t}"/>
    <path d="M106 48l12 3-12 4z" fill="${e.raspberry}"/>
    <circle cx="158" cy="92" r="20" fill="${e.raspberry}"/>
    <path d="M158 72v-9" stroke="${e.jade}" stroke-width="5" stroke-linecap="round"/>
    <path d="M158 66c6-8 15-7 15-7s0 10-15 7z" fill="${e.jade}"/>`},blocks:{a:"#6D4BD6",b:"#8A6CE4",d:"band",s:`
    <g stroke="${t}" stroke-width="3">
      <rect x="70" y="16" width="26" height="26" rx="5" fill="${e.sunflower}"/>
      <rect x="96" y="16" width="26" height="26" rx="5" fill="${e.sunflower}"/>
      <rect x="96" y="42" width="26" height="26" rx="5" fill="${e.sunflower}"/>
    </g>
    <path d="M108 76v16M100 86l8 8 8-8" stroke="${e.paper}" stroke-width="5"
          stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".8"/>
    <g stroke="${t}" stroke-width="3">
      <rect x="18" y="98" width="26" height="26" rx="5" fill="${e.lagoon}"/>
      <rect x="44" y="98" width="26" height="26" rx="5" fill="${e.jade}"/>
      <rect x="18" y="124" width="26" height="26" rx="5" fill="${e.raspberry}"/>
      <rect x="44" y="124" width="26" height="26" rx="5" fill="${e.tangerine}"/>
      <rect x="70" y="124" width="26" height="26" rx="5" fill="${e.lime}"/>
      <rect x="122" y="98" width="26" height="26" rx="5" fill="${e.clay}"/>
      <rect x="148" y="98" width="26" height="26" rx="5" fill="${e.orchid}"/>
      <rect x="122" y="124" width="26" height="26" rx="5" fill="${e.lagoon}"/>
      <rect x="148" y="124" width="26" height="26" rx="5" fill="${e.sunflower}"/>
      <rect x="174" y="124" width="26" height="26" rx="5" fill="${e.jade}"/>
    </g>`},wordguess:{a:"#A855C9",b:"#C077DE",d:"arc",s:`
    <g stroke="${t}" stroke-width="3">
      <rect x="19" y="38" width="36" height="36" rx="8" fill="${e.jade}"/>
      <rect x="61" y="38" width="36" height="36" rx="8" fill="${e.orchid}"/>
      <rect x="103" y="38" width="36" height="36" rx="8" fill="${e.paper}"/>
      <rect x="145" y="38" width="36" height="36" rx="8" fill="${e.jade}"/>
      <rect x="19" y="84" width="36" height="36" rx="8" fill="${e.paper}"/>
      <rect x="61" y="84" width="36" height="36" rx="8" fill="${e.paper}"/>
      <rect x="103" y="84" width="36" height="36" rx="8" fill="${e.paper}"/>
      <rect x="145" y="84" width="36" height="36" rx="8" fill="${e.paper}"/>
    </g>
    <path d="M29 50v12M45 50v12M71 50v12M87 56v6M155 56v6M171 50v12"
          stroke="${e.paper}" stroke-width="4" stroke-linecap="round"/>`}},o={lettercross:"#B33A3A",survivors:"#2A2570",holdtheline:"#8C4A1E",snakesurvivors:"#16755F",puzzlesnake:"#5646C9",snakearena:"#0F7F60",chess:"#6D4C41",backgammon:"#A85A2E",balloons:"#FF4D8D",bubbles:"#26B0E6",shadows:"#4F5BD5",echo:"#FFC730",bees:"#FFC730",frog:"#6FD44E",reaction:"#3FC46B",sort:"#26B0E6",merge:"#FF8A3D",pet:"#FF4D8D",fit:"#17B98A",music:"#A855C9",maze:"#6FD44E",letters:"#6355E0",spell:"#0E9F94",bubbleshooter:"#2BA8F0",match3:"#B43594",jigsaw:"#17798F",flow:"#D9522B",arrowtap:"#0F7FD4",fruit:"#D63031",parking:"#E8930C",nonogram:"#4F5BD5",onestroke:"#17B98A",wordsearch:"#E4572E",untangle:"#A855C9"},s=new Set;function d(r){Object.assign(c,r);for(const l of[...s])l()}function n(r,l){const i=c[r];return i?`<svg class="ellaz-art" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><rect width="200" height="150" fill="${i.a}"/>`+h[i.d](i.b)+i.s+'<rect width="200" height="150" style="fill:var(--art-veil,transparent)"/></svg>':""}function x(r){return c[r]?.a??o[r]??e.indigo}export{t as I,e as P,x as a,n as g,d as r};
