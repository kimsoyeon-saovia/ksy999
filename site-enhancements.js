(()=>{
const page=document.body.dataset.sitePage;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

// TOP button on every page: hidden on the first screen, shown at the bottom once the visitor scrolls past it.
{
// Looked up on every check: the contact page re-renders its first screen.
const firstScreenHeight=()=>{const el=document.querySelector('main>.hero,main .hero,#inquiry>.hero');return el?el.getBoundingClientRect().height:innerHeight;};
const top=document.createElement('button');
top.type='button';top.className='unified-top is-hidden';top.setAttribute('aria-label','맨 위로 이동');top.tabIndex=-1;top.innerHTML='<span class="top-chevron" aria-hidden="true"></span><small aria-hidden="true">TOP</small>';
document.body.append(top);
top.addEventListener('click',()=>scrollTo({top:0,behavior:reduced?'auto':'smooth'}));
function updateTop(){
 const limit=firstScreenHeight()*.6;
 const show=scrollY>limit;
 top.classList.toggle('is-hidden',!show);top.tabIndex=show?0:-1;
}
addEventListener('scroll',updateTop,{passive:true});addEventListener('resize',updateTop);updateTop();
}

// CONTACT (phone): tap the bottom estimate bar to open it as a sheet; tap the handle, title or dimmed area to close.
if(page==='contact'){
 const phone=matchMedia('(max-width:800px)');
 const setOpen=open=>document.body.classList.toggle('quote-open',open);
 document.addEventListener('click',e=>{
  if(!phone.matches||e.target.closest('dialog,sangsang-header'))return;
  const rail=e.target.closest('.quote-rail'),open=document.body.classList.contains('quote-open');
  if(!open){if(rail&&!e.target.closest('[data-add-video]')){e.preventDefault();e.stopPropagation();setOpen(true);}return;}
  if(!rail){e.preventDefault();e.stopPropagation();setOpen(false);return;}
  if(e.target.closest('.sheet-close')){e.preventDefault();e.stopPropagation();setOpen(false);return;}
  if(e.target===rail||e.target.closest('.quote h2'))setOpen(false);
 },true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('quote-open')&&!document.querySelector('dialog[open]'))setOpen(false);});
 phone.addEventListener('change',()=>setOpen(false));

 // Open sheet: a "접기" button at the top right. The estimate re-renders inside .quote, so the
 // button lives on the rail and is re-added whenever the page rebuilds the rail.
 const ensureClose=()=>{
  const rail=document.querySelector('.quote-rail');
  if(!rail||rail.querySelector(':scope>.sheet-close'))return;
  const b=document.createElement('button');b.type='button';b.className='sheet-close';b.setAttribute('aria-label','견적서 접기');
  b.innerHTML='접기<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  rail.prepend(b);
 };
 ensureClose();
 new MutationObserver(ensureClose).observe(document.querySelector('#inquiry')||document.body,{childList:true,subtree:true});

 // Swipe the open sheet down to close it: drag from the handle/title area, or anywhere once the
 // estimate is scrolled to the top. A short or slow drag springs back.
 let drag=null;
 const resetRail=rail=>{rail.style.transition='';rail.style.transform='';};
 document.addEventListener('touchstart',e=>{
  if(!phone.matches||!document.body.classList.contains('quote-open')||e.touches.length!==1)return;
  const rail=e.target.closest('.quote-rail');if(!rail||e.target.closest('.sheet-close,input,textarea,select,button,a'))return;
  const quote=rail.querySelector('.quote'),y=e.touches[0].clientY;
  const head=y-rail.getBoundingClientRect().top<90;
  if(!head&&quote&&quote.scrollTop>0)return;
  drag={rail,quote,head,y0:y,t0:performance.now(),dy:0,moving:false};
 },{passive:true});
 document.addEventListener('touchmove',e=>{
  if(!drag)return;
  const dy=e.touches[0].clientY-drag.y0;
  if(!drag.moving){
   if(dy<6){if(dy<-6&&!drag.head)drag=null;return;}
   if(!drag.head&&drag.quote&&drag.quote.scrollTop>0){drag=null;return;}
   drag.moving=true;drag.rail.style.transition='none';
  }
  e.preventDefault();
  drag.dy=Math.max(0,dy);drag.rail.style.transform=`translateY(${drag.dy}px)`;
 },{passive:false});
 const endDrag=()=>{
  if(!drag)return;const {rail,dy,moving,t0}=drag;drag=null;
  if(!moving){resetRail(rail);return;}
  const fast=dy/Math.max(1,performance.now()-t0)>.5;
  rail.style.transition='transform .22s ease-out';
  if(dy>110||(fast&&dy>40)){
   rail.style.transform='translateY(100%)';
   setTimeout(()=>{rail.style.transition='none';setOpen(false);setTimeout(()=>resetRail(rail),30);},220);
  }else{rail.style.transform='';setTimeout(()=>resetRail(rail),230);}
 };
 document.addEventListener('touchend',endDrag);document.addEventListener('touchcancel',endDrag);
}

// PORTFOLIO (touch): works like the desktop mouse-over. The first tap on a card shows its reveal
// (dimmed image + title) the way hovering does; tapping it again opens the project. Tapping
// anywhere else or scrolling returns the card to its plain image, like moving the mouse away.
if(page==='portfolio'){
 let lastPointer='mouse',active=null;
 const clear=()=>{if(active){active.classList.remove('card-active');active=null;}};
 addEventListener('pointerdown',e=>{lastPointer=e.pointerType;},true);
 document.addEventListener('click',e=>{
  if(lastPointer!=='touch')return;
  const card=e.target.closest('.portfolio-card');
  if(!card){clear();return;}
  if(card===active){clear();return;}
  e.preventDefault();e.stopPropagation();
  clear();active=card;card.classList.add('card-active');
 },true);
 addEventListener('scroll',clear,{passive:true});
}

// MAIN (phone): one-screen snapping for the first three scenes only. Once the visitor reaches the
// services ("생각? 상상?"), snapping is switched off so the rest of the page scrolls freely.
if(page==='main'){
 const services=document.querySelector('main>.services-ab');const phone=matchMedia('(max-width:750px)');
 const syncSnap=()=>{
  if(!services)return;
  const head=document.querySelector('sangsang-header')?.shadowRoot?.querySelector('header')?.getBoundingClientRect().height||104;
  const start=services.getBoundingClientRect().top+scrollY-head;
  document.documentElement.classList.toggle('main-snap-off',phone.matches&&scrollY>=start-4);
 };
 addEventListener('scroll',syncSnap,{passive:true});addEventListener('resize',syncSnap);phone.addEventListener('change',syncSnap);syncSnap();
}

// MAIN (desktop): touchpads and scrollbars can stop anywhere; when scrolling stops with the
// statement scene mostly on screen, glide it under the header so its copy sits in the vertical centre.
if(page==='main'){
 const scene=document.querySelector('.statement-panel');const desktop=matchMedia('(min-width:751px)');
 let timer=0;
 if(scene)addEventListener('scroll',()=>{
  clearTimeout(timer);
  timer=setTimeout(()=>{
   if(!desktop.matches||document.querySelector('dialog[open]'))return;
   const head=document.querySelector('sangsang-header')?.shadowRoot?.querySelector('header')?.getBoundingClientRect().height||81;
   const r=scene.getBoundingClientRect(),offset=r.top-head;
   if(Math.abs(offset)>4&&Math.abs(offset)<(innerHeight-head)*.4)scrollTo({top:scrollY+offset,behavior:reduced?'auto':'smooth'});
  },180);
 },{passive:true});
}

// AI VIDEO: the hero sentence reveals from left to right after the title and English line finish,
// and the lime buttons (hidden by CSS from the first paint) appear once that last line is in.
if(page==='ai-video'){
 const hero=document.querySelector('.hero-screen'),sub=hero&&hero.querySelector('.sub'),english=hero&&hero.querySelector('h2');
 const actions=document.querySelector('.showreel-actions');
 const showActions=()=>actions&&actions.classList.add('actions-shown');
 if(reduced||!sub)showActions();
 else{
  sub.classList.add('intro-type-pending');
  sub.addEventListener('animationend',e=>{if(e.animationName==='intro-soft-reveal')showActions();});
  setTimeout(showActions,11000);
  let started=false;
  const start=()=>{if(started)return;started=true;sub.classList.add('intro-type-playing');};
  if(english){
   const watch=new MutationObserver(()=>{if(english.classList.contains('hero-rise-complete')){watch.disconnect();start();}});
   watch.observe(english,{attributes:true,attributeFilter:['class']});
  }
  setTimeout(start,8000);
 }
}
})();
