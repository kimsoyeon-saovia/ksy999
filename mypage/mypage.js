// 마이페이지: 주문 내역 · 상담 신청 내역 · 회원 정보 · 로그아웃 · 회원 탈퇴
// 로그인하면 member-db.js가 회원 계정(Firebase)에 저장된 주문 · 상담 · 장바구니를 이 브라우저로 불러오고, 여기서는 그 값을 읽는다.
(()=>{
const C=window.INQUIRY_CONFIG;
const MEMBERS='sangsang-members-v2',SESSION='sangsang-member-session',ORDERS='sangsang-orders',INQUIRIES='sangsang-studio-inquiries-v1',DRAFT='sangsang-studio-draft-v1';
const shop=document.querySelector('#shop');
const money=n=>Number(n||0).toLocaleString('ko-KR')+'원';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const date=iso=>{const d=new Date(iso);return isNaN(d)?'':`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};
const openLogin=()=>document.querySelector('sangsang-header')?.shadowRoot?.querySelector('[data-member]')?.click();
const me=()=>{const s=read(SESSION,null);if(!s?.id)return null;const m=read(MEMBERS,{})[s.id];return m?{id:s.id,...m}:null};
const myOrders=m=>(read(ORDERS,[])||[]).filter(o=>o.memberId===m.id).sort((a,b)=>b.date.localeCompare(a.date));
const myConsults=m=>(read(INQUIRIES,[])||[]).filter(r=>r.memberId===m.id||(m.phone&&r.fields?.contact===m.phone)).sort((a,b)=>b.savedAt.localeCompare(a.savedAt));
const cartCount=()=>{const it=read(DRAFT,{})?.personal?.items;return Array.isArray(it)?it.reduce((n,i)=>n+(Number(i.quantity)||1),0):0};
const head=sub=>`<div class="shop-head"><h1>마이페이지</h1>${sub||''}</div>`;
const icon='<svg viewBox="0 0 24 24" fill="none" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>';

function render(msg){
 const m=me();
 if(!m){
  shop.innerHTML=head()+`<div class="empty">${icon}<h2>${msg||'로그인이 필요합니다'}</h2><p>${msg?'이 브라우저에 저장된 회원 정보와 주문 · 상담 내역을 모두 지웠습니다.':'주문 내역과 상담 신청 내역은 로그인한 뒤 볼 수 있습니다.'}</p><div class="my-empty-btns"><button type="button" class="cta" data-login>로그인 · 회원가입</button><a class="sub-cta" href="../contact/index.html">견적 내러 가기</a></div></div>`;
  return;
 }
 const orders=myOrders(m),consults=myConsults(m),cart=cartCount();
 const a=m.address||{};
 shop.innerHTML=head(`<ul class="my-stats"><li><b>${orders.length}</b>주문</li><li><b>${consults.length}</b>상담 신청</li><li><a href="../cart/index.html"><b>${cart}</b>장바구니</a></li></ul>`)+`
<div class="shop-body"><div>
<section class="block"><div class="block-title"><h2>주문 내역</h2><small>최근 주문부터</small></div>
${orders.length?orders.map(o=>`<article class="my-card">
 <div class="my-card-top"><div><strong class="my-no">${esc(o.no)}</strong><span class="my-date">${date(o.date)}</span></div><span class="my-state">결제 완료</span></div>
 <ul class="my-items">${(o.items||[]).map(i=>`<li><span>${esc(i.quality)} · ${esc(i.duration)} × ${i.quantity}</span><span>${money(i.price)}</span></li>`).join('')}</ul>
 <div class="my-card-foot"><span>${esc(o.method)}</span><span>총 결제 금액 <strong>${money(o.total)}</strong></span></div>
 <button type="button" class="ghost my-again" data-again="${esc(o.no)}">같은 영상 다시 담기</button>
</article>`).join(''):`<div class="my-none">아직 주문 내역이 없습니다. <a class="text-link" href="../contact/index.html">견적 내러 가기</a></div>`}
</section>
<section class="block"><div class="block-title"><h2>상담 신청 내역</h2><small>장바구니에서 신청한 상담</small></div>
${consults.length?consults.map(r=>`<article class="my-card">
 <div class="my-card-top"><div><strong>결제 전 상담</strong><span class="my-date">${date(r.savedAt)}</span></div><span class="my-state gray">접수 완료</span></div>
 <p class="my-req">${esc((r.fields?.request||'').split('\n').slice(0,3).join(' / '))}</p>
 <div class="my-card-foot"><span>희망 시간 ${esc(r.fields?.time||'-')}</span><span>연락처 ${esc(r.fields?.contact||'-')}</span></div>
</article>`).join(''):`<div class="my-none">상담 신청 내역이 없습니다.</div>`}
</section></div>
<aside class="summary my-info" aria-label="회원 정보"><h2>회원 정보</h2>
<dl><div><dt>아이디</dt><dd>${esc(m.id)}</dd></div><div><dt>이름</dt><dd>${esc(m.name)}</dd></div><div><dt>휴대폰</dt><dd>${esc(m.phone||'-')}</dd></div><div><dt>이메일</dt><dd>${esc(m.email||'-')}</dd></div>
<div class="addr"><dt>주소</dt><dd>${a.addr1?`(${esc(a.zip)}) ${esc(a.addr1)}${a.addr2?'<br>'+esc(a.addr2):''}`:'등록된 주소 없음'}</dd></div><div><dt>가입일</dt><dd>${date(m.joined).slice(0,10)}</dd></div></dl>
<button type="button" class="sub-cta" data-logout>로그아웃</button>
<button type="button" class="my-leave" data-leave>회원 탈퇴</button>
<p class="note">회원 정보 · 장바구니 · 주문 내역은 회원 계정에 저장되어 다른 기기에서 로그인해도 그대로 보입니다. 결제는 시연용입니다.</p>
</aside></div>`;
}

shop.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-login')){openLogin();return}
 // 로그인 · 탈퇴는 member-db.js(Firebase)가 처리하고, 끝나면 sangsang-member-change 로 다시 그린다
 if(b.hasAttribute('data-logout')){window.SangsangDB?.logout().catch(()=>{});return}
 if(b.hasAttribute('data-leave')){
  const m=me();if(!m)return;
  if(!confirm(`${m.name}님, 회원 탈퇴할까요?\n회원 정보와 장바구니 · 주문 · 상담 내역이 모두 삭제됩니다.`))return;
  b.disabled=true;
  window.SangsangDB.leave().then(()=>{
   write(ORDERS,(read(ORDERS,[])||[]).filter(o=>o.memberId!==m.id));
   write(INQUIRIES,(read(INQUIRIES,[])||[]).filter(r=>!(r.memberId===m.id||(m.phone&&r.fields?.contact===m.phone))));
   render('탈퇴가 완료되었습니다');
  }).catch(err=>{b.disabled=false;alert('탈퇴하지 못했습니다. '+window.SangsangDB.errorText(err)+'\n(오래 로그인해 둔 경우 다시 로그인한 뒤 탈퇴해 주세요.)')});
  return;
 }
 if(b.dataset.again){
  const o=myOrders(me()).find(x=>x.no===b.dataset.again);if(!o||!C)return;
  const d=read(DRAFT,{})||{};const p=d.personal||(d.personal={});const items=Array.isArray(p.items)?p.items:(p.items=[]);
  let next=Number(p.nextVideoId)||items.reduce((n,i)=>Math.max(n,Number(i.id)||0),0);
  for(const i of o.items||[]){
   const q=C.qualities.find(x=>x.name===i.quality),du=C.durations.find(x=>x.name===i.duration);if(!q||!du)continue;
   const same=items.find(x=>x.quality===q.id&&x.duration===du.id);
   if(same)same.quantity=(Number(same.quantity)||1)+i.quantity;else items.push({id:String(++next),quality:q.id,duration:du.id,quantity:i.quantity});
  }
  p.nextVideoId=next;write(DRAFT,d);window.dispatchEvent(new Event('sangsang-cart-change'));
  location.href='../cart/index.html';
 }
});
// 헤더의 MEMBER 창에서 로그인 · 로그아웃하면 바로 다시 그린다
window.addEventListener('sangsang-member-change',()=>render());
window.addEventListener('sangsang-data-sync',()=>render());
window.addEventListener('storage',e=>{if([MEMBERS,SESSION,ORDERS,INQUIRIES,DRAFT].includes(e.key))render()});
render();
})();
