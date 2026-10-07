(()=>{'use strict';
const NS='http://www.w3.org/2000/svg',W=1536,H=1024;
const $=id=>document.getElementById(id), viewport=$('viewport'),scene=$('scene'),hotspots=$('hotspots'),fx=$('fx'),label=$('hoverLabel'),card=$('card');
const info={icon:$('cardIcon'),kind:$('cardKind'),title:$('cardTitle'),text:$('cardText')};
let scale=1,tx=0,ty=0,drag=null,active=null,hovered=null,focused=null,lastFocus=null,hideTimer=null,initialized=false;
window.__MAP_READY__=false;

const Z=[
['club','Клуб математиков','КРУЖОК','∑','#61b9ff','276,46 350,28 409,50 451,97 455,152 416,190 337,188 282,157 258,104','Математические кружки, олимпиадная подготовка и нестандартные задачи.'],
['magic','Волшебство естества','НАУЧНОЕ НАПРАВЛЕНИЕ','✦','#63d5bc','535,65 609,39 675,61 707,104 703,174 670,212 594,201 534,166 506,113','Эксперименты, естественные науки и исследовательские проекты.'],
['medicine','Медицинский кружок','КРУЖОК','✚','#ff7562','771,37 835,27 899,54 923,99 916,153 875,180 800,168 758,121','Практические занятия и исследования в медицинском и естественно-научном направлении.'],
['chess','Шахматы в школе','ИНТЕЛЛЕКТУАЛЬНЫЙ СПОРТ','♞','#f0bd5d','978,39 1057,34 1127,60 1155,99 1145,160 1085,192 1005,169 957,115','Логика, стратегия, концентрация и аналитическое мышление.'],
['ai','AI Courses','ТЕХНОЛОГИИ','AI','#a77cff','1190,49 1272,21 1371,42 1452,91 1465,155 1439,218 1364,248 1261,220 1178,151','Искусственный интеллект, данные и современные цифровые технологии.'],
['python','Python District','ПРОГРАММИРОВАНИЕ','⌘','#4ad1c2','169,199 238,188 317,207 373,246 384,307 350,378 273,394 187,365 139,310 142,247','Программирование, алгоритмы и практическая разработка цифровых проектов.'],
['school','Математическая школа №1','ГЛАВНОЕ ЗДАНИЕ','✦','#f0c567','653,235 728,213 833,208 925,228 976,271 974,385 935,432 848,447 751,439 673,411 637,352','Центральное пространство школы имени Х. И. Ибрагимова.'],
['robotics','Robotics Hub','ТЕХНОЛОГИИ','⚙','#4faaff','1223,370 1320,340 1424,367 1474,421 1472,503 1435,563 1355,590 1263,559 1211,499 1202,429','Инженерное пространство для робототехники, конструирования и технологий.'],
['exam','Exam Arena','ДОСТИЖЕНИЯ','★','#e84f9a','160,459 250,428 338,443 404,486 426,551 399,617 320,661 219,651 149,610 128,538','Подготовка к экзаменам и интеллектуальным соревнованиям.'],
['animation','Студия «Мульт-анимация»','ТВОРЧЕСТВО','◉','#d879ff','462,570 537,541 618,559 677,605 685,665 632,711 541,710 463,675 430,621','Создание анимации, визуальных историй и цифровых проектов.'],
['vocal','Вокал','ИСКУССТВО','♫','#ff67cf','728,641 800,612 881,625 938,675 945,729 891,778 804,772 735,738 704,683','Музыка, голос, слух и сценическое мастерство.'],
['english','English A–Z','ЯЗЫКИ','A','#4fa8ff','980,508 1051,477 1135,490 1193,548 1203,622 1153,692 1056,699 977,655 945,580','Изучение английского языка и развитие коммуникативных навыков.'],
['judo','Дзюдо','СПОРТ','◈','#5fbfff','83,720 157,690 224,711 266,758 261,822 220,869 147,870 81,835 53,778','Дисциплина, координация и физическая подготовка.'],
['dance','Танцы народов Кавказа','КУЛЬТУРА','♢','#ef63c8','398,774 478,740 565,747 641,793 653,855 605,919 503,946 414,911 360,854','Культурное наследие и традиции народного танца.'],
['basketball','Баскетбол','СПОРТ','◌','#f39a34','706,789 785,759 875,766 955,809 969,871 923,934 822,958 730,925 678,856','Командная игра, тренировки и развитие игровых навыков.'],
['volleyball','Волейбол','СПОРТ','◍','#58b8ff','1049,779 1131,745 1222,757 1308,804 1322,861 1272,930 1176,953 1080,920 1026,852','Командная спортивная секция и регулярные тренировки.']
].map(([id,name,kind,icon,color,points,text])=>({id,name,kind,icon,color,points,text}));

function S(tag,a={}){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(a))e.setAttribute(k,v);return e}
function pts(s){return s.trim().split(/\s+/).map(x=>x.split(',').map(Number))}
function center(z){const p=pts(z.points);return p.reduce((a,b)=>[a[0]+b[0]/p.length,a[1]+b[1]/p.length],[0,0])}
function apply(){scene.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`;updateLabel()}
function fitScale(r=viewport.getBoundingClientRect()){return Math.min(r.width/W,r.height/H)}
function fit(){
 const r=viewport.getBoundingClientRect(), s=Math.min(r.width/W,r.height/H);
 if(!r.width||!r.height)return false;
 scale=s;tx=(r.width-W*s)/2;ty=(r.height-H*s)/2;apply();return true
}
function screenPoint(x,y){const r=viewport.getBoundingClientRect();return {x:r.left+tx+x*scale,y:r.top+ty+y*scale}}
function clampPan(){
 const r=viewport.getBoundingClientRect(), mw=W*scale,mh=H*scale;
 if(mw<=r.width)tx=(r.width-mw)/2;else tx=Math.max(r.width-mw,Math.min(0,tx));
 if(mh<=r.height)ty=(r.height-mh)/2;else ty=Math.max(r.height-mh,Math.min(0,ty));
}
function zoomAt(f,cx,cy){
 const r=viewport.getBoundingClientRect();if(!r.width||!r.height)return;
 const fitted=fitScale(r),old=scale||fitted,min=Math.min(.25,fitted),max=Math.max(4,fitted);
 if(cx==null)cx=r.left+r.width/2;if(cy==null)cy=r.top+r.height/2;
 scale=Math.max(min,Math.min(max,old*f));
 const lx=(cx-r.left-tx)/old,ly=(cy-r.top-ty)/old;
 tx=cx-r.left-lx*scale;ty=cy-r.top-ly*scale;clampPan();apply();if(active)placeCard(active)
}
function showLabel(z){
 const [x,y]=center(z),p=screenPoint(x,y);label.textContent=z.name;label.style.setProperty('--accent',z.color);label.hidden=false;
 const w=label.offsetWidth||160,h=label.offsetHeight||34;label.style.left=Math.max(8,Math.min(innerWidth-w-8,p.x-w/2))+'px';label.style.top=Math.max(8,Math.min(innerHeight-h-8,p.y-h-14))+'px'
}
function hideLabel(){label.hidden=true}
function updateLabel(){const z=focused||hovered;if(z&&!active)showLabel(z);else hideLabel()}
function placeCard(z){
 if(innerWidth<=760)return;
 const [x,y]=center(z),p=screenPoint(x,y),cw=card.offsetWidth,ch=card.offsetHeight,pad=12;
 let left=p.x+22,top=p.y-ch/2;
 if(left+cw>innerWidth-pad)left=p.x-cw-22;
 if(left<pad)left=Math.max(pad,Math.min(innerWidth-cw-pad,p.x-cw/2));
 top=Math.max(pad,Math.min(innerHeight-ch-pad,top));
 card.style.left=left+'px';card.style.top=top+'px';card.style.bottom='auto'
}
function open(z,trigger){
 if(hideTimer){clearTimeout(hideTimer);hideTimer=null}active=z;if(trigger)lastFocus=trigger;
 info.icon.textContent=z.icon;info.kind.textContent=z.kind;info.title.textContent=z.name;info.text.textContent=z.text;
 card.style.setProperty('--accent',z.color);card.hidden=false;requestAnimationFrame(()=>{if(active!==z)return;placeCard(z);card.classList.add('show');$('close').focus({preventScroll:true})});hideLabel()
}
function close(){
 if(!active&&card.hidden)return;const restore=lastFocus;active=null;lastFocus=null;card.classList.remove('show');
 hideTimer=setTimeout(()=>{if(!active){card.hidden=true;if(restore?.isConnected)restore.focus({preventScroll:true})}hideTimer=null},200)
}
function build(){
 const defs=S('defs');defs.innerHTML='<filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';fx.append(defs);
 const routes=['M764 438 L806 551 L1022 622','M764 438 L565 628 L497 820','M807 551 L835 749 L827 890','M807 551 L1105 570','M764 438 L1048 179','M764 438 L1302 473','M565 628 L306 579'];
 routes.forEach((d,i)=>fx.append(S('path',{d,class:'route',style:`--d:${7+i*.8}s;--delay:${-i*.7}s`})));
 Z.forEach((z,i)=>{
   const p=pts(z.points),[cx,cy]=center(z);
   // Invisible hit area only: no stroke, no fill, no visual boundary.
   const h=S('polygon',{points:z.points,class:'hotspot',tabindex:'0',role:'button','aria-label':z.name});
   h.addEventListener('pointerenter',()=>{hovered=z;updateLabel()});h.addEventListener('pointerleave',()=>{if(hovered===z)hovered=null;updateLabel()});h.addEventListener('focus',()=>{focused=z;updateLabel()});h.addEventListener('blur',()=>{if(focused===z)focused=null;updateLabel()});h.addEventListener('click',()=>open(z,h));
   h.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(z,h)}});hotspots.append(h);
   // Controlled local life inside the object, not random global particles.
   [[.30,.35],[.53,.44],[.68,.62]].forEach((q,j)=>{
     const a=p[j%p.length],b=p[(j+1)%p.length];
     const x=a[0]+(b[0]-a[0])*q[0],y=a[1]+(b[1]-a[1])*q[1];
     fx.append(S('circle',{cx:x,cy:y,r:2.2,class:'window',style:`--c:${z.color};--d:${3.3+j*.7+(i%3)*.2}s;--delay:${-(i*.19+j*.73)}s`}));
   });
   fx.append(S('circle',{cx,cy,r:16,class:'beacon',style:`--c:${z.color};--delay:${-i*.31}s`}));
   fx.append(S('polygon',{points:z.points,class:'shimmer',style:`--c:${z.color};--delay:${-i*.23}s`}));
 });
}
viewport.addEventListener('wheel',e=>{if(!e.deltaY)return;e.preventDefault();const unit=e.deltaMode===1?16:e.deltaMode===2?viewport.clientHeight:1,delta=Math.max(-240,Math.min(240,e.deltaY*unit));zoomAt(Math.exp(-delta*.0015),e.clientX,e.clientY)},{passive:false});
viewport.addEventListener('pointerdown',e=>{if(drag||!e.isPrimary||e.button!==0||e.target.closest?.('.hotspot'))return;drag={x:e.clientX,y:e.clientY,tx,ty,id:e.pointerId};viewport.setPointerCapture(e.pointerId);viewport.classList.add('dragging')});
viewport.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;tx=drag.tx+e.clientX-drag.x;ty=drag.ty+e.clientY-drag.y;clampPan();apply();if(active)placeCard(active)});
function endDrag(e){if(!drag||e.pointerId!==drag.id)return;drag=null;viewport.classList.remove('dragging')}
viewport.addEventListener('pointerup',endDrag);viewport.addEventListener('pointercancel',endDrag);viewport.addEventListener('lostpointercapture',endDrag);
viewport.addEventListener('keydown',e=>{if(e.target!==viewport||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const n=e.shiftKey?80:32;if(e.key==='ArrowLeft')tx+=n;if(e.key==='ArrowRight')tx-=n;if(e.key==='ArrowUp')ty+=n;if(e.key==='ArrowDown')ty-=n;clampPan();apply();if(active)placeCard(active)});
viewport.addEventListener('dblclick',e=>{if(!e.target.closest?.('.hotspot'))zoomAt(1.45,e.clientX,e.clientY)});
$('zoomIn').onclick=()=>zoomAt(1.25);$('zoomOut').onclick=()=>zoomAt(.8);$('reset').onclick=()=>{if(fit()&&active)placeCard(active)};$('close').onclick=close;
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});window.addEventListener('resize',()=>{if(fit()&&active)placeCard(active)});
const map=$('map'),retry=$('retry');
function start(){
 if(initialized)return;initialized=true;build();const app=$('app');app.hidden=false;
 requestAnimationFrame(()=>{fit();const L=$('loader'),T=$('loaderText'),steps=['ЗАГРУЗКА КАРТЫ','АКТИВАЦИЯ 16 ОБЪЕКТОВ','ЗАПУСК ОСВЕЩЕНИЯ','ГОРОД ГОТОВ'];let i=0;const t=setInterval(()=>{T.textContent=steps[i++];if(i===steps.length){clearInterval(t);setTimeout(()=>{L.classList.add('out');setTimeout(()=>{L.remove();app.removeAttribute('inert');app.removeAttribute('aria-hidden');window.__MAP_READY__=true},700)},220)}},330)})
}
function loadError(){const T=$('loaderText');T.textContent='НЕ УДАЛОСЬ ЗАГРУЗИТЬ КАРТУ';T.setAttribute('role','alert');retry.hidden=false}
map.addEventListener('load',start,{once:true});map.addEventListener('error',loadError);
retry.addEventListener('click',()=>{const T=$('loaderText');retry.hidden=true;T.removeAttribute('role');T.textContent='ПОВТОРНАЯ ЗАГРУЗКА';map.src=`school-map.png?retry=${Date.now()}`});
if(map.complete){if(map.naturalWidth)map.dispatchEvent(new Event('load'));else loadError()}
})();
