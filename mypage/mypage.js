// 마이페이지: 주문 내역 · 상담 신청 내역 · 회원 정보 · 로그아웃 · 회원 탈퇴
// 로그인하면 member-db.js가 회원 계정(Firebase)에 저장된 주문 · 상담 · 장바구니를 이 브라우저로 불러오고, 여기서는 그 값을 읽는다.
(()=>{
const C=window.INQUIRY_CONFIG;
const MEMBERS='sangsang-members-v2',SESSION='sangsang-member-session',ORDERS='sangsang-orders',INQUIRIES='sangsang-studio-inquiries-v1',DRAFT='sangsang-studio-draft-v1';
const shop=document.querySelector('#shop');
const money=n=>String(Math.round(Number(n)||0)).replace(/\B(?=(\d{3})+(?!\d))/g,',')+'원';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const date=iso=>{const d=new Date(iso);return isNaN(d)?'':`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};
const openLogin=()=>document.querySelector('sangsang-header')?.shadowRoot?.querySelector('[data-member]')?.click();
const me=()=>{const s=read(SESSION,null);if(!s?.id)return null;const m=read(MEMBERS,{})[s.id];return m?{id:s.id,...m}:null};
const myOrders=m=>(read(ORDERS,[])||[]).filter(o=>o.memberId===m.id).sort((a,b)=>b.date.localeCompare(a.date));
const myConsults=m=>(read(INQUIRIES,[])||[]).filter(r=>r.memberId===m.id||(m.phone&&r.fields?.contact===m.phone)).sort((a,b)=>b.savedAt.localeCompare(a.savedAt));
const CART='sangsang-cart-v1';
const cartCount=()=>{const it=read(CART,{})?.items;return Array.isArray(it)?it.reduce((n,i)=>n+(Number(i.quantity)||1),0):0};
const head=sub=>`<div class="shop-head"><h1>마이페이지</h1>${sub||''}</div>`;
const icon='<svg viewBox="0 0 24 24" fill="none" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>';

// 포인트 잔액 · 내역은 회원 계정(userdata/{uid}.points)에서 읽는다 (1포인트 = C.pointValue원)
let pts=null,ptsFor=null;
function loadPoints(m){
 if(!window.SangsangDB||ptsFor===m.id)return;ptsFor=m.id;
 window.SangsangDB.whenAuthKnown().then(()=>window.SangsangDB.points()).then(p=>{pts=p;render()}).catch(()=>{pts={balance:0,history:[],error:true};render()});
}
const point=n=>String(Math.round(Number(n)||0)).replace(/\B(?=(\d{3})+(?!\d))/g,',')+'포인트';
function pointsHTML(){
 if(!pts)return `<section class="block my-points"><div class="block-title"><h2>포인트</h2></div><div class="my-none">포인트를 불러오는 중입니다…</div></section>`;
 // 충전은 견적 페이지의 충전 상품을 장바구니에 담아 결제한다. 여기서는 잔액과 충전 · 사용 내역만 보여 준다
 const used=pts.history.filter(h=>h.amount<0).reduce((n,h)=>n-h.amount,0);
 return `<section class="block my-points"><div class="block-title"><h2>포인트</h2><small>1포인트 = ${C?.pointValue||1}원 · 결제할 때 사용</small></div>
<div class="pt-balance"><span>현재 남은 포인트</span><strong>${point(pts.balance)}</strong>${used?`<em>지금까지 ${point(used)} 사용</em>`:''}<a class="pt-go" href="../contact/personal.html">포인트 충전하러 가기 →</a></div>
<div class="block-title pt-title"><h3>포인트 충전 · 사용 내역</h3><small>최근 내역부터</small></div>
${pts.history.length?`<ul class="my-items pt-history">${pts.history.map(h=>`<li><span><b class="${h.amount<0?'minus':'plus'}">${h.amount<0?'사용':'충전'}</b>${date(h.date)} · ${esc(h.memo||'')}</span><span class="${h.amount<0?'minus':'plus'}">${h.amount>0?'+':''}${point(h.amount)}</span></li>`).join('')}</ul>`:'<div class="my-none">아직 포인트 내역이 없습니다.</div>'}
</section>`;
}

// 회원정보 수정: 수정하는 동안에는 다시 그리지 않아 입력값(한글 입력 포함)이 지워지지 않는다
let editing=false;
const isPhone=v=>/^01[016789]-\d{3,4}-\d{4}$/.test(v),isEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const fmtPhone=v=>{const d=String(v||'').replace(/\D/g,'').slice(0,11);return d.length<4?d:d.length<8?`${d.slice(0,3)}-${d.slice(3)}`:`${d.slice(0,3)}-${d.slice(3,d.length-4)}-${d.slice(-4)}`};
// 1단계: 현재 비밀번호 확인 → 2단계: 맞으면 수정 칸이 열린다
let editPw='';
function editHTML(m){
 const a=m.address||{},f=(n,label,v,attr='')=>`<label class="my-edit-f"><span>${label}</span><input name="${n}" value="${esc(v||'')}" ${attr}></label>`;
 if(editing==='check')return `<form class="my-edit" data-step="check" novalidate>
<p class="my-edit-guide">회원 정보를 보호하기 위해 비밀번호를 한 번 더 입력해 주세요.</p>
${f('password','현재 비밀번호 *','','type="password" autocomplete="current-password" placeholder="비밀번호"')}
<p class="my-edit-msg" role="status"></p>
<button type="submit" class="cta">확인</button><button type="button" class="sub-cta" data-edit-cancel>취소</button></form>`;
 return `<form class="my-edit" data-step="form" novalidate>
${f('name','이름',m.name,'autocomplete="name"')}${f('phone','휴대폰',m.phone,'type="tel" inputmode="numeric" maxlength="13"')}${f('email','이메일',m.email,'type="email"')}
${f('zip','우편번호',a.zip)}${f('addr1','주소',a.addr1)}${f('addr2','상세 주소',a.addr2)}
${f('newPassword','새 비밀번호 (변경할 때만)','','type="password" autocomplete="new-password" placeholder="영문·숫자 포함 8자 이상"')}
${f('newPassword2','새 비밀번호 확인','','type="password" autocomplete="new-password" placeholder="새 비밀번호 다시 입력"')}
<p class="my-edit-msg" role="status"></p>
<button type="submit" class="cta">저장</button><button type="button" class="sub-cta" data-edit-cancel>취소</button></form>`;
}

function render(msg){
 if(editing&&!msg&&shop.querySelector('.my-edit'))return;
 const m=me();if(!m)editing=false;
 if(!m){pts=null;ptsFor=null}else loadPoints(m);
 if(!m){
  shop.innerHTML=head()+`<div class="empty">${icon}<h2>${msg||'로그인이 필요합니다'}</h2><p>${msg?'이 브라우저에 저장된 회원 정보와 주문 · 상담 내역을 모두 지웠습니다.':'주문 내역과 상담 신청 내역은 로그인한 뒤 볼 수 있습니다.'}</p><div class="my-empty-btns"><button type="button" class="cta" data-login>로그인 · 회원가입</button><a class="sub-cta" href="../contact/index.html">견적 내러 가기</a></div></div>`;
  return;
 }
 const orders=myOrders(m),consults=myConsults(m),cart=cartCount();
 const a=m.address||{};
 shop.innerHTML=head(`<ul class="my-stats"><li><b>${orders.length}</b>주문</li><li><b>${consults.length}</b>상담 신청</li><li><a href="../cart/index.html"><b>${cart}</b>장바구니</a></li></ul>`)+`
<div class="shop-body"><div>
${pointsHTML()}
<section class="block"><div class="block-title"><h2>주문 내역</h2><small>최근 주문부터</small></div>
${orders.length?orders.map(o=>`<article class="my-card">
 <div class="my-card-top"><div><strong class="my-no">${esc(o.no)}</strong><span class="my-date">${date(o.date)}</span></div><span class="my-state">결제 완료</span></div>
 <ul class="my-items">${(o.items||[]).map(i=>`<li><span>${esc(i.quality)} · ${esc(i.duration)} × ${i.quantity}</span><span>${money(i.price)}</span></li>`).join('')}</ul>
 <div class="my-card-foot"><span>${esc(o.method)}${o.pointsUsed?` · 포인트 ${point(o.pointsUsed)} 사용`:''}</span><span>총 결제 금액 <strong>${money(o.paid??o.total)}</strong></span></div>
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
${editing?editHTML(m):'<button type="button" class="sub-cta" data-edit>회원정보 수정</button>'}
<button type="button" class="sub-cta" data-logout>로그아웃</button>
<button type="button" class="my-leave" data-leave>회원 탈퇴</button>
<p class="note">회원 정보 · 장바구니 · 주문 내역은 회원 계정에 저장되어 다른 기기에서 로그인해도 그대로 보입니다. 결제는 시연용입니다.</p>
</aside></div>`;
}

shop.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-login')){openLogin();return}
 if(b.hasAttribute('data-edit')){editing='check';editPw='';render();shop.querySelector('.my-edit input')?.focus();return}
 if(b.hasAttribute('data-edit-cancel')){editing=false;editPw='';render();return}
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
  const c=read(CART,{})||{};const items=Array.isArray(c.items)?c.items:[];
  let next=Number(c.nextId)||items.reduce((n,i)=>Math.max(n,Number(i.id)||0),0);
  const now=new Date().toISOString();
  for(const i of o.items||[]){
   const q=C.qualities.find(x=>x.name===i.quality),du=C.durations.find(x=>x.name===i.duration);if(!q||!du)continue;
   items.push({id:String(++next),quality:q.id,duration:du.id,quantity:i.quantity,addedAt:now});
  }
  write(CART,{items,nextId:next});window.dispatchEvent(new Event('sangsang-cart-change'));
  location.href='../cart/index.html';
 }
});
shop.addEventListener('input',e=>{if(e.target.closest('.my-edit')&&e.target.name==='phone')e.target.value=fmtPhone(e.target.value)});
shop.addEventListener('submit',e=>{
 const f=e.target.closest('.my-edit');if(!f)return;e.preventDefault();
 const el=f.elements,v=n=>el[n].value.trim(),msg=f.querySelector('.my-edit-msg'),btn=f.querySelector('[type=submit]');
 // 1단계: 비밀번호가 맞으면 수정 칸을 연다
 if(f.dataset.step==='check'){
  const pw=el.password.value;if(!pw){msg.textContent='비밀번호를 입력해 주세요.';return}
  btn.disabled=true;msg.textContent='확인하는 중입니다…';
  window.SangsangDB.verifyPassword(pw).then(()=>{editPw=pw;editing='form';f.remove();render();shop.querySelector('.my-edit input')?.focus()})
   .catch(er=>{btn.disabled=false;msg.textContent=window.SangsangDB.errorText(er)});
  return;
 }
 const npw=el.newPassword.value,npw2=el.newPassword2.value;
 const err=!v('name')?'이름을 입력해 주세요.':!isPhone(v('phone'))?'휴대폰 번호를 정확히 입력해 주세요.':!isEmail(v('email'))?'이메일 형식으로 입력해 주세요.':npw&&!(npw.length>=8&&/[a-zA-Z]/.test(npw)&&/\d/.test(npw))?'새 비밀번호는 영문과 숫자를 섞어 8자 이상 입력해 주세요.':npw!==npw2?'새 비밀번호와 새 비밀번호 확인이 다릅니다.':'';
 if(err){msg.textContent=err;return}
 btn.disabled=true;msg.textContent='저장하는 중입니다…';
 window.SangsangDB.updateMyInfo(editPw,{name:v('name'),phone:v('phone'),email:v('email'),address:{zip:v('zip'),addr1:v('addr1'),addr2:v('addr2')}},npw||null)
  .then(()=>{editing=false;editPw='';render();alert(npw?'회원 정보와 비밀번호를 바꿨습니다.':'회원 정보를 저장했습니다.')})
  .catch(er=>{btn.disabled=false;msg.textContent=window.SangsangDB.errorText(er)});
});
// 헤더의 MEMBER 창에서 로그인 · 로그아웃하면 바로 다시 그린다
window.addEventListener('sangsang-member-change',()=>render());
window.addEventListener('sangsang-data-sync',()=>render());
window.addEventListener('sangsang-points-change',()=>{ptsFor=null;render()});
window.addEventListener('storage',e=>{if([MEMBERS,SESSION,ORDERS,INQUIRIES,CART].includes(e.key))render()});
render();
})();
