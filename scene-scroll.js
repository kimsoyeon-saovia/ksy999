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

// Touch (all four pages): one swipe on the first banner moves straight to the next content,
// and a downward swipe at the top of the content goes back. This does not wait for the banner text,
// fonts or images to finish loading. Taps are left alone; inside the content the page scrolls normally.
const firstJump={main:['main>.text-hero','main>.partner'],'ai-video':['main .hero','#about'],contact:['#inquiry>.hero','#inquiry>.page-grid'],portfolio:['main>.hero','#portfolio']}[page];
if(firstJump){
 const behavior=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
 const contentY=()=>{const el=document.querySelector(firstJump[1]);return el?Math.round(el.getBoundingClientRect().top+scrollY-header()):null;};
 let startY=null,mode=null;
 addEventListener('touchstart',e=>{
  startY=null;mode=null;
  if(e.touches.length!==1||document.querySelector('dialog[open]')||document.body.classList.contains('quote-open'))return;
  const y=contentY();if(y===null)return;
  if(scrollY<y-8)mode='banner';else if(scrollY<=y+8)mode='edge';else return;
  startY=e.touches[0].clientY;
 },{passive:true});
 // 막는(passive:false) 손가락 이동은 첫 배너 위에서만 받는다. 페이지 전체에 걸면 본문을 스크롤할 때마다
 // 브라우저가 이 코드를 기다려서 스크롤이 버벅인다. 본문 맨 위에서는 브라우저 스크롤에 그대로 맡긴다.
 // (컨텍트는 첫 화면을 다시 그리므로, 새 배너가 생기면 손가락을 댈 때 다시 연결한다)
 const bound=new WeakSet();
 const holdBanner=e=>{
  if(startY===null||mode!=='banner')return;
  if(Math.abs(startY-e.touches[0].clientY)>6&&e.cancelable)e.preventDefault();
 };
 const bindBanner=()=>{const el=document.querySelector(firstJump[0]);if(el&&!bound.has(el)){bound.add(el);el.addEventListener('touchmove',holdBanner,{passive:false});}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindBanner,{once:true});else bindBanner();
 addEventListener('load',bindBanner,{once:true});addEventListener('touchstart',bindBanner,{passive:true,capture:true});
 addEventListener('touchmove',e=>{
  if(startY!==null&&mode==='edge'&&startY-e.touches[0].clientY>6)startY=null;   // scrolling into the content: native scroll
 },{passive:true});
 addEventListener('touchend',e=>{
  if(startY===null)return;
  const dy=startY-e.changedTouches[0].clientY,y=contentY();startY=null;
  if(Math.abs(dy)<30||y===null)return;               // a tap
  window.scrollTo({top:dy>0?y:0,behavior:behavior()});
 },{passive:true});
}
})();
