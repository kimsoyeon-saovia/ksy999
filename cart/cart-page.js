// 장바구니 페이지(cart/index.html) + 주문/결제 페이지(cart/checkout.html)
// 장바구니 내용은 CONTACT 개인 견적에서 '담기'한 영상 목록(sangsang-cart-v1)이다. 견적서와는 따로 저장된다.
// 예전에 담은 영상과 이번에 담은 영상을 함께 보여 주고, 담은 날짜별로 묶어 최근 순서로 정렬한다.
// 장바구니 · 주문은 localStorage에 쓰고, 로그인한 회원이면 member-db.js가 Firebase 계정에도 저장한다. 실제 결제는 일어나지 않는다.
(()=>{
const C=window.INQUIRY_CONFIG;
const DRAFT='sangsang-studio-draft-v1',CART='sangsang-cart-v1',ORDERS='sangsang-orders',PICK='sangsang-checkout-ids';
const MEMBERS='sangsang-members-v2',SESSION='sangsang-member-session';
const view=document.body.dataset.view,shop=document.querySelector('#shop');
const ESTIMATE_URL='../contact/index.html';
const METHODS=['카카오페이','토스페이','네이버페이','신용카드','계좌이체','무통장입금'];

const money=n=>C.comma(n)+'원';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
// 포인트 충전 상품은 '포인트 충전 · STARTER'처럼 영상과 같은 자리에 보여 준다
const quality=item=>item.plan?{name:'포인트 충전'}:C.qualities.find(x=>x.id===item.quality);
const duration=item=>item.plan?{name:C.planOf(item)?.name||''}:C.durations.find(x=>x.id===item.duration);
const unit=item=>C.itemPrice(item);
const title=(item,i)=>item.plan?C.itemTitle(item):`개인 맞춤 영상 ${i+1}`;
const qty=item=>Math.max(1,Math.min(999,Math.trunc(Number(item.quantity))||1));
// 최근에 담은 영상이 위로 온다 (담은 시각이 없는 예전 데이터는 맨 아래)
// 같은 방문(batch)에 담은 상품끼리 붙어 있도록 묶음 시각 → 담은 시각 순서로 정렬한다
const items=()=>{const list=read(CART,{})?.items;const k=i=>String(i.batch||i.addedAt||'');return Array.isArray(list)?[...list].sort((a,b)=>k(b).localeCompare(k(a))||String(b.addedAt||'').localeCompare(String(a.addedAt||''))):[]};
function saveItems(list){
 const c=read(CART,{})||{};
 try{localStorage.setItem(CART,JSON.stringify({...c,items:list}))}catch{}
 window.dispatchEvent(new Event('sangsang-cart-change'));
}
const DAYS=['일','월','화','수','목','금','토'];
const pad=n=>String(n).padStart(2,'0');
const dayOf=item=>{const d=new Date(item.addedAt);return isNaN(d)?'':`${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} (${DAYS[d.getDay()]})`};
// 장바구니 묶음: 견적 페이지에 들어온 시각(batch)마다 한 묶음. 예전 데이터는 날짜로 묶는다
const timeOf=item=>{const d=new Date(item.addedAt);return isNaN(d)?'':`${pad(d.getHours())}:${pad(d.getMinutes())}`};
const groupKey=item=>item.batch||dayOf(item);
const groupTitle=item=>{if(!item.batch)return dayOf(item);const b={addedAt:item.batch};return `${dayOf(b)} ${timeOf(b)}`};
const member=()=>{const s=read(SESSION,null);if(!s?.id)return null;return {id:s.id,name:s.name,...(read(MEMBERS,{})[s.id]||{})}};
const openLogin=()=>document.querySelector('sangsang-header')?.shadowRoot?.querySelector('[data-member]')?.click();

function head(title,step){
 const names=['장바구니','주문/결제','주문완료'];
 return `<div class="shop-head"><h1>${title}</h1><ol class="steps">${names.map((n,i)=>`<li class="${i+1===step?'now':''}" ${i+1===step?'aria-current="step"':''}><b>${String(i+1).padStart(2,'0')}</b>${n}</li>`).join('')}</ol></div>`;
}
const thumb=item=>`<div class="thumb" aria-hidden="true"><strong>${esc(quality(item)?.name||'')}</strong><span>${esc(duration(item)?.name||'')}</span></div>`;
// 영상 가격은 부가세(10%)가 포함된 금액이다. 부가세 = 합계 ÷ 11, 공급가액 = 합계 - 부가세
const totals=list=>{const total=list.reduce((n,i)=>n+unit(i)*qty(i),0),vat=Math.round(total/11);return {subtotal:total-vat,vat,total}};
const summaryRows=t=>`<dl><div><dt>공급가액</dt><dd>${money(t.subtotal)}</dd></div><div><dt>부가세 (10%, 포함)</dt><dd>${money(t.vat)}</dd></div><div class="total"><dt>총 결제 예정 금액</dt><dd>${money(t.total)}</dd></div></dl>`;
const emptyIcon='<svg viewBox="0 0 24 24" fill="none" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2"/><circle cx="9.5" cy="19" r="1.3"/><circle cx="17" cy="19" r="1.3"/></svg>';

// ---------------- 장바구니 ----------------
let selected=null; // 선택된 항목 id (처음엔 전부 선택)
function renderCart(){
 const list=items();
 if(selected===null)selected=new Set(list.map(i=>i.id));
 for(const id of [...selected])if(!list.some(i=>i.id===id))selected.delete(id);
 if(!list.length){
  shop.innerHTML=head('장바구니',1)+`<div class="empty">${emptyIcon}<h2>장바구니가 비어 있습니다</h2><p>화질과 길이를 골라 원하는 영상을 담아 보세요.</p><a class="cta" style="width:280px" href="${ESTIMATE_URL}">견적 내러 가기</a></div>`;
  return;
 }
 const picked=list.filter(i=>selected.has(i.id)),t=totals(picked),all=picked.length===list.length;
 shop.innerHTML=head('장바구니',1)+`<div class="shop-body"><section aria-label="담은 영상">
<div class="list-tools"><label class="check"><input type="checkbox" data-all ${all?'checked':''}> 전체 선택 (${picked.length}/${list.length})</label><div class="tool-btns"><button type="button" class="ghost" data-remove-picked ${picked.length?'':'disabled'}>선택 삭제</button><button type="button" class="ghost" data-clear>전체 삭제</button></div></div>
${list.map((item,i)=>{const n=qty(item),day=groupTitle(item),newDay=i===0||groupKey(item)!==groupKey(list[i-1]);return `${newDay?`<h3 class="cart-day">${day?esc(day)+' 담은 상품':'이전에 담은 상품'}</h3>`:''}<article class="row"><label class="check"><input type="checkbox" data-pick="${esc(item.id)}" ${selected.has(item.id)?'checked':''} aria-label="개인 맞춤 영상 ${i+1} 선택"></label>${thumb(item)}<div class="info"><h2>${esc(title(item,i))}</h2><p>${item.plan?esc(C.itemLabel(item))+' <b class="member-only">회원 전용</b>':`화질 ${esc(quality(item)?.name)} · 길이 ${esc(duration(item)?.name)}`}</p><p class="unit">개당 ${money(unit(item))}${timeOf(item)?` · <span class="added-at">${timeOf(item)} 담음</span>`:''}</p></div><div class="stepper" role="group" aria-label="개인 맞춤 영상 ${i+1} 수량"><button type="button" data-step="-1" data-id="${esc(item.id)}" aria-label="수량 줄이기" ${n<=1?'disabled':''}>−</button><output>${n}</output><button type="button" data-step="1" data-id="${esc(item.id)}" aria-label="수량 늘리기" ${n>=999?'disabled':''}>+</button></div><strong class="line-total">${money(unit(item)*n)}</strong><button type="button" class="remove" data-remove="${esc(item.id)}" aria-label="개인 맞춤 영상 ${i+1} 삭제">×</button></article>`}).join('')}
<div class="list-foot"><span>담은 영상은 결제 전까지 장바구니에 보관됩니다.</span><a class="text-link" href="${ESTIMATE_URL}">+ 영상 더 담기</a></div>
</section><aside class="summary" aria-label="결제 예정 금액"><h2>결제 예정 금액</h2>${summaryRows(t)}<p class="note">선택한 ${picked.length}개 항목 · 최종 금액은 상담 후 확정될 수 있습니다.</p>${list.some(i=>i.plan)?'<p class="note member-note">※ 포인트 충전 상품은 회원 전용입니다. 로그인한 뒤 결제할 수 있습니다.</p>':''}<button type="button" class="cta" data-order ${picked.length?'':'disabled'}>주문하기</button><button type="button" class="sub-cta" data-consult aria-expanded="${consult.open}" aria-controls="consult">${consult.open?'상담 신청 닫기':'결제 전에 상담 먼저 받기'}</button></aside></div>${consult.open?consultHTML(picked):''}`;
}

// ---------------- 결제 전 상담 신청 (장바구니 아래에 펼쳐짐) ----------------
const INQUIRIES='sangsang-studio-inquiries-v1';
const consult={open:false,done:null,values:null,errors:{}};
const TIMES=['언제든 괜찮아요','평일 오전 (10~12시)','평일 오후 (13~16시)','평일 늦은 오후 (16~19시)'];
function consultDefaults(picked){
 const me=member(),f=draftFields();
 return {name:me?.name||f.name||'',contact:me?.phone||f.contact||'',time:TIMES[0],
  message:[`장바구니에 담은 영상 ${picked.length}건 상담을 원합니다.`,...picked.map(i=>`- ${quality(i)?.name} · ${duration(i)?.name} × ${qty(i)}`),f.request?`희망 제작물: ${f.request}`:'',f.mood?`희망 분위기: ${f.mood}`:''].filter(Boolean).join('\n'),agree:false};
}
function consultHTML(picked){
 if(consult.done){const d=consult.done;return `<section class="consult" id="consult" tabindex="-1"><div class="consult-done"><div class="badge" aria-hidden="true">✓</div><h2>상담 신청이 완료되었습니다</h2><p>${esc(d.name)}님, 확인 후 <strong>${esc(d.time)}</strong>에 <strong>${esc(d.contact)}</strong>(으)로 연락드리겠습니다.<br>장바구니에 담은 영상은 그대로 보관됩니다.</p><p class="demo-note">화면 확인용 접수 안내입니다. 실제 상담 접수 서버는 아직 연결되지 않았습니다.</p></div></section>`}
 const v=consult.values||(consult.values=consultDefaults(picked)),er=consult.errors;
 return `<section class="consult" id="consult" tabindex="-1"><div class="block-title"><h2>결제 전 상담 신청</h2><small>상담 후 결제해도 장바구니는 그대로 유지됩니다</small></div>
<form id="consult-form" novalidate><div class="consult-info"><p><strong>상담 안내</strong></p><ul><li>운영 시간 평일 10:00 ~ 19:00 (주말·공휴일 휴무)</li><li>담당자가 화질·길이·제작 범위를 확인하고 최종 금액을 안내해 드립니다.</li><li>사진이나 참고 영상은 상담 중 카카오톡 채널 또는 이메일로 보내 주세요.</li><li>대표번호 0507-8765-4321 · main@sangsangstudio.com</li></ul></div>
<div class="fields"><div class="f${er.name?' error':''}"><label for="c-name">이름 <b>*</b></label><input id="c-name" name="name" autocomplete="name" value="${esc(v.name)}"><p class="msg">이름을 입력해 주세요.</p></div>
<div class="f${er.contact?' error':''}"><label for="c-contact">연락처 <b>*</b></label><input id="c-contact" name="contact" autocomplete="tel" placeholder="휴대폰 번호 또는 이메일" value="${esc(v.contact)}"><p class="msg">연락받을 휴대폰 번호나 이메일을 입력해 주세요.</p></div>
<div class="f wide"><label for="c-time">상담 희망 시간</label><select id="c-time" name="time">${TIMES.map(t=>`<option ${t===v.time?'selected':''}>${t}</option>`).join('')}</select></div>
<div class="f wide${er.message?' error':''}"><label for="c-message">상담 내용 <b>*</b></label><textarea id="c-message" name="message" rows="5">${esc(v.message)}</textarea><p class="msg">상담받고 싶은 내용을 적어 주세요.</p></div></div>
<label class="check${er.agree?' error':''}" style="margin-top:22px"><input type="checkbox" name="agree" ${v.agree?'checked':''}> [필수] 개인정보 수집 및 이용에 동의합니다</label>
<p class="agree-msg" role="status">${er.agree?'개인정보 수집 및 이용에 동의해 주세요.':''}</p>
<button type="submit" class="cta consult-submit">상담 신청하기</button></form></section>`;
}
function consultSubmit(e){
 if(e.target.id!=='consult-form')return;e.preventDefault();
 const v=consult.values,er={};
 if(!v.name.trim())er.name=1;if(!v.contact.trim())er.contact=1;if(!v.message.trim())er.message=1;if(!v.agree)er.agree=1;
 consult.errors=er;
 if(Object.keys(er).length){renderCart();const first=shop.querySelector('#consult .f.error input,#consult .f.error textarea')||shop.querySelector('#consult [name="agree"]');first?.focus();return}
 const picked=items().filter(i=>selected.has(i.id));
 const record={savedAt:new Date().toISOString(),type:'cart-consult',memberId:member()?.id||null,fields:{name:v.name.trim(),contact:v.contact.trim(),time:v.time,request:v.message.trim()},items:picked.map(i=>({quality:quality(i)?.name,duration:duration(i)?.name,quantity:qty(i)})),estimate:totals(picked)};
 try{const saved=read(INQUIRIES,[]);localStorage.setItem(INQUIRIES,JSON.stringify([...(Array.isArray(saved)?saved:[]),record]))}catch{}
 consult.done={name:record.fields.name,contact:record.fields.contact,time:record.fields.time};consult.values=null;
 renderCart();shop.querySelector('#consult')?.focus({preventScroll:true});shop.querySelector('#consult')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function cartClick(e){
 const b=e.target.closest('button,input');if(!b||b.closest('#consult-form'))return;
 const list=items();
 if(b.hasAttribute('data-consult')){
  consult.open=!consult.open;if(consult.open){consult.done=null;consult.errors={}}
  renderCart();
  if(consult.open){const box=shop.querySelector('#consult');box?.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>box?.querySelector('input')?.focus({preventScroll:true}),450)}
  else shop.querySelector('[data-consult]')?.focus();
  return;
 }
 if(b.dataset.step){const id=b.dataset.id,step=Number(b.dataset.step);saveItems(list.map(i=>i.id===id?{...i,quantity:Math.max(1,Math.min(999,qty(i)+step))}:i));renderCart();shop.querySelector(`[data-step="${step}"][data-id="${CSS.escape(id)}"]`)?.focus();return}
 if(b.dataset.remove){saveItems(list.filter(i=>i.id!==b.dataset.remove));renderCart();return}
 if(b.hasAttribute('data-remove-picked')){saveItems(list.filter(i=>!selected.has(i.id)));renderCart();return}
 if(b.hasAttribute('data-clear')){if(confirm('장바구니를 모두 비울까요?')){saveItems([]);renderCart()}return}
 if(b.hasAttribute('data-order')){try{sessionStorage.setItem(PICK,JSON.stringify([...selected]))}catch{};location.href='checkout.html';return}
}
// 상담 신청 입력값은 다시 그려도 지워지지 않게 보관한다
function consultInput(e){
 const t=e.target;if(!t.closest('#consult-form')||!consult.values)return;
 consult.values[t.name]=t.type==='checkbox'?t.checked:t.value;
 if(consult.errors[t.name]){delete consult.errors[t.name];t.closest('.f,.check')?.classList.remove('error');if(t.name==='agree')shop.querySelector('#consult .agree-msg').textContent=''}
}
function cartChange(e){
 const t=e.target;if(t.closest('#consult-form'))return;
 if(t.dataset.pick){t.checked?selected.add(t.dataset.pick):selected.delete(t.dataset.pick);renderCart();shop.querySelector(`[data-pick="${CSS.escape(t.dataset.pick)}"]`)?.focus()}
 if(t.hasAttribute('data-all')){selected=new Set(t.checked?items().map(i=>i.id):[]);renderCart();shop.querySelector('[data-all]')?.focus()}
}

// ---------------- 주문/결제 ----------------
function orderItems(){
 let ids=null;try{ids=JSON.parse(sessionStorage.getItem(PICK))}catch{}
 const list=items();
 return Array.isArray(ids)?list.filter(i=>ids.includes(i.id)):list;
}
const draftFields=()=>read(DRAFT,{})?.personal?.fields||{};
// 포인트 사용 (회원만): 잔액은 회원 계정에서 읽고, 결제 금액보다 많이 쓸 수 없다
const PV=C.pointValue;
const point=C.point;
let ptBal=null,ptFor=null,ptUse=0;
function loadPoints(me){
 if(!me||!window.SangsangDB||ptFor===me.id)return;ptFor=me.id;
 window.SangsangDB.whenAuthKnown().then(()=>window.SangsangDB.points()).then(p=>{ptBal=p.balance;const box=shop.querySelector('#pt-block');if(box)box.innerHTML=pointsBlock(member(),totals(orderItems()))}).catch(()=>{ptBal=0});
}
// 포인트 충전 상품은 포인트로 살 수 없으므로 영상 금액까지만 쓸 수 있다
const videoTotal=()=>orderItems().filter(i=>!i.plan).reduce((n,i)=>n+unit(i)*qty(i),0);
const maxUse=()=>Math.max(0,Math.min(ptBal||0,Math.floor(videoTotal()/PV)));
const payRows=t=>ptUse?`<dl class="pt-rows"><div><dt>포인트 사용</dt><dd>−${money(ptUse*PV)}</dd></div><div class="total"><dt>실제 결제 금액</dt><dd>${money(t.total-ptUse*PV)}</dd></div></dl>`:'';
const payLabel=t=>{const left=t.total-ptUse*PV;return left?`${money(left)} 결제하기`:'포인트로 결제하기'};
function pointsBlock(me,t){
 if(!me)return `<section class="block"><div class="block-title"><h2>포인트</h2></div><p class="pay-note">회원으로 로그인하면 충전한 포인트로 결제할 수 있습니다.</p></section>`;
 if(ptBal===null)return `<section class="block"><div class="block-title"><h2>포인트</h2></div><p class="pay-note">포인트를 불러오는 중입니다…</p></section>`;
 return `<section class="block"><div class="block-title"><h2>포인트</h2><small>보유 <b>${point(ptBal)}</b> · 1포인트 = ${PV}원 · <a class="text-link" style="font-size:14px" href="../contact/index.html">충전 상품 보기</a></small></div>
<div class="pt-use"><label for="o-points">사용할 포인트</label><input id="o-points" name="usePoints" type="number" min="0" max="${maxUse(t)}" step="1" inputmode="numeric" value="${ptUse||''}" placeholder="0" ${maxUse(t)?'':'disabled'}><span>포인트</span><button type="button" class="ghost" data-use-all ${maxUse(t)?'':'disabled'}>전액 사용</button></div>
<p class="pay-note">${maxUse(t)?`최대 ${point(maxUse(t))}까지 사용할 수 있습니다. 모자란 금액은 아래 결제 수단으로 결제합니다.`:'사용할 수 있는 포인트가 없습니다.'}</p></section>`;
}
// 포인트 입력이 바뀌면 금액 부분만 고친다 (입력칸은 다시 그리지 않음)
function updatePay(){
 const t=totals(orderItems()),box=shop.querySelector('#pay-rows');if(!box)return;
 box.innerHTML=payRows(t);shop.querySelector('#checkout [type=submit]').textContent=payLabel(t);
 shop.querySelector('.methods').disabled=t.total-ptUse*PV===0;
}
function renderCheckout(){
 const list=orderItems();
 if(!list.length){shop.innerHTML=head('주문/결제',2)+`<div class="empty">${emptyIcon}<h2>주문할 영상이 없습니다</h2><p>장바구니에서 주문할 영상을 선택해 주세요.</p><a class="cta" style="width:280px" href="index.html">장바구니로 가기</a></div>`;return}
 const me=member(),f=draftFields(),t=totals(list);
 if(me)loadPoints(me);else{ptBal=null;ptFor=null}
 ptUse=me&&ptBal!==null?Math.min(ptUse,maxUse(t)):0;
 const value=(v)=>esc(v||'');
 shop.innerHTML=head('주문/결제',2)+`<form class="shop-body" id="checkout" novalidate><div>
<section class="block"><div class="block-title"><h2>주문자 정보</h2><small><b style="color:#1647ff">*</b> 필수 입력</small></div>
${me?`<div class="login-hint member"><span><strong>${esc(me.name)}</strong>님의 회원 정보를 불러왔습니다.</span></div>`:`<div class="login-hint"><span>회원이시면 로그인하고 정보를 불러오세요. 비회원도 주문할 수 있습니다.</span><button type="button" data-login>로그인</button></div>`}
<div class="fields"><div class="f"><label for="o-name">이름 <b>*</b></label><input id="o-name" name="name" autocomplete="name" value="${value(me?.name||f.name)}"><p class="msg">이름을 입력해 주세요.</p></div>
<div class="f"><label for="o-phone">휴대폰 번호 <b>*</b></label><input id="o-phone" name="phone" type="tel" inputmode="numeric" maxlength="13" autocomplete="tel" placeholder="010-0000-0000" value="${value(me?.phone)}"><p class="msg">휴대폰 번호를 정확히 입력해 주세요.</p></div>
<div class="f wide"><label for="o-email">이메일 <b>*</b></label><input id="o-email" name="email" type="email" autocomplete="email" placeholder="example@email.com" value="${value(me?.email)}"><p class="msg">이메일 형식으로 입력해 주세요.</p></div>
<div class="f wide"><label for="o-request">제작 요청사항</label><textarea id="o-request" name="request" placeholder="희망 제작물, 분위기, 참고 자료 등을 적어 주세요.">${value([f.request,f.mood].filter(Boolean).join('\n'))}</textarea></div></div></section>
<section class="block"><div class="block-title"><h2>주문 상품</h2><small>${list.length}건 · <a class="text-link" style="font-size:14px" href="index.html">장바구니 수정</a></small></div>
<ul class="order-items">${list.map((item,i)=>`<li>${thumb(item)}<div><h3>${esc(title(item,i))}</h3><p>${esc(quality(item)?.name)} · ${esc(duration(item)?.name)} · 수량 ${qty(item)}개</p></div><strong class="price">${money(unit(item)*qty(item))}</strong></li>`).join('')}</ul></section>
<div id="pt-block">${pointsBlock(me,t)}</div>
<section class="block"><div class="block-title"><h2>결제 수단</h2></div>
<fieldset class="methods" ${ptUse&&t.total-ptUse*PV===0?'disabled':''}><legend>결제 수단 선택</legend>${METHODS.map((m,i)=>`<label><input type="radio" name="method" value="${m}" ${i===0?'checked':''}>${m}</label>`).join('')}</fieldset>
<p class="pay-note">🔒 결제 화면 시안입니다. 실제 결제나 출금은 이루어지지 않습니다.</p></section>
<section class="block"><div class="block-title"><h2>약관 동의</h2></div><div class="agrees">
<label class="check all"><input type="checkbox" data-agree-all> 전체 동의합니다</label>
<label class="check"><input type="checkbox" name="agreeOrder" data-agree> [필수] 주문 내용을 확인했으며 결제에 동의합니다</label>
<label class="check"><input type="checkbox" name="agreePrivacy" data-agree> [필수] 개인정보 수집 및 이용에 동의합니다</label>
<p class="agree-msg" role="status"></p></div></section>
</div><aside class="summary" aria-label="최종 결제 금액"><h2>최종 결제 금액</h2>${summaryRows(t)}<div id="pay-rows">${payRows(t)}</div><p class="note">VAT 포함 금액입니다. 제작 범위는 결제 후 상담에서 확정합니다.</p><button type="submit" class="cta">${payLabel(t)}</button><a class="sub-cta" href="index.html">장바구니로 돌아가기</a></aside></form>`;
 const phone=shop.querySelector('#o-phone');phone.value=fmtPhone(phone.value);
}
const fmtPhone=v=>{const d=String(v||'').replace(/\D/g,'').slice(0,11);return d.length<4?d:d.length<8?`${d.slice(0,3)}-${d.slice(3)}`:`${d.slice(0,3)}-${d.slice(3,d.length-4)}-${d.slice(-4)}`};
function mark(input,bad){input.closest('.f').classList.toggle('error',bad);return bad}
function checkoutSubmit(e){
 e.preventDefault();const form=e.target,el=form.elements;
 const name=el.name.value.trim(),phone=el.phone.value.trim(),email=el.email.value.trim();
 const bad=[mark(el.name,!name),mark(el.phone,!/^01[016789]-\d{3,4}-\d{4}$/.test(phone)),mark(el.email,!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))];
 const agreeBad=!el.agreeOrder.checked||!el.agreePrivacy.checked;
 form.querySelectorAll('[data-agree]').forEach(c=>c.closest('.check').classList.toggle('error',!c.checked));
 form.querySelector('.agree-msg').textContent=agreeBad?'필수 약관에 모두 동의해 주세요.':'';
 if(bad.some(Boolean)){form.querySelector('.f.error input')?.focus();return}
 if(agreeBad){form.querySelector('[data-agree]:not(:checked)')?.focus();return}
 const list=orderItems(),t=totals(list),me=member(),now=new Date();
 // 포인트 충전 상품은 회원 계정에 넣어야 하므로 로그인해야 결제할 수 있다
 if(list.some(i=>i.plan)&&!me){alert('포인트 충전 상품은 로그인한 뒤 결제할 수 있습니다.');openLogin();return}
 const gained=list.reduce((n,i)=>n+C.itemPoints(i)*qty(i),0);
 const no=`SS-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*9000)+1000)}`;
 const used=me?Math.min(ptUse,maxUse(t)):0,paid=t.total-used*PV;
 const method=paid===0?'포인트 결제':used?`포인트 + ${el.method.value}`:el.method.value;
 const order={no,date:now.toISOString(),method,buyer:{name,phone,email},memberId:me?.id||null,request:el.request.value.trim(),
  items:list.map(i=>({quality:quality(i)?.name,duration:duration(i)?.name,quantity:qty(i),price:unit(i)*qty(i)})),...t,pointsUsed:used,pointsGained:gained,paid};
 const paying=document.createElement('div');paying.className='paying';paying.setAttribute('role','status');paying.innerHTML=`<i aria-hidden="true"></i><p>${esc(order.method)} 결제를 진행하고 있습니다…</p>`;
 document.body.append(paying);
 // 포인트를 먼저 차감하고, 실패하면(잔액 부족 등) 주문하지 않는다
 const spend=used?window.SangsangDB.changePoints(-used,'use',`주문 ${no}`):Promise.resolve();
 // 결제가 끝나면 충전 상품의 포인트를 회원 계정에 넣는다
 spend.then(()=>new Promise(r=>setTimeout(r,1400))).then(()=>gained?window.SangsangDB.changePoints(gained,'charge',`주문 ${no} 충전`):null).then(()=>{
  try{const orders=read(ORDERS,[]);localStorage.setItem(ORDERS,JSON.stringify([...(Array.isArray(orders)?orders:[]),order]))}catch{}
  if(!order.memberId)window.SangsangDB?.saveGuestOrder(order).catch(()=>{});
  const ids=new Set(list.map(i=>i.id));saveItems(items().filter(i=>!ids.has(i.id)));
  try{sessionStorage.removeItem(PICK)}catch{}
  ptUse=0;ptFor=null;ptBal=null;
  paying.remove();history.replaceState(null,'',`?order=${encodeURIComponent(no)}`);renderDone(order);scrollTo({top:0});
 }).catch(err=>{paying.remove();alert('결제하지 못했습니다. '+(window.SangsangDB?.errorText(err)||''));ptFor=null;ptBal=null;renderCheckout()});
}
function renderDone(order){
 const d=new Date(order.date);
 // 포인트 충전만 결제했을 때는 제작 상담 안내 대신 '바로 사용 가능' 안내를 보여 준다
 const onlyPoints=order.items.length&&order.items.every(i=>i.quality==='포인트 충전'),hasPoints=order.items.some(i=>i.quality==='포인트 충전');
 const doneText=onlyPoints?`${esc(order.buyer.name)}님, 감사합니다.<br>충전된 포인트는 <strong>바로 사용 가능합니다.</strong>`:`${esc(order.buyer.name)}님, 감사합니다.<br>담당자가 확인 후 입력하신 연락처로 제작 상담 일정을 안내해 드립니다.${hasPoints?'<br>충전된 포인트는 <strong>바로 사용 가능합니다.</strong>':''}`;
 shop.innerHTML=head('주문완료',3)+`<section class="done"><div class="badge" aria-hidden="true">✓</div><h2>${onlyPoints?'포인트 충전이 완료되었습니다':'주문이 완료되었습니다'}</h2><p>${doneText}</p>
<dl class="receipt"><div><dt>주문번호</dt><dd><strong>${esc(order.no)}</strong></dd></div><div><dt>주문일시</dt><dd>${d.toLocaleString('ko-KR')}</dd></div><div><dt>주문 상품</dt><dd>${order.items.map(i=>`${esc(i.quality)} · ${esc(i.duration)} × ${i.quantity}`).join('<br>')}</dd></div><div><dt>결제 수단</dt><dd>${esc(order.method)}</dd></div><div><dt>연락처</dt><dd>${esc(order.buyer.phone)}<br>${esc(order.buyer.email)}</dd></div>${order.pointsUsed?`<div><dt>주문 금액</dt><dd>${money(order.total)}</dd></div><div><dt>포인트 사용</dt><dd>${point(order.pointsUsed)} (−${money(order.pointsUsed*PV)})</dd></div>`:''}${order.pointsGained?`<div><dt>충전 포인트</dt><dd>+${point(order.pointsGained)} (회원 계정에 적립)</dd></div>`:''}<div class="total"><dt>결제 금액</dt><dd>${money(order.paid??order.total)}</dd></div></dl>
<p class="demo-note">화면 확인용 결제 시안입니다. 실제 승인이나 출금은 발생하지 않았습니다.</p>
<div class="done-actions"><a class="sub-cta" href="../main/index.html">홈으로</a><a class="cta plain" href="${ESTIMATE_URL}">제작 문의 추가</a></div></section>`;
}

// ---------------- 시작 ----------------
if(view==='cart'){
 renderCart();shop.addEventListener('click',cartClick);shop.addEventListener('change',cartChange);
 shop.addEventListener('input',consultInput);shop.addEventListener('change',consultInput);shop.addEventListener('submit',consultSubmit);
}else{
 const no=new URLSearchParams(location.search).get('order');
 const found=no&&read(ORDERS,[]).find?.(o=>o.no===no);
 if(found)renderDone(found);else renderCheckout();
 shop.addEventListener('submit',checkoutSubmit);
 shop.addEventListener('click',e=>{
  if(e.target.closest('[data-login]'))openLogin();
  if(e.target.closest('[data-use-all]')){ptUse=maxUse(totals(orderItems()));shop.querySelector('#o-points').value=ptUse;updatePay()}
 });
 shop.addEventListener('input',e=>{
  const t=e.target;if(t.name==='phone')t.value=fmtPhone(t.value);t.closest('.f')?.classList.remove('error');
  if(t.name==='usePoints'){const max=maxUse(totals(orderItems()));ptUse=Math.max(0,Math.min(max,Math.floor(Number(t.value)||0)));if(Number(t.value)>max)t.value=max;updatePay()}
 });
 shop.addEventListener('change',e=>{
  const t=e.target,form=t.form;if(!form)return;
  if(t.hasAttribute('data-agree-all'))form.querySelectorAll('[data-agree]').forEach(c=>{c.checked=t.checked});
  if(t.hasAttribute('data-agree')||t.hasAttribute('data-agree-all')){const all=[...form.querySelectorAll('[data-agree]')];form.querySelector('[data-agree-all]').checked=all.every(c=>c.checked);all.forEach(c=>c.checked&&c.closest('.check').classList.remove('error'));if(all.every(c=>c.checked))form.querySelector('.agree-msg').textContent=''}
 });
 // 결제 페이지에서 로그인하면 회원 정보로 다시 채운다
 window.addEventListener('sangsang-member-change',()=>{if(shop.querySelector('#checkout'))renderCheckout()});
}
window.addEventListener('storage',e=>{if(e.key===CART&&view==='cart')renderCart()});
// 로그인하면 회원 계정에 저장된 장바구니 · 주문을 불러와(member-db.js) 다시 그린다
window.addEventListener('sangsang-data-sync',()=>{if(view==='cart'){selected=null;renderCart()}else if(shop.querySelector('#checkout'))renderCheckout()});
})();
