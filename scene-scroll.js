(()=>{
const page=document.body.dataset.sitePage;
const selectors={main:'main>.snap-panel,.unified-footer','ai-video':'.hero-screen,#about>.section-head,#about>.benefits,.unified-footer',portfolio:'.hero,#portfolio,.unified-footer',contact:'#inquiry>.hero,#inquiry>.page-grid'};
if(!selectors[page])return;
let lockedUntil=0,lastWheel=0;
const header=()=>document.querySelector('sangsang-header')?.shadowRoot?.querySelector('header')?.getBoundingClientRect().height||(innerWidth<=520?104:81);

// 장면 이동: 브라우저의 부드러운 스크롤 대신 직접 움직인다 (빠르고 부드럽게, 0.45초).
// 이동하는 동안 장면 맞춤(scroll-snap)을 꺼서 아이폰에서 원래 장면으로 튕겨 돌아가지 않고,
// 매 순간 목표 위치를 다시 재서 주소창이 접히고 펴져도 정확한 자리에 멈춘다.
let gliding=false;
function glide(target){
 const html=document.documentElement,from=scrollY,t0=performance.now();
 const dur=matchMedia('(prefers-reduced-motion: reduce)').matches?0:450;
 gliding=true;html.style.scrollSnapType='none';
 const step=now=>{
  const p=dur?Math.min(1,(now-t0)/dur):1,ease=1-Math.pow(1-p,3),t=target();
  scrollTo(0,from+(t-from)*ease);
  if(p<1){requestAnimationFrame(step);return;}
  scrollTo(0,target());
  setTimeout(()=>{html.style.scrollSnapType='';gliding=false;},60);
 };
 requestAnimationFrame(step);
}

addEventListener('wheel',e=>{
 // 회원 · 장바구니 창이 열려 있으면(문서 스크롤 잠금) 뒤 페이지를 움직이지 않는다
 if(e.ctrlKey||Math.abs(e.deltaY)<3||Math.abs(e.deltaX)>Math.abs(e.deltaY)||document.querySelector('dialog[open]')||document.documentElement.style.overflow==='hidden'||e.target.closest?.('input,textarea,select,video'))return;
 const now=performance.now(),gap=now-lastWheel;lastWheel=now;
 if(now<lockedUntil){e.preventDefault();return;}
 const points=[...document.querySelectorAll(selectors[page])].map(el=>({el,y:Math.max(0,Math.round(el.getBoundingClientRect().top+scrollY-header())),h:el.getBoundingClientRect().height}));
 let i=0;for(let n=0;n<points.length;n++)if(scrollY>=points[n].y-3)i=n;
 const current=points[i],next=points[i+1],down=e.deltaY>0,view=innerHeight-header();
 let target;
 // The first banner always jumps to the next content, even when it is a little taller than the screen.
 if(down){if(!next)return;if(i>0&&current.h>view+8&&scrollY+view<next.y-8)return;target=next.y;}
 else {if(scrollY>current.y+8){if(current.h>view+8)return;target=current.y;}else {if(i===0)return;target=points[i-1].y;}}
 e.preventDefault();lockedUntil=now+700;glide(()=>target);
},{passive:false});

// Touch (phones): one swipe moves a whole scene. A short drag up goes to the next scene, a short drag
// down goes back. The last scene's top is the edge: dragging up from there scrolls the content normally.
// MAIN: 첫 배너 → 함께하고 싶은 이름 → 당신이 상상한 → "생각? 상상?" (휴대폰에서는 CSS 장면 맞춤 대신 이것만 쓴다)
// AI VIDEO: 첫 배너 → WHAT WE DO → 다음 장면
const sceneSets={main:['main>.text-hero','main>.partner','main>.statement-panel','main>.services-ab'],'ai-video':['main .hero','#about>.section-head','#about>.benefits'],contact:['#inquiry>.hero','#inquiry>.page-grid'],portfolio:['main>.hero','#portfolio']};
const scenes=sceneSets[page];
if(scenes){
 const phone=matchMedia('(max-width:750px)');
 // 각 장면이 헤더 바로 아래에 올 때의 위치 (위쪽 흰 여백(border-top)은 건너뛴다)
 const ys=()=>scenes.map((s,n)=>{const el=document.querySelector(s);if(!el)return null;if(n===0)return 0;return Math.round(el.getBoundingClientRect().top+scrollY-header()+(parseFloat(getComputedStyle(el).borderTopWidth)||0));});
 // 화면보다 긴 장면인지: 주소창이 접혔을 때의 가장 큰 화면(--site-screen-h) 기준 (주소창 때문에 조금 긴 건 장면으로 본다)
 const screenH=()=>Math.max(innerHeight,parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-screen-h'))||0);
 const tall=n=>{const el=document.querySelector(scenes[n]);return el&&el.getBoundingClientRect().height>screenH()-header()+8;};
 const go=n=>glide(()=>ys()[n]);
 let startY=null,from=-1,edge=false,touching=false;
 addEventListener('touchstart',e=>{
  startY=null;touching=true;
  if(gliding||e.touches.length!==1||document.querySelector('dialog[open]')||document.body.classList.contains('quote-open'))return;
  const y=ys();if(y.includes(null))return;
  const last=y.length-1;
  if(scrollY<y[1]-8){from=0;edge=false;}
  else{
   let k=-1;for(let n=1;n<=last;n++)if(Math.abs(scrollY-y[n])<=8)k=n;
   if(k<0)return;
   // 마지막 장면이나 화면보다 긴 장면의 맨 위: 위로 끄는 건 브라우저 스크롤 그대로, 아래로 끌면 앞 장면
   from=k;edge=k===last||tall(k);
  }
  startY=e.touches[0].clientY;
 },{passive:true});
 // 장면에서는 브라우저 스크롤을 막고 살짝 끌어도 넘긴다. 본문에서는 startY가 비어 있어 바로 돌아간다.
 addEventListener('touchmove',e=>{
  if(startY===null)return;
  const dy=startY-e.touches[0].clientY;            // > 0: finger moves up, page would scroll down
  if(edge&&dy>6){startY=null;return;}                // scrolling into the content: native scroll
  if(Math.abs(dy)>6&&e.cancelable)e.preventDefault();
 },{passive:false});
 addEventListener('touchend',e=>{
  touching=false;
  if(startY===null){queueSettle();return;}
  const dy=startY-e.changedTouches[0].clientY;startY=null;
  if(Math.abs(dy)<30)return;                         // a tap
  const to=dy>0?from+1:from-1;
  if(to>=0&&to<scenes.length)go(to);
 },{passive:true});
 addEventListener('touchcancel',()=>{touching=false;startY=null;},{passive:true});

 // 손가락으로 그냥 스크롤하다 장면들 사이에 멈추면(예: 아래 내용에서 위로 올라오다가), 움직이던 쪽의 장면에 맞춰 준다
 let lastY=scrollY,dir=0,timer=0;
 const settle=()=>{
  if(gliding||touching||!phone.matches)return;
  const y=ys();if(y.includes(null))return;
  const last=y.length-1;
  if(scrollY<=2||scrollY>=y[last]-2)return;
  if(y.some(v=>Math.abs(scrollY-v)<=2))return;
  let k=0;for(let n=0;n<=last;n++)if(scrollY>=y[n])k=n;
  if(tall(k)){const el=document.querySelector(scenes[k]);if(scrollY<y[k]+el.getBoundingClientRect().height-(innerHeight-header())-2)return;}
  go(dir<0?k:k+1);
 };
 function queueSettle(){clearTimeout(timer);timer=setTimeout(settle,150);}
 addEventListener('scroll',()=>{const d=Math.sign(scrollY-lastY);if(d)dir=d;lastY=scrollY;if(!gliding&&!touching)queueSettle();},{passive:true});
}
})();
