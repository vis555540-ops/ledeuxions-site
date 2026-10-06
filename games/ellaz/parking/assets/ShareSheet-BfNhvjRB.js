import{D as N,r as y,j as d,a as V,m as P}from"./standalone-IDmEaZm-.js";const D=40,F=/[0-9ABCDEFGHJKMNPQRSTVWXYZ]{4}-[0-9ABCDEFGHJKMNPQRSTVWXYZ]{4}/gi,z=/ellaz:[\w.:-]*/gi,B="•••";function H(t){return F.lastIndex=0,z.lastIndex=0,F.test(t)||z.test(t)}function w(t){return t.replace(z,B).replace(F,B)}function K(t){const i=w(t.replace(/\s+/g," ").trim());return i.length>D?`${i.slice(0,D-1)}…`:i}function Z(t,i,l){const o=K(t.title);if(o==="")return;const h=t.resultLine?w(t.resultLine.replace(/\s+/g," ").trim()):"",c=t.emoji?`${t.emoji} ${o}`:o,n=h?`${c} - ${h}`:c,a=w(i.note.trim()),s=w(i.invite.trim()),g=w(l.trim()),$={headline:n,items:a===""?[]:[a],invite:s,text:[n,a,`${s} ${g}`].filter(u=>u!=="").join(`
`),url:g};return G($),$}function G(t){const i=[t.date,t.headline,t.invite,t.text,t.url].concat(t.items).filter(l=>typeof l=="string");for(const l of i)if(H(l))throw new Error("share payload carries a storage key or a backup code")}const r={ink:"#241C3B",inkSoft:"#4A4066",paper:"#FFF7EC",raspberry:"#FF4D8D",tangerine:"#FF8A3D",sunflower:"#FFC730",lime:"#6FD44E",jade:"#17B98A",lagoon:"#26B0E6",indigo:"#4F5BD5",orchid:"#A855C9",clay:"#E4572E"},e=r.ink,W={circle:t=>`<circle cx="168" cy="24" r="62" fill="${t}"/>`,band:t=>`<path d="M0 104 200 56v94H0z" fill="${t}"/>`,arc:t=>`<path d="M0 150C0 74 45 30 100 30s100 44 100 120z" fill="${t}"/>`,hill:t=>`<path d="M-10 150c30-46 62-62 110-62s72 22 110 62z" fill="${t}"/>`},X=(t,i)=>`<g fill="${t}" opacity="${i}"><circle cx="22" cy="26" r="4"/><circle cx="44" cy="14" r="2.6"/><circle cx="14" cy="52" r="2.6"/><circle cx="182" cy="118" r="3.4"/><circle cx="164" cy="136" r="2.4"/></g>`,T={memory:{a:"#FF4D8D",b:"#FF7FAC",d:"circle",s:`
    <g transform="rotate(-9 74 84)"><rect x="42" y="46" width="64" height="82" rx="9" fill="${r.paper}"/>
      <rect x="50" y="54" width="48" height="66" rx="6" fill="${r.indigo}"/>
      <circle cx="74" cy="87" r="13" fill="${r.paper}"/><circle cx="74" cy="87" r="6" fill="${r.indigo}"/></g>
    <g transform="rotate(8 130 82)"><rect x="98" y="42" width="64" height="82" rx="9" fill="${r.paper}"/>
      <path d="M130 58l7.4 15 16.6 2.4-12 11.7 2.8 16.5-14.8-7.8-14.8 7.8 2.8-16.5-12-11.7 16.6-2.4z" fill="${r.sunflower}"/></g>`},evolve:{a:"#17B98A",b:"#3FD1A4",d:"hill",s:`
    <ellipse cx="42" cy="112" rx="17" ry="21" fill="${r.paper}"/>
    <path d="M25 112a17 21 0 0 0 34 0z" fill="#E7DCC6"/>
    <g><ellipse cx="100" cy="106" rx="23" ry="21" fill="${r.sunflower}"/>
      <circle cx="94" cy="100" r="3.4" fill="${e}"/><path d="M104 104l11 4-11 4z" fill="${r.tangerine}"/>
      <path d="M92 127h5v8h-5zM106 127h5v8h-5z" fill="${r.tangerine}"/></g>
    <g><path d="M136 122c0-24 12-38 30-38s28 12 28 30c0 14-8 20-8 20z" fill="${r.lime}"/>
      <path d="M150 84l7-14 6 14zM166 82l7-16 6 16z" fill="${r.jade}"/>
      <circle cx="180" cy="98" r="3.6" fill="${e}"/><path d="M136 122h58v10h-58z" fill="${r.jade}"/></g>`},coloring:{a:"#FF8A3D",b:"#FFAA6B",d:"arc",s:`
    <path d="M100 40v78" stroke="${e}" stroke-width="6" stroke-linecap="round"/>
    <path d="M98 46c-26-22-56-16-56 10s26 40 56 30z" fill="${r.orchid}"/>
    <path d="M98 92c-22-6-44 6-44 24s22 24 44 4z" fill="${r.lagoon}"/>
    <path d="M102 46c26-22 56-16 56 10s-26 40-56 30z" fill="none" stroke="${e}" stroke-width="5"/>
    <path d="M102 92c22-6 44 6 44 24s-22 24-44 4z" fill="none" stroke="${e}" stroke-width="5"/>
    <path d="M100 40c-4-10-12-12-16-10M100 40c4-10 12-12 16-10" stroke="${e}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <g transform="rotate(28 168 120)"><rect x="162" y="88" width="13" height="40" rx="3" fill="${r.paper}"/>
      <path d="M162 128h13l-6.5 16z" fill="${r.raspberry}"/></g>`},finddiff:{a:"#26B0E6",b:"#5BC7F0",d:"band",s:`
    <rect x="14" y="34" width="76" height="82" rx="9" fill="${r.paper}"/>
    <rect x="110" y="34" width="76" height="82" rx="9" fill="${r.paper}"/>
    <g fill="${r.jade}"><circle cx="40" cy="62" r="12"/><circle cx="136" cy="62" r="12"/></g>
    <g fill="${r.tangerine}"><rect x="56" y="82" width="24" height="22" rx="4"/><rect x="152" y="82" width="24" height="22" rx="4"/></g>
    <circle cx="68" cy="58" r="7" fill="${r.raspberry}"/>
    <circle cx="164" cy="58" r="12" fill="none" stroke="${r.raspberry}" stroke-width="4" stroke-dasharray="5 4"/>`},hidden:{a:"#4F5BD5",b:"#6E78E6",d:"circle",s:`
    <g fill="${r.paper}"><ellipse cx="56" cy="70" rx="17" ry="12"/><ellipse cx="96" cy="70" rx="17" ry="12"/></g>
    <circle cx="58" cy="70" r="6.5" fill="${e}"/><circle cx="94" cy="70" r="6.5" fill="${e}"/>
    <g opacity=".45" fill="${r.paper}"><ellipse cx="44" cy="112" rx="12" ry="8"/><ellipse cx="74" cy="112" rx="12" ry="8"/></g>
    <circle cx="146" cy="86" r="34" fill="none" stroke="${r.sunflower}" stroke-width="8"/>
    <circle cx="146" cy="86" r="27" fill="${r.paper}" opacity=".3"/>
    <path d="M170 110l20 20" stroke="${r.sunflower}" stroke-width="10" stroke-linecap="round"/>`},math:{a:"#6FD44E",b:"#93E378",d:"hill",s:`
    <g transform="rotate(-7 46 84)"><rect x="18" y="56" width="56" height="56" rx="10" fill="${r.paper}"/>
      <path d="M46 70v28M32 84h28" stroke="${r.jade}" stroke-width="9" stroke-linecap="round"/></g>
    <path d="M92 84h20M102 74v20" stroke="${e}" stroke-width="8" stroke-linecap="round"/>
    <g transform="rotate(6 156 82)"><rect x="128" y="54" width="56" height="56" rx="10" fill="${r.paper}"/>
      <path d="M142 82h28" stroke="${r.raspberry}" stroke-width="9" stroke-linecap="round"/></g>
    ${X(r.paper,.55)}`},sequence:{a:"#A855C9",b:"#C079DC",d:"band",s:`
    <rect x="12" y="56" width="38" height="38" rx="7" fill="${r.sunflower}"/>
    <circle cx="79" cy="75" r="19" fill="${r.lagoon}"/>
    <rect x="98" y="56" width="38" height="38" rx="7" fill="${r.sunflower}"/>
    <rect x="146" y="52" width="46" height="46" rx="8" fill="${r.paper}" stroke="${e}" stroke-width="4" stroke-dasharray="7 6"/>
    <path d="M162 70c0-7 5-11 11-11s10 4 10 10c0 7-9 7-9 13" stroke="${e}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="174" cy="90" r="3.4" fill="${e}"/>`},vanish:{a:"#17B98A",b:"#4BD3AF",d:"circle",s:`
    <rect x="16" y="58" width="42" height="42" rx="8" fill="${r.sunflower}"/>
    <circle cx="164" cy="79" r="22" fill="${r.raspberry}"/>
    <g fill="${r.paper}" opacity=".9"><circle cx="96" cy="76" r="17"/><circle cx="114" cy="66" r="11"/><circle cx="82" cy="62" r="9"/><circle cx="110" cy="90" r="8"/></g>
    <g stroke="${r.paper}" stroke-width="4" stroke-linecap="round" opacity=".8">
      <path d="M96 44v-9M74 50l-6-7M120 50l6-7"/></g>`},2048:{a:"#FFC730",b:"#FFDD8A",d:"circle",s:`
    <rect x="20" y="52" width="52" height="52" rx="9" fill="${r.paper}"/>
    <rect x="128" y="52" width="52" height="52" rx="9" fill="${r.paper}"/>
    <text x="46" y="88" font-family="Rubik,system-ui,sans-serif" font-size="30" font-weight="700" fill="${r.tangerine}" text-anchor="middle">2</text>
    <text x="154" y="88" font-family="Rubik,system-ui,sans-serif" font-size="30" font-weight="700" fill="${r.tangerine}" text-anchor="middle">2</text>
    <path d="M84 78h32M104 66l12 12-12 12" stroke="${e}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <g fill="${r.paper}" opacity=".85"><circle cx="100" cy="34" r="4"/><circle cx="118" cy="122" r="3.4"/></g>`},tictactoe:{a:"#26B0E6",b:"#63C9F0",d:"hill",s:`
    <g stroke="${r.paper}" stroke-width="4" stroke-linecap="round" opacity=".75">
      <path d="M76 24v104M124 24v104M48 50h104M48 102h104"/></g>
    <g stroke="${r.raspberry}" stroke-width="9" stroke-linecap="round">
      <path d="M92 30l16 16M108 30l-16 16"/><path d="M56 108l16 16M72 108l-16 16"/></g>
    <!-- strike UNDER the winning marks, and in ink at low weight: drawn on top
         at 8px it swallowed the three Os it was supposed to be celebrating. -->
    <path d="M54 30l92 92" stroke="${e}" stroke-width="5" stroke-linecap="round" opacity=".38"/>
    <g stroke="${r.sunflower}" stroke-width="11" stroke-linecap="round" fill="none">
      <circle cx="62" cy="38" r="14"/><circle cx="100" cy="76" r="14"/><circle cx="138" cy="114" r="14"/></g>`},minesweeper:{a:"#4F5BD5",b:"#828BEE",d:"band",s:`
    <g fill="${r.paper}"><rect x="16" y="34" width="50" height="50" rx="6"/><rect x="74" y="34" width="50" height="50" rx="6"/>
      <rect x="16" y="92" width="50" height="50" rx="6"/></g>
    <g fill="${r.inkSoft}" opacity=".22"><rect x="132" y="34" width="50" height="50" rx="6"/><rect x="74" y="92" width="50" height="50" rx="6"/></g>
    <text x="41" y="72" font-family="Rubik,system-ui,sans-serif" font-size="30" font-weight="700" fill="${r.indigo}" text-anchor="middle">3</text>
    <text x="41" y="130" font-family="Rubik,system-ui,sans-serif" font-size="30" font-weight="700" fill="${r.jade}" text-anchor="middle">1</text>
    <path d="M96 74V44" stroke="${e}" stroke-width="5" stroke-linecap="round"/>
    <path d="M96 44l22 8-22 9z" fill="${r.raspberry}"/>
    <path d="M86 74h20v5H86z" fill="${e}"/>`},sudoku:{a:"#A855C9",b:"#C68BDC",d:"circle",s:`
    <rect x="26" y="16" width="148" height="118" rx="8" fill="${r.paper}"/>
    <g stroke="${r.orchid}" stroke-width="2.6" opacity=".5"><path d="M75 16v118M125 16v118M26 55h148M26 94h148"/></g>
    <g stroke="${e}" stroke-width="4"><path d="M75 16v118M125 16v118M26 55h148M26 94h148"/></g>
    <g font-family="Rubik,system-ui,sans-serif" font-size="24" font-weight="700" text-anchor="middle">
      <text x="50" y="45" fill="${r.indigo}">5</text><text x="150" y="45" fill="${r.indigo}">9</text>
      <text x="100" y="84" fill="${r.raspberry}">7</text>
      <text x="50" y="123" fill="${r.indigo}">2</text><text x="150" y="123" fill="${r.jade}">4</text></g>`},snake:{a:"#17B98A",b:"#4CD4B0",d:"hill",s:`
    <path d="M28 118h44a18 18 0 0 0 0-36H56a18 18 0 0 1 0-36h30" fill="none" stroke="${r.lime}"
          stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M28 118h44a18 18 0 0 0 0-36H56a18 18 0 0 1 0-36h30" fill="none" stroke="${r.paper}"
          stroke-width="6" stroke-linecap="round" stroke-dasharray="2 20" opacity=".55"/>
    <circle cx="92" cy="46" r="15" fill="${r.lime}"/>
    <circle cx="97" cy="42" r="3.6" fill="${e}"/>
    <path d="M106 48l12 3-12 4z" fill="${r.raspberry}"/>
    <circle cx="158" cy="92" r="20" fill="${r.raspberry}"/>
    <path d="M158 72v-9" stroke="${r.jade}" stroke-width="5" stroke-linecap="round"/>
    <path d="M158 66c6-8 15-7 15-7s0 10-15 7z" fill="${r.jade}"/>`},blocks:{a:"#6D4BD6",b:"#8A6CE4",d:"band",s:`
    <g stroke="${e}" stroke-width="3">
      <rect x="70" y="16" width="26" height="26" rx="5" fill="${r.sunflower}"/>
      <rect x="96" y="16" width="26" height="26" rx="5" fill="${r.sunflower}"/>
      <rect x="96" y="42" width="26" height="26" rx="5" fill="${r.sunflower}"/>
    </g>
    <path d="M108 76v16M100 86l8 8 8-8" stroke="${r.paper}" stroke-width="5"
          stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".8"/>
    <g stroke="${e}" stroke-width="3">
      <rect x="18" y="98" width="26" height="26" rx="5" fill="${r.lagoon}"/>
      <rect x="44" y="98" width="26" height="26" rx="5" fill="${r.jade}"/>
      <rect x="18" y="124" width="26" height="26" rx="5" fill="${r.raspberry}"/>
      <rect x="44" y="124" width="26" height="26" rx="5" fill="${r.tangerine}"/>
      <rect x="70" y="124" width="26" height="26" rx="5" fill="${r.lime}"/>
      <rect x="122" y="98" width="26" height="26" rx="5" fill="${r.clay}"/>
      <rect x="148" y="98" width="26" height="26" rx="5" fill="${r.orchid}"/>
      <rect x="122" y="124" width="26" height="26" rx="5" fill="${r.lagoon}"/>
      <rect x="148" y="124" width="26" height="26" rx="5" fill="${r.sunflower}"/>
      <rect x="174" y="124" width="26" height="26" rx="5" fill="${r.jade}"/>
    </g>`},wordguess:{a:"#A855C9",b:"#C077DE",d:"arc",s:`
    <g stroke="${e}" stroke-width="3">
      <rect x="19" y="38" width="36" height="36" rx="8" fill="${r.jade}"/>
      <rect x="61" y="38" width="36" height="36" rx="8" fill="${r.orchid}"/>
      <rect x="103" y="38" width="36" height="36" rx="8" fill="${r.paper}"/>
      <rect x="145" y="38" width="36" height="36" rx="8" fill="${r.jade}"/>
      <rect x="19" y="84" width="36" height="36" rx="8" fill="${r.paper}"/>
      <rect x="61" y="84" width="36" height="36" rx="8" fill="${r.paper}"/>
      <rect x="103" y="84" width="36" height="36" rx="8" fill="${r.paper}"/>
      <rect x="145" y="84" width="36" height="36" rx="8" fill="${r.paper}"/>
    </g>
    <path d="M29 50v12M45 50v12M71 50v12M87 56v6M155 56v6M171 50v12"
          stroke="${r.paper}" stroke-width="4" stroke-linecap="round"/>`}},Y=new Set;function q(t){Object.assign(T,t);for(const i of[...Y])i()}function J(t,i){const l=T[t];return l?`<svg class="ellaz-art" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><rect width="200" height="150" fill="${l.a}"/>`+W[l.d](l.b)+l.s+'<rect width="200" height="150" style="fill:var(--art-veil,transparent)"/></svg>':""}const Q={balloons:{a:"#FF4D8D",b:"#FF83B0",d:"arc",s:`
    <g><path d="M44 92c-15 0-25-12-25-27s11-27 25-27 25 12 25 27-10 27-25 27z" fill="${r.lagoon}"/>
      <path d="M38 90h12l-6 9z" fill="${r.lagoon}"/>
      <ellipse cx="34" cy="52" rx="6" ry="9" fill="${r.paper}" opacity=".55" transform="rotate(-20 34 52)"/>
      <path d="M44 99c-6 7 6 9 0 16s5 9 0 15" stroke="${r.paper}" stroke-width="3.4" fill="none" stroke-linecap="round"/></g>
    <g fill="${r.sunflower}">
      <path d="M104 34c14 2 22 12 20 22-9-4-18-4-26 2 0-9 2-17 6-24z"/>
      <path d="M78 52c-8 10-7 22 1 28 3-9 9-15 17-18-6-4-12-7-18-10z"/>
      <path d="M124 66c8 6 10 16 5 24-5-7-12-11-20-11 5-5 10-9 15-13z"/></g>
    <circle cx="101" cy="82" r="6" fill="${r.sunflower}"/>
    <path d="M101 88c-5 7 6 9 0 16s5 9 0 14" stroke="${r.paper}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <g><path d="M158 98c-15 0-25-12-25-27s11-27 25-27 25 12 25 27-10 27-25 27z" fill="${r.lime}"/>
      <path d="M152 96h12l-6 9z" fill="${r.lime}"/>
      <ellipse cx="148" cy="58" rx="6" ry="9" fill="${r.paper}" opacity=".55" transform="rotate(-20 148 58)"/>
      <path d="M158 105c-6 7 6 9 0 16s5 7 0 13" stroke="${r.paper}" stroke-width="3.4" fill="none" stroke-linecap="round"/></g>`},bubbles:{a:"#26B0E6",b:"#68CDF2",d:"circle",s:`
    <g fill="${r.paper}" opacity=".92">
      <circle cx="62" cy="94" r="30"/><circle cx="126" cy="60" r="20"/><circle cx="158" cy="112" r="14"/><circle cx="30" cy="42" r="11"/></g>
    <g fill="${r.lagoon}" opacity=".5"><circle cx="62" cy="94" r="20"/><circle cx="126" cy="60" r="13"/></g>
    <g fill="${r.paper}"><circle cx="52" cy="82" r="6"/><circle cx="118" cy="52" r="4"/></g>
    <circle cx="62" cy="94" r="38" fill="none" stroke="${r.sunflower}" stroke-width="5" stroke-dasharray="8 7"/>`},shadows:{a:"#4F5BD5",b:"#7B85EA",d:"hill",s:`
    <path d="M96 20h96v110H96z" fill="${r.paper}" opacity=".9"/>
    <path d="M56 38l10.5 22 24 3.5-17.5 17 4 24L56 93.5 35 104.5l4-24-17.5-17 24-3.5z" fill="${r.sunflower}"/>
    <path d="M144 38l10.5 22 24 3.5-17.5 17 4 24L144 93.5 123 104.5l4-24-17.5-17 24-3.5z" fill="${e}"/>
    <ellipse cx="56" cy="122" rx="27" ry="6" fill="${e}" opacity=".3"/>
    <ellipse cx="144" cy="122" rx="27" ry="6" fill="${e}" opacity=".16"/>`},echo:{a:"#FFC730",b:"#FFD86E",d:"circle",s:`
    <path d="M96 30H62a10 10 0 0 0-10 10v34h44z" fill="${r.raspberry}"/>
    <path d="M104 30h34a10 10 0 0 1 10 10v34h-44z" fill="${r.lagoon}"/>
    <path d="M96 82H52v34a10 10 0 0 0 10 10h34z" fill="${r.jade}"/>
    <path d="M104 82h44v34a10 10 0 0 1-10 10h-34z" fill="${r.paper}"/>
    <g stroke="${r.paper}" stroke-width="4" fill="none" opacity=".95">
      <path d="M156 60a22 22 0 0 1 0 36"/><path d="M168 48a38 38 0 0 1 0 60"/></g>`},bees:{a:"#FFC730",b:"#FFDA7A",d:"band",s:`
    <g fill="${r.paper}" opacity=".85">
      <path d="M40 44l16 9v18l-16 9-16-9V53z"/><path d="M40 88l16 9v18l-16 9-16-9V97z"/>
      <path d="M74 66l16 9v18l-16 9-16-9V75z"/></g>
    <g transform="rotate(-12 146 80)">
      <ellipse cx="146" cy="80" rx="30" ry="21" fill="${r.sunflower}"/>
      <path d="M132 60h11v40h-11zM154 60h11v40h-11z" fill="${e}"/>
      <ellipse cx="146" cy="80" rx="30" ry="21" fill="none" stroke="${e}" stroke-width="3.5"/>
      <ellipse cx="136" cy="56" rx="18" ry="11" fill="${r.paper}" opacity=".92"/>
      <ellipse cx="160" cy="56" rx="16" ry="10" fill="${r.paper}" opacity=".92"/>
      <circle cx="172" cy="74" r="3.6" fill="${e}"/></g>`},frog:{a:"#6FD44E",b:"#98E67D",d:"arc",s:`
    <ellipse cx="100" cy="126" rx="62" ry="16" fill="${r.jade}"/>
    <path d="M100 110c-32 0-46-16-46-32s20-30 46-30 46 14 46 30-14 32-46 32z" fill="${r.lime}"/>
    <circle cx="76" cy="52" r="16" fill="${r.lime}"/><circle cx="124" cy="52" r="16" fill="${r.lime}"/>
    <circle cx="76" cy="50" r="9" fill="${r.paper}"/><circle cx="124" cy="50" r="9" fill="${r.paper}"/>
    <circle cx="78" cy="51" r="4.6" fill="${e}"/><circle cx="126" cy="51" r="4.6" fill="${e}"/>
    <path d="M80 88q20 14 40 0" stroke="${e}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="164" cy="44" r="7" fill="${r.paper}" opacity=".8"/>`},reaction:{a:"#3FC46B",b:"#6BD68F",d:"band",s:`
    <rect x="70" y="20" width="60" height="112" rx="26" fill="${e}"/>
    <circle cx="100" cy="48" r="15" fill="${r.paper}" opacity=".22"/>
    <circle cx="100" cy="84" r="15" fill="${r.paper}" opacity=".22"/>
    <circle cx="100" cy="114" r="16" fill="${r.lime}"/>
    <g stroke="${r.paper}" stroke-width="7" stroke-linecap="round" opacity=".9">
      <path d="M22 62h30M14 88h38M28 112h24"/></g>
    <g stroke="${r.paper}" stroke-width="7" stroke-linecap="round" opacity=".9">
      <path d="M148 62h30M148 88h38M156 112h24"/></g>`},sort:{a:"#26B0E6",b:"#5CC8F0",d:"band",s:`
    <g stroke="${e}" stroke-width="3">
      <rect x="30" y="36" width="28" height="90" rx="14" fill="${r.paper}"/>
      <rect x="86" y="36" width="28" height="90" rx="14" fill="${r.paper}"/>
      <rect x="142" y="36" width="28" height="90" rx="14" fill="${r.paper}"/></g>
    <g fill="${r.raspberry}"><circle cx="44" cy="114" r="10"/><circle cx="44" cy="94" r="10"/>
      <circle cx="44" cy="74" r="10"/><circle cx="44" cy="54" r="10"/></g>
    <g><circle cx="100" cy="114" r="10" fill="${r.sunflower}"/><circle cx="100" cy="94" r="10" fill="${r.lime}"/>
      <circle cx="100" cy="74" r="10" fill="${r.sunflower}"/><circle cx="100" cy="54" r="10" fill="${r.lime}"/></g>
    <g fill="${r.orchid}"><circle cx="156" cy="114" r="10"/><circle cx="156" cy="94" r="10"/></g>`},merge:{a:"#FF8A3D",b:"#FFAD6E",d:"hill",s:`
    <g fill="${r.orchid}">
      <ellipse cx="76" cy="50" rx="21" ry="14" transform="rotate(-22 76 50)"/>
      <ellipse cx="124" cy="50" rx="21" ry="14" transform="rotate(22 124 50)"/></g>
    <g fill="${r.sunflower}">
      <ellipse cx="82" cy="74" rx="15" ry="11" transform="rotate(18 82 74)"/>
      <ellipse cx="118" cy="74" rx="15" ry="11" transform="rotate(-18 118 74)"/></g>
    <ellipse cx="100" cy="62" rx="5" ry="20" fill="${e}"/>
    <path d="M98 44c-3-8-9-11-14-12M102 44c3-8 9-11 14-12" fill="none"
          stroke="${e}" stroke-width="2.5" stroke-linecap="round"/>
    <g fill="${r.lime}" stroke="${e}" stroke-width="3">
      <circle cx="24" cy="112" r="13"/><circle cx="44" cy="112" r="13"/><circle cx="64" cy="112" r="13"/>
      <circle cx="136" cy="112" r="13"/><circle cx="156" cy="112" r="13"/><circle cx="176" cy="112" r="13"/></g>
    <g fill="${e}"><circle cx="68" cy="107" r="3"/><circle cx="132" cy="107" r="3"/></g>`},pet:{a:"#FF4D8D",b:"#FF9BC0",d:"hill",s:`
    <ellipse cx="100" cy="129" rx="40" ry="7" fill="${e}" opacity="0.14"/>
    <g fill="${e}"><ellipse cx="85" cy="122" rx="12" ry="6"/><ellipse cx="115" cy="122" rx="12" ry="6"/></g>
    <path d="M100 48 L100 30" stroke="${e}" stroke-width="3" stroke-linecap="round"/>
    <path d="M99 32C88 30 84 18 97 14C106 19 106 29 99 32Z" fill="${r.lime}"
          stroke="${e}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M101 32C112 30 116 18 103 14C94 19 94 29 101 32Z" fill="${r.jade}"
          stroke="${e}" stroke-width="3" stroke-linejoin="round"/>
    <g fill="${r.paper}" stroke="${e}" stroke-width="3">
      <ellipse cx="63" cy="80" rx="8" ry="14" transform="rotate(-18 63 80)"/>
      <ellipse cx="137" cy="80" rx="8" ry="14" transform="rotate(18 137 80)"/></g>
    <ellipse cx="100" cy="83" rx="38" ry="40" fill="${r.paper}" stroke="${e}" stroke-width="3.5"/>
    <ellipse cx="100" cy="95" rx="23" ry="24" fill="#FFE0EA"/>
    <g fill="${r.raspberry}" opacity="0.42"><circle cx="76" cy="87" r="6.5"/><circle cx="124" cy="87" r="6.5"/></g>
    <path d="M82 75c4-5 10-5 14 0M104 75c4-5 10-5 14 0M94 88c3 4 9 4 12 0"
          fill="none" stroke="${e}" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M156 40c0-7 9-9 9-2 0-7 9-5 9 2 0 8-9 14-9 14s-9-6-9-14Z"
          fill="${r.paper}" stroke="${e}" stroke-width="2.6" stroke-linejoin="round"/>`},fit:{a:"#17B98A",b:"#3FD1A4",d:"arc",s:`
    <g fill="${r.raspberry}" stroke="${e}" stroke-width="3">
      <rect x="8" y="30" width="24" height="24" rx="5"/>
      <rect x="8" y="54" width="24" height="24" rx="5"/>
      <rect x="8" y="78" width="24" height="24" rx="5"/></g>
    <rect x="40" y="20" width="110" height="110" rx="9" fill="${r.paper}" stroke="${e}" stroke-width="3.5"/>
    <g stroke="${e}" stroke-width="2" opacity="0.16">
      <path d="M62 20v110M84 20v110M106 20v110M128 20v110"/>
      <path d="M40 42h110M40 64h110M40 86h110M40 108h110"/></g>
    <rect x="43" y="67" width="104" height="16" rx="5" fill="${r.sunflower}"/>
    <rect x="109" y="23" width="16" height="104" rx="5" fill="${r.lagoon}"/>
    <rect x="45" y="25" width="14" height="14" rx="4" fill="${r.orchid}"/>
    <rect x="67" y="111" width="14" height="14" rx="4" fill="${r.orchid}"/>
    <path d="M170 62l7 7 13-15" fill="none" stroke="${r.paper}" stroke-width="6"
          stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`},music:{a:"#A855C9",b:"#C079DC",d:"hill",s:`
    <g stroke="${e}" stroke-width="3">
      <rect x="24" y="46" width="26" height="26" rx="6" fill="${r.raspberry}"/>
      <rect x="56" y="46" width="26" height="26" rx="6" fill="${r.paper}" opacity="0.42"/>
      <rect x="88" y="46" width="26" height="26" rx="6" fill="${r.lagoon}"/>
      <rect x="120" y="46" width="26" height="26" rx="6" fill="${r.paper}" opacity="0.42"/>
      <rect x="24" y="78" width="26" height="26" rx="6" fill="${r.paper}" opacity="0.42"/>
      <rect x="56" y="78" width="26" height="26" rx="6" fill="${r.sunflower}"/>
      <rect x="88" y="78" width="26" height="26" rx="6" fill="${r.paper}" opacity="0.42"/>
      <rect x="120" y="78" width="26" height="26" rx="6" fill="${r.lime}"/></g>
    <g fill="${r.paper}">
      <ellipse cx="60" cy="26" rx="8" ry="6" transform="rotate(-18 60 26)"/>
      <rect x="66" y="6" width="3.4" height="18" rx="1.7"/>
      <ellipse cx="104" cy="20" rx="7" ry="5.4" transform="rotate(-18 104 20)"/>
      <rect x="109" y="3" width="3.2" height="16" rx="1.6"/></g>
    <path d="M158 60l26 15-26 15z" fill="${r.paper}" stroke="${e}" stroke-width="3" stroke-linejoin="round"/>`},maze:{a:"#6FD44E",b:"#93E378",d:"band",s:`
    <rect x="18" y="16" width="164" height="118" rx="9" fill="${r.paper}" stroke="${e}" stroke-width="3.5"/>
    <g stroke="${e}" stroke-width="7" stroke-linecap="round" fill="none">
      <path d="M58 16v46M98 134V90M138 16v58M18 98h38M98 62h58"/></g>
    <circle cx="122" cy="40" r="7" fill="${r.sunflower}" stroke="${e}" stroke-width="3"/>
    <g><path d="M148 134c0-18 12-30 26-30v30z" fill="${e}"/>
      <path d="M156 134c0-11 7-19 15-19v19z" fill="${r.inkSoft}"/></g>
    <g><path d="M37 68c-9 5-13 12-11 20" stroke="${e}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <circle cx="40" cy="46" r="6" fill="${r.paper}" stroke="${e}" stroke-width="3"/>
      <circle cx="58" cy="46" r="6" fill="${r.paper}" stroke="${e}" stroke-width="3"/>
      <circle cx="49" cy="58" r="15" fill="${r.paper}" stroke="${e}" stroke-width="3"/>
      <circle cx="45" cy="55" r="2.6" fill="${e}"/><circle cx="55" cy="55" r="2.6" fill="${e}"/>
      <circle cx="50" cy="63" r="2.6" fill="${r.raspberry}"/></g>`},letters:{a:"#6355E0",b:"#8B84FF",d:"band",s:`
    <rect x="16" y="24" width="84" height="84" rx="15" fill="${r.paper}" stroke="${e}" stroke-width="3.5"/>
    <circle cx="58" cy="70" r="27" fill="${r.raspberry}"/>
    <path d="M58 45c-2-9 6-15 14-13-1 8-6 13-14 13z" fill="${r.lime}"/>
    <path d="M58 47v-8" stroke="${r.inkSoft}" stroke-width="4" stroke-linecap="round"/>
    <g stroke="${e}" stroke-width="3.5">
      <rect x="118" y="30" width="64" height="64" rx="14" fill="${r.sunflower}"/>
      <rect x="118" y="104" width="28" height="28" rx="8" fill="${r.paper}"/>
      <rect x="154" y="104" width="28" height="28" rx="8" fill="${r.paper}"/></g>
    <text x="150" y="76" font-family="Fredoka,system-ui,sans-serif" font-size="46" font-weight="800" text-anchor="middle" fill="${e}">A</text>`},spell:{a:"#0E9F94",b:"#35C7BC",d:"band",s:`
    <g stroke="${e}" stroke-width="3.5">
      <rect x="14" y="34" width="56" height="56" rx="13" fill="${r.paper}"/>
      <rect x="82" y="40" width="34" height="34" rx="9" fill="${r.jade}"/>
      <rect x="120" y="40" width="34" height="34" rx="9" fill="${r.jade}"/>
      <rect x="158" y="40" width="34" height="34" rx="9" fill="${r.paper}" stroke-dasharray="7 6"/>
      <rect x="158" y="98" width="34" height="34" rx="9" fill="${r.sunflower}"/>
    </g>
    <circle cx="42" cy="64" r="17" fill="${r.raspberry}"/>
    <path d="M42 45c-2-7 5-12 11-10-1 7-5 10-11 10z" fill="${r.lime}"/>
    <path d="M93 51v12M105 51v12M131 51v12M143 51v12"
          stroke="${r.paper}" stroke-width="4" stroke-linecap="round"/>
    <path d="M175 109v12" stroke="${e}" stroke-width="4" stroke-linecap="round"/>
    <path d="M175 92v-8M169 88l6-6 6 6" stroke="${e}" stroke-width="3.5"
          stroke-linecap="round" stroke-linejoin="round" fill="none"/>`},bubbleshooter:{a:"#2BA8F0",b:"#7FD0F7",d:"arc",s:`
    <g stroke="${e}" stroke-width="3">
      <circle cx="22" cy="32" r="13" fill="${r.raspberry}"/>
      <circle cx="50" cy="32" r="13" fill="${r.lagoon}"/>
      <circle cx="78" cy="32" r="13" fill="${r.lime}"/>
      <circle cx="106" cy="32" r="13" fill="${r.sunflower}"/>
      <circle cx="134" cy="32" r="13" fill="${r.lagoon}"/>
      <circle cx="162" cy="32" r="13" fill="${r.raspberry}"/>
      <circle cx="36" cy="56" r="13" fill="${r.lime}"/>
      <circle cx="64" cy="56" r="13" fill="${r.raspberry}"/>
      <circle cx="92" cy="56" r="13" fill="${r.sunflower}"/>
      <circle cx="148" cy="56" r="13" fill="${r.lagoon}"/>
    </g>
    <circle cx="120" cy="56" r="12" fill="none" stroke="${r.paper}"
            stroke-width="3" stroke-dasharray="5 5"/>
    <g fill="${r.paper}" opacity="0.85">
      <circle cx="22" cy="32" r="3.4"/>
      <circle cx="64" cy="56" r="3.4"/>
      <circle cx="162" cy="32" r="3.4"/>
    </g>
    <g stroke="${r.paper}" stroke-width="3" fill="none" opacity="0.85">
      <circle cx="50" cy="32" r="4.6"/>
      <circle cx="134" cy="32" r="4.6"/>
      <circle cx="148" cy="56" r="4.6"/>
      <path d="M78 27l5.4 9H72.6zM36 51l5.4 9H30.6z" fill="${r.paper}" stroke="none"/>
      <path d="M106 27v10M101 32h10M92 51v10M87 56h10"/>
    </g>
    <path d="M100 126 186 86 120 56" fill="none" stroke="${r.paper}" stroke-width="3.4"
          stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 9" opacity="0.95"/>
    <path d="M74 128a26 26 0 0 1 52 0z" fill="${r.inkSoft}" stroke="${e}" stroke-width="3"/>
    <circle cx="100" cy="120" r="14" fill="${r.orchid}" stroke="${e}" stroke-width="3"/>
    <path d="M100 114v12M94 120h12" stroke="${r.paper}" stroke-width="3" stroke-linecap="round"/>`},match3:{a:"#B43594",b:"#D96BC0",d:"band",s:`
    <rect x="30" y="56" width="140" height="40" rx="20" fill="${r.paper}" opacity=".22"/>
    <g fill="${r.lagoon}">
      <circle cx="58" cy="76" r="15"/><circle cx="100" cy="76" r="15"/><circle cx="142" cy="76" r="15"/></g>
    <g fill="${r.raspberry}">
      <path d="M58 24 73 38 58 52 43 38Z"/><path d="M142 100 157 114 142 128 127 114Z"/></g>
    <g fill="${r.lime}">
      <rect x="87" y="26" width="26" height="26" rx="5"/>
      <rect x="45" y="102" width="26" height="26" rx="5"/></g>
    <g fill="${r.sunflower}">
      <path d="M142 24l14 26h-28z"/><path d="M100 102l14 26H86z"/></g>
    <g stroke="${r.paper}" stroke-width="3.2" fill="none" stroke-linecap="round">
      <path d="M176 92v22M170 98l6-6 6 6M182 108l-6 6-6-6"/></g>
    <g fill="${r.paper}" opacity=".9">
      <circle cx="26" cy="30" r="3.6"/><circle cx="176" cy="40" r="2.8"/><circle cx="20" cy="128" r="2.8"/></g>`},jigsaw:{a:"#17798F",b:"#4FB6CC",d:"hill",s:`
    <g stroke="${e}" stroke-width="3">
      <rect x="34" y="36" width="38" height="38" rx="6" fill="${r.raspberry}"/>
      <rect x="76" y="36" width="38" height="38" rx="6" fill="${r.sunflower}"/>
      <rect x="34" y="78" width="38" height="38" rx="6" fill="${r.lime}"/>
      <rect x="76" y="78" width="38" height="38" rx="6" fill="${r.orchid}"/>
      <rect x="118" y="78" width="38" height="38" rx="6" fill="${r.tangerine}"/>
    </g>
    <rect x="118" y="36" width="38" height="38" rx="6" fill="${r.ink}" opacity=".28"
          stroke="${r.paper}" stroke-width="3" stroke-dasharray="6 5"/>
    <g transform="rotate(-12 160 24)">
      <rect x="141" y="6" width="38" height="38" rx="6" fill="${r.lagoon}"
            stroke="${e}" stroke-width="3"/>
      <circle cx="160" cy="25" r="6" fill="${r.paper}" opacity=".5"/>
    </g>
    <g fill="${r.paper}" opacity=".85">
      <circle cx="20" cy="26" r="3.4"/><circle cx="186" cy="70" r="2.8"/><circle cx="24" cy="132" r="2.8"/></g>`},lettercross:{a:"#B33A3A",b:"#D97070",d:"band",s:`
    <rect x="22" y="18" width="156" height="116" rx="9" fill="${r.paper}"/>
    <g stroke="${r.clay}" stroke-width="2" opacity=".35">
      <path d="M61 18v116M100 18v116M139 18v116M22 47h156M22 76h156M22 105h156"/></g>
    <g fill="${r.sunflower}" opacity=".55">
      <rect x="22" y="18" width="39" height="29"/><rect x="139" y="105" width="39" height="29"/></g>
    <g fill="${r.lagoon}" opacity=".4">
      <rect x="139" y="18" width="39" height="29"/><rect x="22" y="105" width="39" height="29"/></g>
    <g font-family="Rubik,system-ui,sans-serif" font-weight="800" text-anchor="middle">
      <g fill="${e}" font-size="23">
        <rect x="64" y="50" width="33" height="26" rx="5" fill="${r.paper}" stroke="${e}" stroke-width="2.4"/>
        <text x="80" y="71">W</text>
        <rect x="103" y="50" width="33" height="26" rx="5" fill="${r.paper}" stroke="${e}" stroke-width="2.4"/>
        <text x="119" y="71">O</text>
        <rect x="103" y="79" width="33" height="26" rx="5" fill="${r.paper}" stroke="${e}" stroke-width="2.4"/>
        <text x="119" y="100">R</text>
      </g>
      <rect x="142" y="79" width="33" height="26" rx="5" fill="${r.raspberry}" stroke="${e}" stroke-width="2.4"/>
      <text x="158" y="100" fill="${r.paper}" font-size="21">★</text>
    </g>
    <g fill="${r.paper}" opacity=".8"><circle cx="14" cy="30" r="3"/><circle cx="190" cy="118" r="2.6"/></g>`},flow:{a:"#D9522B",b:"#F0855F",d:"band",s:`
    <rect x="20" y="16" width="160" height="118" rx="10" fill="${r.paper}" stroke="${e}" stroke-width="3.5"/>
    <g stroke="${r.inkSoft}" stroke-width="1.6" opacity=".22">
      <path d="M52 16v118M84 16v118M116 16v118M148 16v118M20 45h160M20 75h160M20 105h160"/></g>
    <g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="11">
      <path d="M36 30h96v30H68v30h64" stroke="${r.lagoon}"/>
      <path d="M36 90v30h32" stroke="${r.sunflower}"/>
      <path d="M164 30v90" stroke="${r.raspberry}"/></g>
    <g stroke="${e}" stroke-width="3">
      <circle cx="36" cy="30" r="9" fill="${r.lagoon}"/>
      <circle cx="132" cy="90" r="9" fill="${r.lagoon}"/>
      <circle cx="36" cy="90" r="9" fill="${r.sunflower}"/>
      <circle cx="68" cy="120" r="9" fill="${r.sunflower}"/>
      <circle cx="164" cy="30" r="9" fill="${r.raspberry}"/>
      <circle cx="164" cy="120" r="9" fill="${r.raspberry}"/></g>`},arrowtap:{a:"#0F7FD4",b:"#5AB0EE",d:"arc",s:`
    <rect x="20" y="16" width="140" height="118" rx="10" fill="${r.paper}" stroke="${e}" stroke-width="3.5"/>
    <g stroke="${r.inkSoft}" stroke-width="1.5" opacity=".2">
      <path d="M55 16v118M90 16v118M125 16v118M20 45h140M20 75h140M20 105h140"/></g>
    <g stroke="${e}" stroke-width="3">
      <rect x="26" y="22" width="46" height="46" rx="9" fill="${r.sunflower}"/>
      <rect x="94" y="22" width="46" height="46" rx="9" fill="${r.lagoon}"/>
      <rect x="26" y="82" width="46" height="46" rx="9" fill="${r.lime}"/>
      <rect x="94" y="82" width="46" height="46" rx="9" fill="${r.raspberry}"/></g>
    <g stroke="${e}" stroke-width="4.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M39 45h20m-7-7 7 7-7 7"/>
      <g transform="rotate(90 117 45)"><path d="M107 45h20m-7-7 7 7-7 7"/></g>
      <g transform="rotate(-90 49 105)"><path d="M39 105h20m-7-7 7 7-7 7"/></g>
      <path d="M107 105h20m-7-7 7 7-7 7"/></g>
    <g opacity=".55" stroke="${e}" stroke-width="4.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M168 45h18m-6-6 6 6-6 6"/></g>
    <g stroke="${r.paper}" stroke-width="3" opacity=".7" stroke-linecap="round">
      <path d="M150 38h8M150 52h8"/></g>`},fruit:{a:"#D63031",b:"#F0706F",d:"hill",s:`
    <circle cx="60" cy="22" r="12" fill="${r.lime}" stroke="${e}" stroke-width="3"/>
    <g stroke="${r.paper}" stroke-width="3" opacity=".6" stroke-linecap="round">
      <path d="M60 2v6M46 8l4 5M74 8l-4 5"/></g>
    <path d="M44 40v70a14 14 0 0 0 14 14h84a14 14 0 0 0 14-14V40"
          fill="${r.paper}" stroke="${e}" stroke-width="3.5" stroke-linecap="round"/>
    <g stroke="${e}" stroke-width="3">
      <circle cx="74" cy="94" r="26" fill="${r.jade}"/>
      <circle cx="124" cy="100" r="20" fill="${r.tangerine}"/>
      <circle cx="118" cy="60" r="15" fill="${r.raspberry}"/>
      <circle cx="86" cy="52" r="11" fill="${r.sunflower}"/></g>
    <g fill="${e}">
      <circle cx="67" cy="90" r="3"/><circle cx="81" cy="90" r="3"/>
      <circle cx="118" cy="97" r="2.6"/><circle cx="130" cy="97" r="2.6"/></g>
    <path d="M67 102q7 6 14 0" stroke="${e}" stroke-width="3" fill="none" stroke-linecap="round"/>`},parking:{a:"#E8930C",b:"#FBC15A",d:"band",s:`
    <rect x="18" y="16" width="164" height="118" rx="9" fill="${r.paper}" stroke="${e}" stroke-width="3.5"/>
    <g stroke="${r.inkSoft}" stroke-width="1.5" opacity=".2">
      <path d="M51 16v118M84 16v118M116 16v118M149 16v118M18 45h164M18 75h164M18 105h164"/></g>
    <rect x="176" y="52" width="12" height="26" fill="${r.paper}"/>
    <g stroke="${e}" stroke-width="3">
      <rect x="88" y="53" width="58" height="24" rx="7" fill="${r.clay}"/>
      <rect x="24" y="22" width="56" height="22" rx="7" fill="${r.lagoon}"/>
      <rect x="122" y="84" width="24" height="46" rx="7" fill="${r.indigo}"/>
      <rect x="26" y="60" width="24" height="46" rx="7" fill="${r.orchid}"/>
      <rect x="152" y="18" width="24" height="30" rx="7" fill="${r.jade}"/></g>
    <g fill="${r.paper}"><circle cx="100" cy="65" r="5"/><circle cx="134" cy="65" r="5"/></g>
    <g stroke="${r.paper}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M162 65h16m-6-6 6 6-6 6" stroke="${e}"/></g>`},nonogram:{a:"#4F5BD5",b:"#8B94E8",d:"band",s:`
    <rect x="52" y="30" width="112" height="98" rx="8" fill="${r.paper}" stroke="${e}" stroke-width="3.5"/>
    <g stroke="${r.inkSoft}" stroke-width="1.4" opacity=".28">
      <path d="M74 30v98M96 30v98M118 30v98M140 30v98M52 50h112M52 70h112M52 90h112M52 110h112"/></g>
    <g fill="${r.raspberry}">
      <rect x="74" y="50" width="22" height="20"/><rect x="118" y="50" width="22" height="20"/>
      <rect x="52" y="70" width="112" height="20"/>
      <rect x="74" y="90" width="68" height="20"/>
      <rect x="96" y="110" width="24" height="18"/></g>
    <rect x="52" y="30" width="112" height="98" rx="8" fill="none" stroke="${e}" stroke-width="3.5"/>
    <g fill="${e}" opacity=".8">
      <rect x="30" y="56" width="16" height="5" rx="2.5"/><rect x="36" y="76" width="10" height="5" rx="2.5"/>
      <rect x="26" y="96" width="20" height="5" rx="2.5"/><rect x="36" y="116" width="10" height="5" rx="2.5"/>
      <rect x="59" y="18" width="9" height="5" rx="2.5"/><rect x="81" y="14" width="9" height="5" rx="2.5"/>
      <rect x="81" y="22" width="9" height="5" rx="2.5"/><rect x="103" y="18" width="9" height="5" rx="2.5"/>
      <rect x="125" y="14" width="9" height="5" rx="2.5"/><rect x="125" y="22" width="9" height="5" rx="2.5"/>
      <rect x="147" y="18" width="9" height="5" rx="2.5"/></g>`},onestroke:{a:"#17B98A",b:"#63D9B6",d:"arc",s:`
    <rect x="30" y="22" width="140" height="112" rx="9" fill="${r.paper}" stroke="${e}" stroke-width="3.5"/>
    <g stroke="${r.inkSoft}" stroke-width="1.4" opacity=".22">
      <path d="M58 22v112M86 22v112M114 22v112M142 22v112M30 50h140M30 78h140M30 106h140"/></g>
    <g fill="${r.inkSoft}" opacity=".9">
      <rect x="86" y="50" width="28" height="28" rx="5"/><rect x="142" y="78" width="28" height="28" rx="5"/></g>
    <path d="M44 36h28v28h-28v28h28v28h28V92h28V64h28V36h-28"
      stroke="${r.jade}" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="44" cy="36" r="9" fill="${r.clay}" stroke="${r.paper}" stroke-width="3"/>
    <circle cx="156" cy="36" r="8.5" fill="${r.paper}" stroke="${r.jade}" stroke-width="5"/>`},wordsearch:{a:"#E4572E",b:"#F2916F",d:"hill",s:`
    <rect x="26" y="20" width="148" height="112" rx="9" fill="${r.paper}" stroke="${e}" stroke-width="3.5"/>
    <path d="M40 34l104 84" stroke="${r.sunflower}" stroke-width="20" stroke-linecap="round" opacity=".85"/>
    <g fill="${e}" opacity=".62">
      <rect x="36" y="30" width="12" height="9" rx="2"/><rect x="64" y="30" width="10" height="9" rx="2"/>
      <rect x="92" y="30" width="12" height="9" rx="2"/><rect x="120" y="30" width="9" height="9" rx="2"/>
      <rect x="146" y="30" width="12" height="9" rx="2"/>
      <rect x="36" y="52" width="10" height="9" rx="2"/><rect x="64" y="52" width="12" height="9" rx="2"/>
      <rect x="92" y="52" width="9" height="9" rx="2"/><rect x="120" y="52" width="12" height="9" rx="2"/>
      <rect x="146" y="52" width="10" height="9" rx="2"/>
      <rect x="36" y="74" width="12" height="9" rx="2"/><rect x="64" y="74" width="9" height="9" rx="2"/>
      <rect x="92" y="74" width="12" height="9" rx="2"/><rect x="120" y="74" width="10" height="9" rx="2"/>
      <rect x="146" y="74" width="12" height="9" rx="2"/>
      <rect x="36" y="96" width="9" height="9" rx="2"/><rect x="64" y="96" width="12" height="9" rx="2"/>
      <rect x="92" y="96" width="10" height="9" rx="2"/><rect x="120" y="96" width="12" height="9" rx="2"/>
      <rect x="146" y="96" width="9" height="9" rx="2"/>
      <rect x="36" y="116" width="12" height="9" rx="2"/><rect x="64" y="116" width="10" height="9" rx="2"/>
      <rect x="92" y="116" width="12" height="9" rx="2"/><rect x="120" y="116" width="9" height="9" rx="2"/>
      <rect x="146" y="116" width="12" height="9" rx="2"/></g>
    <circle cx="40" cy="34" r="7" fill="${r.clay}"/>
    <circle cx="144" cy="118" r="7" fill="${r.clay}"/>`},untangle:{a:"#A855C9",b:"#CB92E0",d:"circle",s:`
    <g stroke="${r.paper}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".55">
      <path d="M46 40L150 112M150 40L46 112M46 40L46 112M150 40L150 112M98 22L46 40M98 22L150 40M98 130L46 112M98 130L150 112"/></g>
    <g stroke="${e}" stroke-width="4" fill="none" stroke-linecap="round">
      <path d="M46 40L150 112M150 40L46 112M46 40L46 112M150 40L150 112M98 22L46 40M98 22L150 40M98 130L46 112M98 130L150 112"/></g>
    <circle cx="98" cy="76" r="11" fill="none" stroke="${r.clay}" stroke-width="4"/>
    <g fill="${r.sunflower}" stroke="${e}" stroke-width="3.5">
      <circle cx="46" cy="40" r="10"/><circle cx="150" cy="40" r="10"/>
      <circle cx="46" cy="112" r="10"/><circle cx="150" cy="112" r="10"/>
      <circle cx="98" cy="22" r="10"/></g>
    <circle cx="98" cy="130" r="14" fill="${r.lagoon}" stroke="${e}" stroke-width="3.5"/>`},survivors:{a:"#2A2570",b:"#4A42B8",d:"circle",s:`
    <g fill="${r.paper}" opacity=".9">
      <circle cx="126" cy="60" r="4"/><circle cx="140" cy="50" r="4"/>
      <circle cx="74" cy="90" r="4"/><circle cx="60" cy="100" r="4"/>
      <circle cx="122" cy="104" r="4"/></g>
    <path d="M52 32L68 58H36z" fill="${r.raspberry}" stroke="${e}" stroke-width="3.5"
          stroke-linejoin="round"/>
    <circle cx="158" cy="44" r="13" fill="${r.sunflower}" stroke="${e}" stroke-width="3.5"/>
    <path d="M150 96L166 112L150 128L134 112z" fill="${r.orchid}" stroke="${e}"
          stroke-width="3.5" stroke-linejoin="round"/>
    <g fill="${r.jade}" stroke="${e}" stroke-width="2.5" stroke-linejoin="round">
      <path d="M84 38L90 44L84 50L78 44z"/><path d="M118 122L124 128L118 134L112 128z"/></g>
    <circle cx="100" cy="76" r="15" fill="${r.lagoon}" stroke="${e}" stroke-width="3.5"/>
    <circle cx="100" cy="76" r="5" fill="${e}"/>`},chess:{a:"#6D4C41",b:"#8D6E63",d:"band",s:`
    <g stroke="${e}" stroke-width="3">
      <rect x="28" y="70" width="42" height="42" fill="${r.paper}"/>
      <rect x="70" y="70" width="42" height="42" fill="${r.inkSoft}"/>
      <rect x="28" y="112" width="42" height="34" fill="${r.inkSoft}"/>
      <rect x="70" y="112" width="42" height="34" fill="${r.paper}"/>
      <rect x="112" y="70" width="42" height="42" fill="${r.paper}"/>
      <rect x="112" y="112" width="42" height="34" fill="${r.inkSoft}"/></g>
    <path d="M86 26c14 0 24 10 24 24l-8 8 6 8-10 26H72l8-20-10 4-6-12 14-14-4-10z"
          fill="${r.sunflower}" stroke="${e}" stroke-width="3.5" stroke-linejoin="round"/>
    <circle cx="94" cy="44" r="3.4" fill="${e}"/>`},backgammon:{a:"#A85A2E",b:"#C0703F",d:"arc",s:`
    <g stroke="${e}" stroke-width="2.5" stroke-linejoin="round">
      <path d="M18 34L34 34L26 96z" fill="${r.paper}"/>
      <path d="M40 34L56 34L48 96z" fill="${r.clay}"/>
      <path d="M62 34L78 34L70 96z" fill="${r.paper}"/>
      <path d="M84 34L100 34L92 96z" fill="${r.clay}"/>
      <path d="M106 34L122 34L114 96z" fill="${r.paper}"/>
      <path d="M128 34L144 34L136 96z" fill="${r.clay}"/></g>
    <g stroke="${e}" stroke-width="3">
      <circle cx="26" cy="128" r="13" fill="${r.paper}"/>
      <circle cx="56" cy="128" r="13" fill="${e}"/>
      <circle cx="86" cy="128" r="13" fill="${r.paper}"/></g>
    <g stroke="${e}" stroke-width="3">
      <rect x="128" y="104" width="30" height="30" rx="7" fill="${r.sunflower}"/>
      <rect x="162" y="112" width="26" height="26" rx="6" fill="${r.paper}"/></g>
    <g fill="${e}">
      <circle cx="136" cy="112" r="3"/><circle cx="150" cy="126" r="3"/>
      <circle cx="175" cy="125" r="3"/></g>`},holdtheline:{a:"#8C4A1E",b:"#D98B45",d:"hill",s:`
    <rect x="14" y="40" width="46" height="106" rx="3" fill="${r.inkSoft}"
          stroke="${e}" stroke-width="3.5"/>
    <g fill="${r.inkSoft}" stroke="${e}" stroke-width="3">
      <rect x="14" y="30" width="13" height="14" rx="2"/>
      <rect x="33" y="30" width="13" height="14" rx="2"/>
      <rect x="52" y="30" width="8" height="14" rx="2"/></g>
    <path d="M26 56h16v26l-8-7-8 7z" fill="${r.clay}" stroke="${e}"
          stroke-width="3" stroke-linejoin="round"/>
    <rect x="30" y="112" width="18" height="34" rx="9" fill="${e}"/>
    <path d="M14 146h172" stroke="${r.sunflower}" stroke-width="7"
          stroke-linecap="round"/>
    <g stroke="${e}" stroke-width="3.5" stroke-linejoin="round">
      <rect x="92" y="96" width="22" height="34" rx="6" fill="${r.raspberry}"/>
      <circle cx="103" cy="84" r="11" fill="${r.paper}"/>
      <rect x="134" y="106" width="17" height="26" rx="5" fill="${r.indigo}"/>
      <circle cx="142" cy="96" r="8" fill="${r.paper}"/>
      <rect x="166" y="114" width="13" height="19" rx="4" fill="${r.jade}"/>
      <circle cx="172" cy="106" r="6" fill="${r.paper}"/></g>
    <path d="M150 44L162 56L150 68L138 56z" fill="${r.orchid}" stroke="${e}"
          stroke-width="3.5" stroke-linejoin="round"/>`},snakesurvivors:{a:"#16755F",b:"#2FB892",d:"circle",s:`
    <path d="M150 96C150 58 124 36 96 36C62 36 44 60 44 84C44 112 66 128 96 128
             C118 128 132 120 140 108" fill="none" stroke="${e}" stroke-width="21"
          stroke-linecap="round"/>
    <path d="M150 96C150 58 124 36 96 36C62 36 44 60 44 84C44 112 66 128 96 128
             C118 128 132 120 140 108" fill="none" stroke="${r.lime}" stroke-width="13"
          stroke-linecap="round"/>
    <path d="M150 96C152 116 166 132 186 136" fill="none" stroke="${e}" stroke-width="15"
          stroke-linecap="round"/>
    <path d="M150 96C152 116 166 132 186 136" fill="none" stroke="${r.indigo}" stroke-width="8"
          stroke-linecap="round"/>
    <circle cx="146" cy="100" r="14" fill="${r.jade}" stroke="${e}" stroke-width="3.5"/>
    <circle cx="142" cy="95" r="3.4" fill="${r.paper}"/><circle cx="152" cy="98" r="3.4" fill="${r.paper}"/>
    <g stroke="${e}" stroke-width="3" stroke-linejoin="round">
      <path d="M76 70L86 60L96 70L86 80z" fill="${r.raspberry}"/>
      <circle cx="110" cy="76" r="9" fill="${r.sunflower}"/>
      <path d="M84 96h20l-10 16z" fill="${r.orchid}"/></g>`},puzzlesnake:{a:"#5646C9",b:"#7B6FE0",d:"band",s:`
    <g fill="${e}" opacity=".35">
      <rect x="94" y="12" width="32" height="32" rx="6"/><rect x="94" y="84" width="32" height="32" rx="6"/>
      <rect x="130" y="84" width="32" height="32" rx="6"/></g>
    <g stroke="${e}" stroke-width="3">
      <rect x="22" y="84" width="32" height="32" rx="8" fill="${r.jade}"/>
      <rect x="22" y="48" width="32" height="32" rx="8" fill="${r.jade}"/>
      <rect x="58" y="48" width="32" height="32" rx="8" fill="${r.jade}"/>
      <rect x="94" y="48" width="32" height="32" rx="9" fill="${r.lime}"/></g>
    <circle cx="114" cy="58" r="3.6" fill="${e}"/><circle cx="114" cy="70" r="3.6" fill="${e}"/>
    <circle cx="146" cy="64" r="12" fill="${r.raspberry}" stroke="${e}" stroke-width="3"/>
    <rect x="166" y="48" width="30" height="32" rx="6" fill="none" stroke="${r.sunflower}"
          stroke-width="4" stroke-dasharray="6 5"/>`},snakearena:{a:"#0F7F60",b:"#3AAE89",d:"arc",s:`
    <g stroke="${e}" stroke-width="3">
      <rect x="14" y="92" width="24" height="24" rx="7" fill="${r.lime}"/>
      <rect x="40" y="92" width="24" height="24" rx="7" fill="${r.lime}"/>
      <rect x="66" y="92" width="24" height="24" rx="7" fill="${r.lime}"/>
      <rect x="66" y="66" width="24" height="24" rx="8" fill="${r.lime}"/>
      <rect x="160" y="14" width="24" height="24" rx="7" fill="${r.sunflower}"/>
      <rect x="160" y="40" width="24" height="24" rx="7" fill="${r.sunflower}"/>
      <rect x="134" y="40" width="24" height="24" rx="8" fill="${r.sunflower}"/>
      <rect x="160" y="118" width="24" height="24" rx="7" fill="${r.raspberry}"/>
      <rect x="134" y="118" width="24" height="24" rx="7" fill="${r.raspberry}"/>
      <rect x="134" y="92" width="24" height="24" rx="8" fill="${r.raspberry}"/></g>
    <g fill="${e}"><circle cx="74" cy="73" r="3"/><circle cx="83" cy="73" r="3"/>
      <circle cx="141" cy="47" r="3"/><circle cx="141" cy="57" r="3"/>
      <circle cx="141" cy="99" r="3"/><circle cx="151" cy="99" r="3"/></g>
    <circle cx="112" cy="72" r="12" fill="${r.clay}" stroke="${e}" stroke-width="3"/>
    <path d="M112 60c2-6 7-8 11-7-2 5-6 7-11 7z" fill="${r.lime}" stroke="${e}" stroke-width="2"/>`}},j="#1b1b2b",R="#ffffff";function S(t){const i=t.replace("#",""),l=i.length===3?[...i].map(h=>h+h).join(""):i,o=h=>{const c=parseInt(l.slice(h*2,h*2+2),16)/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4};return .2126*o(0)+.7152*o(1)+.0722*o(2)}function I(t,i){const[l,o]=[S(t),S(i)].sort((h,c)=>c-h);return(l+.05)/(o+.05)}function rr(t){return I(t,R)>I(t,j)?R:j}q(Q);const x=1080,C=648,L=64,E=j,er=rr(E),tr="system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",ir=26,lr=48;function cr(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}function or(t,i){const l=t.replace(/\s+/g," ").trim();return l.length>i?`${l.slice(0,i-1)}…`:l}function hr(t){const i=t.replace(/var\(\s*--[\w-]+\s*,\s*([^)]*)\)/g,"$1");if(i.includes("var("))throw new Error("game art carries a CSS var() with no fallback; a rasteriser paints that black");return i}function ar(t){const i=t?J(t):"";return i?hr(i.replace("<svg ",`<svg x="0" y="0" width="${x}" height="${C}" `)):`<rect width="${x}" height="${C}" fill="${E}"/>`}function m(t,i,l,o,h,c,n=ir){return`<text x="${c?x-L:L}" y="${i}" font-family="${tr}" font-size="${l}" font-weight="${o}" fill="${er}" opacity="${h}" text-anchor="${c?"end":"start"}" style="direction:${c?"rtl":"ltr"}">${cr(or(t,n))}</text>`}function sr(t){for(const h of[t.headline,t.url,...t.lines])if(H(h))throw new Error("share card carries a storage key or a backup code");const i=t.lines.slice(0,5);let l=C+96;const o=[m(t.headline,l,52,800,1,t.rtl)];for(const h of i)l+=66,o.push(m(h,l,46,500,.94,t.rtl));return`<svg xmlns="http://www.w3.org/2000/svg" width="${x}" height="${x}" viewBox="0 0 ${x} ${x}"><rect width="${x}" height="${x}" fill="${E}"/>`+ar(t.artId)+o.join("")+m(t.url,x-L,34,500,.7,!1,lr)+"</svg>"}function nr(t){return t.replace(/^[^\p{L}\p{N}]+\s+/u,"").trim()||t.trim()}const dr=6e3,xr=600*1024;function pr(){return typeof document<"u"&&typeof URL<"u"&&typeof URL.createObjectURL=="function"&&typeof HTMLCanvasElement<"u"&&typeof HTMLCanvasElement.prototype.toBlob=="function"}function fr(t){return new Promise(i=>{let l="";try{l=URL.createObjectURL(new Blob([t],{type:"image/svg+xml;charset=utf-8"}))}catch{i(null);return}const o=new Image;let h=!1;const c=a=>{if(!h){h=!0,clearTimeout(n);try{URL.revokeObjectURL(l)}catch{}i(a)}},n=setTimeout(()=>c(null),dr);o.onload=()=>c(o),o.onerror=()=>c(null),o.src=l})}async function yr(t,i){if(!pr())return null;const l=await fr(t);if(!l)return null;let o=null;try{const h=document.createElement("canvas");h.width=i,h.height=i;const c=h.getContext("2d");if(!c)return null;c.drawImage(l,0,0,i,i),o=await new Promise(n=>{h.toBlob(a=>n(a),"image/png")})}catch{return null}return!o||o.size===0||o.size>xr?null:o}function gr(t){const i=/^\d{4}-\d{2}-\d{2}$/.test(t??""),l=/^[a-z0-9][a-z0-9-]{0,23}$/.test(t??"");return`ellaz-${i||l?t:"today"}.png`}function $r(t,i){if(typeof File!="function")return null;try{return new File([t],gr(i),{type:"image/png"})}catch{return null}}function ur({locale:t,game:i,url:l,onClose:o,onTap:h}){const c=P(t),n=N[t]==="rtl",a=y.useMemo(()=>Z(i,{note:c("shareNote"),invite:c("shareInvite")},l),[i,l,t]),[s,g]=y.useState("pending"),[$,u]=y.useState(""),[A,M]=y.useState(""),b=y.useRef(null);if(y.useEffect(()=>{if(!a)return;let f=!0,p="";return(async()=>{let k=null;try{const _=sr({headline:a.headline,lines:a.items.map(nr),url:a.url,artId:i.gameId,rtl:n}),v=await yr(_,x);v&&(k=$r(v,i.gameId),p=URL.createObjectURL(v))}catch{k=null}if(!f){p&&URL.revokeObjectURL(p);return}b.current=k,p&&u(p),g(wr(k))})(),()=>{f=!1,p&&URL.revokeObjectURL(p)}},[a,n]),!a)return null;const U=c(s==="copy"||s==="show"?"shareCopy":"share");async function O(){if(h?.(),!!a){if(s==="share-with-picture"||s==="share-link-only"){const f=s==="share-with-picture"&&b.current?{files:[b.current],text:a.text}:{text:a.text,url:a.url};try{await navigator.share(f),o()}catch(p){(!(p instanceof Error)||p.name!=="AbortError")&&M(c("shareFailed"))}return}if(s==="copy")try{await navigator.clipboard.writeText(a.text),M(c("shareCopied"))}catch{M(c("shareFailed")),g("show")}}}return d.jsx("div",{role:"dialog","aria-modal":"true","aria-label":c("share"),dir:n?"rtl":"ltr",onClick:o,style:{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:16,background:"var(--badge-fill)"},children:d.jsxs("div",{onClick:f=>f.stopPropagation(),style:{width:"min(100%, 420px)",maxHeight:"90vh",overflowY:"auto",borderRadius:"var(--radius-3)",background:"var(--surface)",boxShadow:"var(--shadow-1)",padding:16,color:"var(--text)"},children:[d.jsx("h2",{style:{fontSize:20,margin:"0 0 12px"},children:c("share")}),d.jsx("div",{style:{aspectRatio:"1 / 1",borderRadius:"var(--radius-2)",overflow:"hidden",background:"var(--surface-2)",marginBottom:12},children:$?d.jsx("img",{src:$,alt:"",style:{width:"100%",height:"100%",objectFit:"cover",display:"block"}}):null}),d.jsx("p",{dir:"auto",style:{whiteSpace:"pre-wrap",userSelect:"text",fontSize:14.5,lineHeight:1.5,color:"var(--text-dim)",margin:"0 0 12px"},children:a.text}),s==="share-link-only"?d.jsx("p",{style:{fontSize:13,color:"var(--text-dim)",margin:"0 0 10px"},children:c("shareLinkOnly")}):null,A?d.jsx("p",{role:"status",style:{fontSize:13,color:"var(--text-dim)",margin:"0 0 10px"},children:A}):null,d.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:8},children:[d.jsx("button",{onClick:()=>void O(),disabled:s==="pending"||s==="show",style:{flex:"1 1 auto",minHeight:"var(--tap)",border:"none",borderRadius:"var(--radius-pill)",background:"var(--brand-strong)",color:"var(--on-brand)",fontWeight:800,fontSize:15,opacity:s==="pending"||s==="show"?.5:1},children:s==="pending"?c("loading"):U}),d.jsx("button",{onClick:()=>{V.play("tap"),o()},style:{flex:"0 0 auto",minHeight:"var(--tap)",padding:"0 16px",border:"none",borderRadius:"var(--radius-pill)",background:"var(--surface-2)",color:"var(--text)",fontWeight:700,fontSize:15},children:c("back")})]})]})})}function wr(t){const i=typeof navigator>"u"?void 0:navigator;return i&&typeof i.share=="function"?t&&typeof i.canShare=="function"&&i.canShare({files:[t]})?"share-with-picture":"share-link-only":i&&i.clipboard&&typeof i.clipboard.writeText=="function"?"copy":"show"}export{ur as ShareSheet,wr as decideAbility};
