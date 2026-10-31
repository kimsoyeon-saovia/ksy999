// 회원 관리(관리자 화면): 회원 목록 · 검색 · 정보 수정 · 삭제 · 엑셀 저장(회원 · 주문 · 장바구니 · 상담 · 비회원 주문 · 판매 현황)
// 회원 정보는 Firebase(member-db.js)에서 읽는다. 관리자로 등록된 계정으로 로그인해야 목록이 보인다.
(()=>{
const shop=document.querySelector('#shop');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=iso=>{const d=new Date(iso);return isNaN(d)?'':`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`};
const isEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone=v=>/^01[016789]-\d{3,4}-\d{4}$/.test(v);
const fmtPhone=v=>{const d=v.replace(/\D/g,'').slice(0,11);return d.length<4?d:d.length<8?`${d.slice(0,3)}-${d.slice(3)}`:`${d.slice(0,3)}-${d.slice(3,d.length-4)}-${d.slice(-4)}`};
const addrText=a=>a?.addr1?`(${a.zip||''}) ${a.addr1}${a.addr2?' '+a.addr2:''}`:'';
const head=stats=>`<div class="shop-head"><h1>회원 관리</h1>${stats||''}</div>`;
const openLogin=()=>document.querySelector('sangsang-header')?.shadowRoot?.querySelector('[data-member]')?.click();
let DB=null,members=[],guests=[],query='',sort='new',flash='';
const money=n=>Number(n||0).toLocaleString('ko-KR')+'원';
const thisMonth=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`};
const inMonth=o=>String(o.date||'').startsWith(thisMonth());
// 장바구니에는 화질 · 길이 id만 저장되므로 견적 설정에서 이름과 가격을 찾는다
const C=()=>window.INQUIRY_CONFIG;
const cartLabel=i=>{const c=C();const p=c?.planOf?.(i);if(p)return `포인트 충전 · ${p.name}`;const q=c?.qualities.find(x=>x.id===i.quality),d=c?.durations.find(x=>x.id===i.duration);return `${q?.name||i.quality} · ${d?.name||i.duration}`};
const cartQty=list=>(list||[]).reduce((n,i)=>n+(Number(i.quantity)||1),0);
const monthOrders=m=>(m.orders||[]).filter(inMonth);
const sum=list=>list.reduce((n,o)=>n+(Number(o.total)||0),0);
// 회원 · 비회원 주문을 모두 모아 화질 · 길이 조합별로 많이 팔린 순서
function bestSellers(){
 const all=[...members.flatMap(m=>m.orders||[]),...guests],count={};
 for(const o of all)for(const i of o.items||[]){const k=`${i.quality} · ${i.duration}`;const c=count[k]||(count[k]={name:k,qty:0,sales:0});c.qty+=Number(i.quantity)||1;c.sales+=Number(i.price)||0}
 return Object.values(count).sort((a,b)=>b.qty-a.qty||b.sales-a.sales).slice(0,5);
}

function message(title,text,login){
 shop.innerHTML=head()+`<div class="empty"><h2>${title}</h2><p>${text}</p>${login?'<div class="ad-gate"><button type="button" class="cta plain" data-login>관리자 로그인</button></div>':''}</div>`;
}
function filtered(){
 const q=query.trim().toLowerCase();
 // 전화번호는 하이픈 없이 숫자만 넣어도 찾는다 (01012345678 → 010-1234-5678)
 const digits=q.replace(/\D/g,''),phoneHit=m=>digits.length>=3&&/^[\d\s-]+$/.test(q)&&String(m.phone||'').replace(/\D/g,'').includes(digits);
 const found=q?members.filter(m=>phoneHit(m)||[m.id,m.name,m.phone,m.email,addrText(m.address)].some(v=>String(v||'').toLowerCase().includes(q))):[...members];
 // 정렬: 가입 최신 · 가입 오래된 · 구매 많은 · 구매 적은(주문 금액, 같으면 주문 수) · 이름
 const joined=(a,b)=>String(a.joined||'').localeCompare(String(b.joined||''));
 const bought=(a,b)=>sum(a.orders||[])-sum(b.orders||[])||(a.orders||[]).length-(b.orders||[]).length;
 const order={new:(a,b)=>joined(b,a),old:joined,'buy-desc':(a,b)=>bought(b,a)||joined(b,a),'buy-asc':(a,b)=>bought(a,b)||joined(b,a),name:(a,b)=>String(a.name).localeCompare(String(b.name),'ko')};
 found.sort(order[sort]||order.new);
 return found;
}
const countText=(n,t)=>n===t?`전체 ${t}명`:`검색 결과 ${n}명 / 전체 ${t}명`;

function render(){
 const found=filtered(),all=members;
 const now=new Date(),month=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
 const me=DB.current()?.id;
 const mOrders=[...all.flatMap(monthOrders),...guests.filter(inMonth)],best=bestSellers();
 const stat=(k,n,t)=>`<li><button type="button" class="ad-stat" data-stat="${k}" aria-label="${t} 내역 보기"><b>${n}</b>${t}</button></li>`;
 shop.innerHTML=head(`<ul class="my-stats ad-stats">${stat('all',all.length,'전체 회원')}${stat('join',all.filter(m=>String(m.joined||'').startsWith(month)).length,'이번 달 가입')}${stat('order',mOrders.length,'이번 달 주문')}${stat('guest',guests.length,'비회원 주문')}</ul>`)+`
<section class="ad-insight" aria-label="주문 현황">
 <div class="ad-box"><h2>이번 달 매출 <small>회원 + 비회원 · 부가세 포함</small></h2><p class="ad-big">${money(sum(mOrders))}</p></div>
 <div class="ad-box"><h2>잘 팔리는 영상 <small>전체 주문 기준 TOP 5</small></h2>${best.length?`<ol class="ad-best">${best.map((b,i)=>`<li><b>${i+1}</b><span>${esc(b.name)}</span><em>${b.qty}개 · ${money(b.sales)}</em></li>`).join('')}</ol>`:'<p class="ad-none">아직 주문이 없습니다.</p>'}</div>
</section>
<p class="ad-notice">관리자 화면 · 회원 정보는 <b>Firebase 데이터베이스</b>에 저장되어 있어 어느 기기에서 가입한 회원이든 모두 보입니다. <button type="button" class="text-link" data-refresh>새로고침</button></p>
<div class="list-tools ad-tools">
 <input class="ad-search" type="search" placeholder="아이디 · 이름 · 휴대폰 · 이메일 · 주소 검색" value="${esc(query)}" aria-label="회원 검색">
 <div class="tool-btns"><select class="ad-sort" aria-label="정렬">${[['new','가입순 (최근 → 오래된)'],['old','가입순 (오래된 → 최근)'],['buy-desc','구매 많은 순 (많은 → 적은)'],['buy-asc','구매 적은 순 (적은 → 많은)'],['name','이름순']].map(([v,t])=>`<option value="${v}"${sort===v?' selected':''}>${t}</option>`).join('')}</select>
 <button type="button" class="ghost" data-csv${all.length||guests.length?'':' disabled'}>엑셀 저장 (전체 데이터)</button></div>
</div>
<p class="ad-flash" role="status">${esc(flash)}</p>
<div class="ad-members">${listHTML(found,all,me)}</div>
${guestsHTML()}
<dialog class="ad-dialog"></dialog>`;
 flash='';
}
// 휴대폰에서 줄마다 보이는 요약(누르면 나머지 칸이 펼쳐짐). PC에서는 숨긴다
const sumBtn=(a,b,c)=>`<button type="button" class="ad-sum-btn" data-row-toggle aria-expanded="false"><b>${a}</b><span>${b}</span><em>${c}</em></button>`;
// 회원 표: 검색할 때는 이 부분만 다시 그려 검색창(한글 입력 중인 글자)을 건드리지 않는다
function listHTML(found,all,me){
 return all.length?(found.length?`<div class="ad-table-wrap"><table class="ad-table">
<thead><tr><th>아이디</th><th>이름</th><th>휴대폰</th><th>이메일</th><th>주소</th><th>가입일</th><th>이번 달 주문</th><th>장바구니</th><th>포인트</th><th>관리</th></tr></thead>
<tbody>${found.map(m=>`<tr>
 <td class="ad-sum">${sumBtn(esc(m.name),`${esc(m.id)}${me===m.id?' · 나':''}`,`주문 ${(m.orders||[]).length}건`)}</td>
 <td data-label="아이디"><strong>${esc(m.id)}</strong>${me===m.id?'<span class="ad-on">나</span>':''}</td>
 <td data-label="이름">${esc(m.name)}</td><td data-label="휴대폰">${esc(m.phone||'-')}</td><td data-label="이메일">${esc(m.email||'-')}</td>
 <td data-label="주소" class="ad-addr">${esc(addrText(m.address))||'<span class="ad-none">없음</span>'}</td>
 <td data-label="가입일">${date(m.joined)}</td>
 <td data-label="이번 달 주문">${monthOrders(m).length?`<b>${monthOrders(m).length}건</b><br><small>${money(sum(monthOrders(m)))}</small>`:'<span class="ad-none">없음</span>'}</td>
 <td data-label="장바구니">${cartQty(m.cart)?`${cartQty(m.cart)}개`:'<span class="ad-none">비어 있음</span>'}</td>
 <td data-label="포인트">${m.points?`${String(m.points).replace(/\B(?=(\d{3})+(?!\d))/g,',')}포인트`:'<span class="ad-none">0포인트</span>'}</td>
 <td class="ad-actions"><button type="button" class="ghost" data-detail="${esc(m.id)}">내역</button><button type="button" class="ghost" data-edit="${esc(m.id)}">수정</button>${me===m.id?'':`<button type="button" class="ghost ad-del" data-del="${esc(m.id)}">삭제</button>`}</td>
</tr>`).join('')}</tbody></table></div>
<p class="ad-count">${countText(found.length,all.length)}</p>`:`<div class="my-none">'${esc(query)}'에 맞는 회원이 없습니다.</div>`)
:`<div class="empty"><h2>아직 가입한 회원이 없습니다</h2><p>헤더의 MEMBER 메뉴에서 회원가입하면 여기에 나타납니다.</p></div>`;
}
function guestsHTML(){
 return `<section class="ad-guests"><div class="block-title"><h2>비회원 주문 <small>${guests.length}건 · 최근 주문부터</small></h2></div>
${guests.length?`<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>주문번호</th><th>주문일</th><th>주문자</th><th>연락처</th><th>주문 영상</th><th>결제 수단</th><th>금액</th></tr></thead><tbody>
${[...guests].sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(o=>`<tr><td class="ad-sum">${sumBtn(esc(o.buyer?.name||'-'),`${date(o.date)} · ${esc(o.no)}`,money(o.total))}</td><td data-label="주문번호"><strong>${esc(o.no)}</strong></td><td data-label="주문일">${date(o.date)}</td><td data-label="주문자">${esc(o.buyer?.name)}</td><td data-label="연락처">${esc(o.buyer?.phone)}</td><td data-label="주문 영상">${(o.items||[]).map(i=>`${esc(i.quality)} · ${esc(i.duration)} × ${i.quantity}`).join('<br>')}</td><td data-label="결제 수단">${esc(o.method)}</td><td data-label="금액">${money(o.total)}</td></tr>`).join('')}
</tbody></table></div>`:'<div class="my-none">아직 비회원 주문이 없습니다.</div>'}</section>`;
}

async function load(){
 shop.innerHTML=head()+'<div class="empty"><p>회원 정보를 불러오는 중입니다…</p></div>';
 try{await DB.whenAuthKnown()}catch{}
 if(!DB.current()){message('관리자 로그인이 필요합니다','관리자로 등록된 아이디로 로그인하면 회원 목록이 보입니다.',true);return}
 if(!await DB.isAdmin()){message('관리자 권한이 없습니다',`${esc(DB.current().id)} 계정은 관리자로 등록되어 있지 않습니다.`,false);return}
 try{members=await DB.listMembers()}catch(err){message('회원 목록을 불러오지 못했습니다',esc(DB.errorText(err)),false);return}
 // 회원별 장바구니 · 주문과 비회원 주문 (못 불러와도 회원 목록은 보여 준다)
 await Promise.all(members.map(async m=>{if(!m.uid)return;try{Object.assign(m,await DB.memberActivity(m.uid))}catch{}}));
 try{guests=await DB.listGuestOrders()}catch{guests=[]}
 render();
}

function openEdit(id){
 const m=members.find(x=>x.id===id);if(!m)return;const a=m.address||{};
 const dlg=shop.querySelector('.ad-dialog');
 dlg.innerHTML=`<form method="dialog" class="ad-form" novalidate><h2>회원 정보 수정 <small>${esc(id)}</small></h2>
 <label>이름<input name="name" value="${esc(m.name)}" required></label>
 <label>휴대폰<input name="phone" value="${esc(m.phone)}" inputmode="numeric" maxlength="13" placeholder="010-0000-0000"></label>
 <label>이메일<input name="email" type="email" value="${esc(m.email)}"></label>
 <label>우편번호<input name="zip" value="${esc(a.zip)}"></label>
 <label>주소<input name="addr1" value="${esc(a.addr1)}"></label>
 <label>상세 주소<input name="addr2" value="${esc(a.addr2)}"></label>
 <p class="ad-err" aria-live="polite"></p>
 <div class="ad-form-btns"><button type="button" class="sub-cta" data-cancel>취소</button><button type="submit" class="cta plain">저장</button></div></form>`;
 const f=dlg.querySelector('form');
 f.phone.addEventListener('input',()=>{f.phone.value=fmtPhone(f.phone.value)});
 f.querySelector('[data-cancel]').addEventListener('click',()=>dlg.close());
 f.addEventListener('submit',async e=>{
  e.preventDefault();
  const v=k=>f[k].value.trim(),err=f.querySelector('.ad-err');
  if(!v('name')){err.textContent='이름을 입력해 주세요.';return}
  if(v('phone')&&!isPhone(v('phone'))){err.textContent='휴대폰 번호를 010-0000-0000 형식으로 입력해 주세요.';return}
  if(v('email')&&!isEmail(v('email'))){err.textContent='이메일 형식이 맞지 않습니다.';return}
  const data={name:v('name'),phone:v('phone'),email:v('email'),address:{zip:v('zip'),addr1:v('addr1'),addr2:v('addr2')}};
  const btn=f.querySelector('[type=submit]');btn.disabled=true;
  try{await DB.updateMember(id,data)}catch(x){btn.disabled=false;err.textContent='저장하지 못했습니다. '+DB.errorText(x);return}
  Object.assign(m,data);dlg.close();flash=`${id} 회원 정보를 저장했습니다.`;render();
 });
 dlg.showModal();f.name.focus();
}

// 회원 한 명의 장바구니와 주문 · 결제 내역
function openDetail(id){
 const m=members.find(x=>x.id===id);if(!m)return;
 const dlg=shop.querySelector('.ad-dialog'),orders=[...(m.orders||[])].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 dlg.innerHTML=`<div class="ad-form ad-detail"><h2>${esc(m.name)} 님 내역 <small>${esc(id)}</small></h2>
 <h3>지금 장바구니 <small>${cartQty(m.cart)}개</small></h3>
 ${(m.cart||[]).length?`<ul class="ad-list">${[...m.cart].sort((a,b)=>String(b.addedAt||'').localeCompare(String(a.addedAt||''))).map(i=>`<li><span>${esc(cartLabel(i))}<br><small>${i.addedAt?dateTime(i.addedAt)+' 담음':'담은 날짜 기록 없음'}</small></span><em>× ${Number(i.quantity)||1}</em></li>`).join('')}</ul>`:'<p class="ad-none">비어 있습니다.</p>'}
 <h3>주문 · 결제 내역 <small>이번 달 ${monthOrders(m).length}건 · 전체 ${orders.length}건</small></h3>
 ${orders.length?`<ul class="ad-list">${orders.map(o=>`<li><span><b>${esc(o.no)}</b> ${date(o.date)} · ${esc(o.method)}<br><small>${(o.items||[]).map(i=>`${esc(i.quality)} · ${esc(i.duration)} × ${i.quantity}`).join(', ')}</small></span><em>${money(o.total)}</em></li>`).join('')}</ul>`:'<p class="ad-none">주문 내역이 없습니다.</p>'}
 <div class="ad-form-btns"><button type="button" class="cta plain" data-close>닫기</button></div></div>`;
 dlg.querySelector('[data-close]').addEventListener('click',()=>dlg.close());
 dlg.showModal();
}

// 위쪽 숫자(전체 회원 · 이번 달 가입 · 이번 달 주문 · 비회원 주문)를 누르면 그 내역을 회원 내역과 같은 창으로 보여 준다
function openStat(kind){
 const dlg=shop.querySelector('.ad-dialog'),byDate=(a,b)=>String(b.date||'').localeCompare(String(a.date||''));
 const memberLi=m=>`<li><span><b>${esc(m.name)}</b> ${esc(m.id)}<br><small>가입 ${date(m.joined)} · ${esc(m.phone||'-')} · 주문 ${(m.orders||[]).length}건</small></span><em>${money(sum(m.orders||[]))}</em></li>`;
 const orderLi=(o,who)=>`<li><span><b>${esc(o.no)}</b> ${date(o.date)} · ${esc(who)} · ${esc(o.method)}<br><small>${(o.items||[]).map(i=>`${esc(i.quality)} · ${esc(i.duration)} × ${i.quantity}`).join(', ')}</small></span><em>${money(o.total)}</em></li>`;
 let title,list;
 if(kind==='all'||kind==='join'){
  const ms=[...members].filter(m=>kind==='all'||String(m.joined||'').startsWith(thisMonth())).sort((a,b)=>String(b.joined||'').localeCompare(String(a.joined||'')));
  title=kind==='all'?`전체 회원 <small>${ms.length}명</small>`:`이번 달 가입 <small>${ms.length}명</small>`;
  list=ms.length?`<ul class="ad-list">${ms.map(memberLi).join('')}</ul>`:'<p class="ad-none">해당하는 회원이 없습니다.</p>';
 }else{
  const os=kind==='guest'?guests.map(o=>[o,`비회원 ${o.buyer?.name||''}`]):[...members.flatMap(m=>monthOrders(m).map(o=>[o,`${m.name} (${m.id})`])),...guests.filter(inMonth).map(o=>[o,`비회원 ${o.buyer?.name||''}`])];
  os.sort((a,b)=>byDate(a[0],b[0]));
  title=kind==='guest'?`비회원 주문 <small>${os.length}건</small>`:`이번 달 주문 <small>${os.length}건 · ${money(os.reduce((n,[o])=>n+(Number(o.total)||0),0))}</small>`;
  list=os.length?`<ul class="ad-list">${os.map(([o,who])=>orderLi(o,who)).join('')}</ul>`:'<p class="ad-none">해당하는 주문이 없습니다.</p>';
 }
 dlg.innerHTML=`<div class="ad-form ad-detail"><h2>${title}</h2>${list}<div class="ad-form-btns"><button type="button" class="cta plain" data-close>닫기</button></div></div>`;
 dlg.querySelector('[data-close]').addEventListener('click',()=>dlg.close());
 dlg.showModal();
}

// ---------------- 엑셀 저장: 파일 하나에 시트를 나눠 담는다 ----------------
// 회원 목록 · 회원 주문 · 장바구니 · 상담 신청 · 비회원 주문 · 판매 현황
// 칸 색 · 굵은 글씨 · 테두리를 넣을 수 있는 SheetJS 확장판(xlsx-js-style)을 쓴다
const XLSX_SRC='https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js';
let xlsxReady=null;
function loadXLSX(){
 if(window.XLSX)return Promise.resolve();
 return xlsxReady||(xlsxReady=new Promise((ok,fail)=>{const s=document.createElement('script');s.src=XLSX_SRC;s.onload=ok;s.onerror=()=>{xlsxReady=null;fail()};document.head.append(s)}));
}
const dateTime=iso=>{const d=new Date(iso);return isNaN(d)?'':`${date(iso)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};
const itemsText=o=>(o.items||[]).map(i=>`${i.quality} · ${i.duration} × ${i.quantity}`).join(', ');
function sheets(){
 const list=filtered(),byDate=(a,b)=>String(b.date||'').localeCompare(String(a.date||''));
 // 회원이 산 상품을 상품별로 모아 한 줄로 (예: 4K · 1분 × 2, 포인트 충전 · PLUS × 1)
 const boughtText=m=>{const c={};for(const o of m.orders||[])for(const i of o.items||[]){const k=`${i.quality} · ${i.duration}`;c[k]=(c[k]||0)+(Number(i.quantity)||1)}return Object.entries(c).map(([k,n])=>`${k} × ${n}`).join(', ')};
 const memberRows=list.map(m=>[m.id,m.name,m.phone,m.email,m.address?.zip,m.address?.addr1,m.address?.addr2,date(m.joined),(m.orders||[]).length,sum(m.orders||[]),boughtText(m),cartQty(m.cart),Number(m.points)||0]);
 const orderRows=[],cartRows=[],consultRows=[],memberLinks=[];
 for(const [mi,m] of list.entries()){
  // 회원 목록의 아이디를 누르면 '회원 주문' 시트의 그 회원 첫 주문으로 이동 (제목 2줄 + 머리글 1줄 아래부터 내용)
  if((m.orders||[]).length)memberLinks.push([mi,0,`#'회원 주문'!A${orderRows.length+4}`]);
  for(const o of [...(m.orders||[])].sort(byDate))orderRows.push([o.no,dateTime(o.date),m.id,m.name,o.buyer?.phone,o.buyer?.email,itemsText(o),o.method,Number(o.subtotal)||0,Number(o.vat)||0,Number(o.total)||0,Number(o.pointsUsed)||0,Number(o.pointsGained)||0,Number(o.paid??o.total)||0,o.request]);
  for(const i of [...(m.cart||[])].sort((a,b)=>String(b.addedAt||'').localeCompare(String(a.addedAt||''))))cartRows.push([m.id,m.name,dateTime(i.addedAt)||'기록 없음',cartLabel(i),Number(i.quantity)||1]);
  for(const r of [...(m.consults||[])].sort((a,b)=>String(b.savedAt||'').localeCompare(String(a.savedAt||''))))consultRows.push([dateTime(r.savedAt),m.id,m.name,r.fields?.contact,r.fields?.time,(r.items||[]).map(i=>`${i.quality} · ${i.duration} × ${i.quantity}`).join(', '),r.fields?.request]);
 }
 const guestRows=[...guests].sort(byDate).map(o=>[o.no,dateTime(o.date),o.buyer?.name,o.buyer?.phone,o.buyer?.email,itemsText(o),o.method,Number(o.subtotal)||0,Number(o.vat)||0,Number(o.total)||0,o.request]);
 // 판매 현황: 회원 · 비회원 전체 주문을 화질 · 길이 조합별로 합친다
 const count={};
 for(const o of [...list.flatMap(m=>m.orders||[]),...guests])for(const i of o.items||[]){const k=`${i.quality} · ${i.duration}`;const c=count[k]||(count[k]={qty:0,sales:0,orders:0});c.qty+=Number(i.quantity)||1;c.sales+=Number(i.price)||0;c.orders++}
 const salesRows=Object.entries(count).sort((a,b)=>b[1].qty-a[1].qty||b[1].sales-a[1].sales).map(([k,c],i)=>[i+1,k,c.orders,c.qty,c.sales]);
 // [시트 이름, 머리글, 내용, 금액 칸 번호, 합계를 낼 칸 번호]
 return [
  ['회원 목록',['아이디 (누르면 구매 내역)','이름','휴대폰','이메일','우편번호','주소','상세 주소','가입일','주문 수','주문 금액','구매 상품','장바구니 수량','보유 포인트'],memberRows,[9,12],[8,9,11,12],memberLinks],
  ['회원 주문',['주문번호','주문일시','아이디','이름','휴대폰','이메일','주문 상품','결제 수단','공급가액','부가세','주문 금액','포인트 차감','충전 포인트','실제 결제 금액','요청사항'],orderRows,[8,9,10,11,12,13],[8,9,10,11,12,13]],
  ['장바구니',['아이디','이름','담은 날짜','상품','수량'],cartRows,[],[4]],
  ['상담 신청',['신청일시','아이디','이름','연락처','희망 시간','상담 영상','상담 내용'],consultRows,[],[]],
  ['비회원 주문',['주문번호','주문일시','이름','휴대폰','이메일','주문 상품','결제 수단','공급가액','부가세','결제 금액','요청사항'],guestRows,[7,8,9],[7,8,9]],
  ['판매 현황',['순위','상품','주문 건수','판매 수량','판매 금액'],salesRows,[4],[2,3,4]]
 ];
}
// 보고서처럼 보이게: 1행 제목, 2행 저장 정보, 3행 머리글(파랑), 줄무늬 · 테두리 · 금액 쉼표, 맨 아래 합계
async function saveExcel(){
 await loadXLSX();
 const book=XLSX.utils.book_new(),today=date(new Date().toISOString()),A=XLSX.utils.encode_cell;
 const line={style:'thin',color:{rgb:'D0D0D0'}},border={top:line,bottom:line,left:line,right:line};
 const font={name:'맑은 고딕',sz:10};
 for(const [name,header,rows,moneyCols,sumCols,links=[]] of sheets()){
  const n=header.length,body=rows.map(r=>r.map(v=>v??''));
  const total=rows.length&&sumCols.length?header.map((_,c)=>c===0?'합계':sumCols.includes(c)?rows.reduce((s,r)=>s+(Number(r[c])||0),0):''):null;
  const ws=XLSX.utils.aoa_to_sheet([[`STUDIO 상상 · ${name}`],[`저장일 ${today} · 총 ${rows.length}건`],header,...body,...(total?[total]:[])]);
  ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:n-1}},{s:{r:1,c:0},e:{r:1,c:n-1}}];
  ws[A({r:0,c:0})].s={font:{...font,sz:15,bold:true},alignment:{vertical:'center'}};
  ws[A({r:1,c:0})].s={font:{...font,color:{rgb:'777777'}}};
  header.forEach((_,c)=>{ws[A({r:2,c})].s={font:{...font,bold:true,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:'1647FF'}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border}});
  body.forEach((r,i)=>r.forEach((v,c)=>{const cell=ws[A({r:i+3,c})];if(!cell)return;const money=moneyCols.includes(c)&&typeof v==='number';
   cell.s={font,border,fill:i%2?{fgColor:{rgb:'F5F7FF'}}:undefined,numFmt:money?'#,##0':undefined,alignment:{vertical:'center',horizontal:typeof v==='number'?'right':'left',wrapText:String(v).length>30}}}));
  // 시트 안 링크: 누르면 다른 시트의 해당 줄로 이동 (파란 밑줄 글씨)
  for(const [r,c,target] of links){const cell=ws[A({r:r+3,c})];if(!cell)continue;cell.l={Target:target,Tooltip:'구매 내역 보기'};cell.s={...cell.s,font:{...font,color:{rgb:'1647FF'},underline:true,bold:true}}}
  if(total)total.forEach((v,c)=>{const cell=ws[A({r:rows.length+3,c})];if(cell)cell.s={font:{...font,bold:true},fill:{fgColor:{rgb:'E0FF4F'}},border,numFmt:moneyCols.includes(c)?'#,##0':undefined,alignment:{horizontal:c===0?'center':'right',vertical:'center'}}});
  if(!rows.length){ws[A({r:3,c:0})]={t:'s',v:'아직 데이터가 없습니다.',s:{font:{...font,color:{rgb:'999999'}}}};ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:3,c:n-1}})}
  // 칸 너비: 한글은 영문 · 숫자보다 두 배 넓게 센다
  const wide=s=>[...String(s??'')].reduce((n,ch)=>n+(ch.charCodeAt(0)>255?2:1.1),0);
  ws['!cols']=header.map((h,c)=>({wch:Math.min(50,Math.max(wide(h)+5,...rows.map(r=>typeof r[c]==='number'?String(r[c]).length+6:wide(r[c])+3)))}));
  ws['!rows']=[{hpt:30},{hpt:18},{hpt:26}];
  if(rows.length)ws['!autofilter']={ref:XLSX.utils.encode_range({s:{r:2,c:0},e:{r:rows.length+2,c:n-1}})};
  XLSX.utils.book_append_sheet(book,ws,name);
 }
 XLSX.writeFile(book,`상상스튜디오_관리자데이터_${today.replace(/\./g,'')}.xlsx`);
}

shop.addEventListener('input',e=>{
 // 검색창은 그대로 두고 회원 표만 다시 그린다 (화면 전체를 다시 그리면 한글 조합이 끊겨 ㄱㅣㅁ처럼 입력됨)
 if(e.target.matches('.ad-search')){query=e.target.value;shop.querySelector('.ad-members').innerHTML=listHTML(filtered(),members,DB.current()?.id)}
});
shop.addEventListener('change',e=>{if(e.target.matches('.ad-sort')){sort=e.target.value;render()}});
shop.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-login')){openLogin();return}
 if(b.hasAttribute('data-refresh')){load();return}
 if(b.dataset.edit){openEdit(b.dataset.edit);return}
 if(b.dataset.detail){openDetail(b.dataset.detail);return}
 if(b.dataset.stat){openStat(b.dataset.stat);return}
 if(b.hasAttribute('data-row-toggle')){const tr=b.closest('tr'),open=tr.classList.toggle('open');b.setAttribute('aria-expanded',String(open));return}
 if(b.dataset.del){
  const id=b.dataset.del,m=members.find(x=>x.id===id);if(!m)return;
  if(!confirm(`${id} (${m.name}) 회원을 삭제할까요?\n회원 정보가 데이터베이스에서 지워지고, 이 아이디로는 더 로그인할 수 없습니다.`))return;
  b.disabled=true;
  try{await DB.deleteMember(id)}catch(x){b.disabled=false;alert('삭제하지 못했습니다. '+DB.errorText(x));return}
  members=members.filter(x=>x.id!==id);flash=`${id} 회원을 삭제했습니다.`;render();return;
 }
 if(b.hasAttribute('data-csv')){
  b.disabled=true;
  try{await saveExcel()}catch{alert('엑셀 파일을 만들지 못했습니다. 인터넷 연결을 확인해 주세요.')}
  b.disabled=false;
 }
});
// 헤더의 MEMBER 창에서 로그인 · 로그아웃하면 다시 확인한다
window.addEventListener('sangsang-member-change',()=>{if(DB&&!shop.querySelector('.ad-dialog[open]'))load()});

// member-db.js는 공통 헤더가 불러오므로 준비될 때까지 기다린다
(function wait(n){
 if(window.SangsangDB){DB=window.SangsangDB;load();return}
 if(n>200){message('회원 기능을 불러오지 못했습니다','인터넷 연결을 확인한 뒤 새로고침해 주세요.',false);return}
 setTimeout(()=>wait(n+1),50);
})(0);
})();
