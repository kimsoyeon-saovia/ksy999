(()=>{
const page=document.body.dataset.sitePage;
const selectors={main:'main>.snap-panel,.unified-footer','ai-video':'.hero-screen,#about>.section-head,#about>.benefits,.unified-footer',portfolio:'.hero,#portfolio,.unified-footer',contact:'#inquiry>.hero,#inquiry>.page-grid'};
if(!selectors[page])return;
let lockedUntil=0,lastWheel=0;
const header=()=>document.querySelector('sangsang-header')?.shadowRoot?.querySelector('header')?.getBoundingClientRect().height||(innerWidth<=520?104:81);
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
 e.preventDefault();lockedUntil=now+850;window.scrollTo({top:target,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
},{passive:false});

// Touch (all four pages): one swipe moves a whole scene. On the first banner (and on AI VIDEO's
// "WHAT WE DO" scene) a short drag up goes to the next scene; a short drag down at the top of a later
// scene goes back. Taps are left alone; inside the long content the page scrolls normally.
const sceneSets={main:['main>.text-hero','main>.partner'],'ai-video':['main .hero','#about>.section-head','#about>.benefits'],contact:['#inquiry>.hero','#inquiry>.page-grid'],portfolio:['main>.hero','#portfolio']};
const scenes=sceneSets[page];
if(scenes){
 const behavior=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
 const ys=()=>scenes.map(s=>{const el=document.querySelector(s);return el?Math.round(el.getBoundingClientRect().top+scrollY-header()):null;});
 let startY=null,from=-1,edge=false,jumping=false;
 // 아이폰 사파리는 장면 맞춤(scroll-snap)이 켜진 채로 부드럽게 이동하면 중간에 원래 장면으로 튕겨 돌아가고,
 // 이동 중 주소창이 접히면 목표 위치가 어긋난다: 이동하는 동안 장면 맞춤을 끄고, 멈춘 뒤 정확한 위치로 한 번 더 맞춘다
 function jump(i){
  const html=document.documentElement,target=()=>i===0?0:ys()[i];
  jumping=true;html.style.scrollSnapType='none';
  scrollTo({top:target(),behavior:behavior()});
  let done=false;
  const settle=()=>{
   if(done)return;done=true;removeEventListener('scrollend',settle);
   const t=target();if(t!==null&&Math.abs(scrollY-t)>2)scrollTo({top:t,behavior:'instant'});
   setTimeout(()=>{html.style.scrollSnapType='';jumping=false;},80);
  };
  addEventListener('scrollend',settle);setTimeout(settle,950);
 }
 addEventListener('touchstart',e=>{
  startY=null;
  if(jumping||e.touches.length!==1||document.querySelector('dialog[open]')||document.body.classList.contains('quote-open'))return;
  const y=ys();if(y.includes(null))return;
  const last=y.length-1,view=innerHeight-header();
  if(scrollY<y[1]-8){from=0;edge=false;}
  else{
   let k=-1;for(let n=1;n<=last;n++)if(Math.abs(scrollY-y[n])<=8)k=n;
   if(k<0)return;
   // 마지막 장면이나 화면보다 긴 장면의 맨 위: 위로 끄는 건 브라우저 스크롤 그대로, 아래로 끌면 앞 장면
   const el=document.querySelector(scenes[k]);
   from=k;edge=k===last||el.getBoundingClientRect().height>view+8;
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
  if(startY===null)return;
  const dy=startY-e.changedTouches[0].clientY;startY=null;
  if(Math.abs(dy)<30)return;                         // a tap
  const to=dy>0?from+1:from-1;
  if(to>=0&&to<scenes.length)jump(to);
 },{passive:true});
}
})();