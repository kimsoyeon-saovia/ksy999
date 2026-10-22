(()=>{
const script=document.currentScript;const root=new URL('.',script.src);
const page=document.body.dataset.sitePage;
const host=document.createElement('sangsang-header');const shadow=host.attachShadow({mode:'open'});
shadow.innerHTML=`<style>
:host{display:block;position:fixed;top:0;left:0;width:100%;z-index:1000;color:#080808;font-family:UnifiedSeoul,Arial,sans-serif;font-size:16px;line-height:normal}
*{box-sizing:border-box}header{height:81px;padding:0 4%;display:flex;align-items:center;justify-content:space-between;gap:24px;background:#fff;border-bottom:1px solid #eee}
a{color:inherit;text-decoration:none}.logo{display:flex;align-items:center;gap:12px;flex-shrink:0}.logo span{font:800 13px Arial;letter-spacing:5px}.logo strong{font-size:34px;font-weight:800}
nav{display:flex;align-items:center;justify-content:flex-end;gap:12px;min-width:0;overflow-x:auto}nav a{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;font-size:19px;line-height:1.1;padding:10px 16px;white-space:nowrap;font-weight:500;font-family:"Segoe UI",Arial,sans-serif;text-rendering:optimizeLegibility}
nav a:hover,nav a[aria-current="page"]{background:#e0ff4f}a:focus-visible{outline:2px solid #1754ff;outline-offset:2px}
@media(max-width:1200px){header{gap:16px}nav{justify-content:flex-start}}
@media(max-width:750px){header{padding:0 4%;gap:12px}.logo{gap:12px}.logo span{font-size:9px;letter-spacing:2px}.logo strong{font-size:27px}nav{gap:4px}nav a{font-size:12px;padding:10px 7px}}
@media(max-width:520px){header{height:104px;padding:8px 4% 6px;flex-direction:column;justify-content:center;gap:14px}.logo span{font-size:12px;letter-spacing:3px}.logo strong{font-size:35px;line-height:1.1}nav{width:100%;justify-content:space-between}nav a{font-size:12px;padding:9px 7px}}
</style><header><a class="logo" href="${new URL('main/index.html',root)}" aria-label="STUDIO 상상 홈"><span>STUDIO</span><strong>상상</strong></a><nav aria-label="주 메뉴">${[['main','ABOUT US'],['ai-video','AI VIDEO'],['portfolio','PORTFOLIO'],['contact','CONTACT']].map(([key,label])=>'<a href="'+new URL(key+'/index.html',root)+'" '+(key===page?'aria-current="page"':'')+'>'+label+'</a>').join('')}</nav></header>`;
document.body.prepend(host);
for(const file of ['member-db.js','member.js','cart.js']){const s=document.createElement('script');s.src=new URL(file+new URL(script.src).search,root);s.async=false;document.head.append(s);}
// The header paints right away; everything that needs the full page waits until it has been parsed
// (pages that load this script early, like the large portfolio page, would otherwise show the header late).
const finish=()=>{
const enhancements=document.createElement('script');enhancements.src=new URL('site-enhancements.js'+new URL(script.src).search,root);document.body.append(enhancements);
// Keep displayed copy clean without changing JavaScript, media URLs or data URLs.
function cleanCopy(node){
 if(node.nodeType===3){if(!node.parentElement?.closest('script,style,textarea')&&node.data.includes(','))node.data=node.data.replaceAll(',','');return;}
 if(node.nodeType!==1||node.matches('script,style,textarea'))return;
 for(const name of ['title','alt','aria-label'])if(node.hasAttribute(name))node.setAttribute(name,node.getAttribute(name).replaceAll(',',''));
 for(const child of node.childNodes)cleanCopy(child);
}
cleanCopy(document.body);
new MutationObserver(records=>{for(const r of records){if(r.type==='characterData')cleanCopy(r.target);else for(const n of r.addedNodes)cleanCopy(n);}}).observe(document.body,{childList:true,subtree:true,characterData:true});
const footer=document.createElement('footer');footer.className='unified-footer';
footer.innerHTML=`<div><div class="footer-links">${[['main','ABOUT US'],['ai-video','AI VIDEO'],['portfolio','PORTFOLIO'],['contact','CONTACT']].map(([key,label])=>`<a href="${new URL(key+'/index.html',root)}">${label}</a>`).join('')}</div><p>© 2026 STUDIO SANGSANG. All rights reserved. · <a class="admin-link" href="${new URL('admin/index.html',root)}">회원 관리</a></p></div><div>제작 상담　 평일 10:00 ~ 19:00 (주말 공휴일 휴무)<br>대표번호 : 0507-8765-4321<br>E-mail : main@sangsangstudio.com</div><div>대표 : 이상상<br>주소 : 서울 강서구 화곡로 149 (화곡동)</div>`;
document.body.append(footer);
if(page==='portfolio'){
 const video=document.querySelector('.portfolio-banner-video');
 if(video){
  const reveal=()=>video.closest('.hero').classList.add('banner-ended');
  const revealWhenReady=()=>{
   if(video.currentTime>=1.9){reveal();video.removeEventListener('timeupdate',revealWhenReady);}
  };
  video.addEventListener('timeupdate',revealWhenReady);
  video.addEventListener('error',reveal);
  video.muted=true;
  video.play().catch(()=>{
   video.controls=true;
   video.style.zIndex='0';
   video.addEventListener('playing',()=>{video.controls=false;video.style.zIndex='';},{once:true});
  });
 }
}
document.addEventListener('click',event=>{
 const target=event.target.closest('a,button');if(!target)return;
 let destination=null;
 const label=target.textContent.trim();
 if(target.matches('[data-subpage]'))destination={about:'main','ai-video':'ai-video',portfolio:'portfolio',contact:'contact'}[target.dataset.subpage];
 if(page==='main'&&target.matches('.inquiry'))destination='contact';
 if(page==='portfolio'&&target.matches('.cta'))destination='contact';
 if(page==='ai-video'&&target.matches('#portfolio-open'))destination='portfolio';
 if(page==='ai-video'&&target.matches('#inquiry-open,#consult'))destination='contact';
 if(target.tagName==='A'&&['ABOUT US','AI VIDEO','PORTFOLIO','CONTACT'].includes(label))destination={'ABOUT US':'main','AI VIDEO':'ai-video',PORTFOLIO:'portfolio',CONTACT:'contact'}[label];
 if(destination){event.preventDefault();event.stopImmediatePropagation();location.href=new URL(destination+'/index.html',root);}
},true);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',finish,{once:true});else finish();
})();
