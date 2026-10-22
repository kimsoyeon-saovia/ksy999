(()=>{
const page=document.body.dataset.sitePage;
const selectors={main:'main>.snap-panel,.unified-footer','ai-video':'.hero-screen,#about>.section-head,#about>.benefits,.unified-footer',portfolio:'.hero,#portfolio,.unified-footer',contact:'#inquiry>.hero,#inquiry>.page-grid'};
if(!selectors[page])return;
let lockedUntil=0,lastWheel=0;
const header=()=>document.querySelector('sangsang-header')?.shadowRoot?.querySelector('header')?.getBoundingClientRect().height||(innerWidth<=520?104:81);
addEventListener('wheel',e=>{
 if(e.ctrlKey||Math.abs(e.deltaY)<3||Math.abs(e.deltaX)>Math.abs(e.deltaY)||document.querySelector('dialog[open]')||e.target.closest?.('input,textarea,select,video'))return;
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
 addEventListener('touchmove',e=>{
  if(startY===null)return;
  const dy=startY-e.touches[0].clientY;            // > 0: finger moves up, page would scroll down
  if(mode==='edge'&&dy>6){startY=null;return;}       // scrolling into the content: native scroll
  if(Math.abs(dy)>6&&e.cancelable)e.preventDefault();
 },{passive:false});
 addEventListener('touchend',e=>{
  if(startY===null)return;
  const dy=startY-e.changedTouches[0].clientY,y=contentY();startY=null;
  if(Math.abs(dy)<30||y===null)return;               // a tap
  window.scrollTo({top:dy>0?y:0,behavior:behavior()});
 },{passive:true});
}
})();
