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
const cartLabel=i=>{const c=C();const q=c?.qualities.find(x=>x.id===i.quality),d=c?.durations.find(x=>x.id===i.duration);return `${q?.name||i.quality} · ${d?.name||i.duration}`};
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
 const found=q?members.filter(m=>[m.id,m.name,m.phone,m.email,addrText(m.address)].some(v=>String(v||'').toLowerCase().includes(q))):[...members];
 found.sort(sort==='name'?(a,b)=>String(a.name).localeCompare(String(b.name),'ko'):(a,b)=>String(b.joined||'').localeCompare(String(a.joined||'')));
 return found;
}
const countText=(n,t)=>n===t?`전체 ${t}명`:`검색 결과 ${n}명 / 전체 ${t}명`;

function render(){
 const found=filtered(),all=members;
 const now=new Date(),month=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
 const me=DB.current()?.id;
 const mOrders=[...all.flatMap(monthOrders),...guests.filter(inMonth)],best=bestSellers();
 shop.innerHTML=head(`<ul class="my-stats ad-stats"><li><b>${all.length}</b>전체 회원</li><li><b>${all.filter(m=>String(m.joined||'').startsWith(month)).length}</b>이번 달 가입</li><li><b>${mOrders.length}</b>이번 달 주문</li><li><b>${guests.length}</b>비회원 주문</li></ul>`)+`
<section class="ad-insight" aria-label="주문 현황">
 <div class="ad-box"><h2>이번 달 매출 <small>회원 + 비회원 · 부가세 포함</small></h2><p class="ad-big">${money(sum(mOrders))}</p></div>
 <div class="ad-box"><h2>잘 팔리는 영상 <small>전체 주문 기준 TOP 5</small></h2>${best.length?`<ol class="ad-best">${best.map((b,i)=>`<li><b>${i+1}</b><span>${esc(b.name)}</span><em>${b.qty}개 · ${money(b.sales)}</em></li>`).join('')}</ol>`:'<p class="ad-none">아직 주문이 없습니다.</p>'}</div>
</section>
<p class="ad-notice">관리자 화면 · 회원 정보는 <b>Firebase 데이터베이스</b>에 저장되어 있어 어느 기기에서 가입한 회원이든 모두 보입니다. <button type="button" class="text-link" data-refresh>새로고침</button></p>
<div class="list-tools ad-tools">
 <input class="ad-search" type="search" placeholder="아이디 · 이름 · 휴대폰 · 이메일 · 주소 검색" value="${esc(query)}" aria-label="회원 검색">
 <div class="tool-btns"><select class="ad-sort" aria-label="정렬"><option value="new"${sort==='new'?' selected':''}>최근 가입순</option><option value="name"${sort==='name'?' selected':''}>이름순</option></select>
 <button type="button" class="ghost" data-csv${all.length||guests.length?'':' disabled'}>엑셀 저장 (전체 데이터)</button></div>
</div>
<p class="ad-flash" role="status">${esc(flash)}</p>
${all.length?(found.length?`<div class="ad-table-wrap"><table class="ad-table">
<thead><tr><th>아이디</th><th>이름</th><th>휴대폰</th><th>이메일</th><th>주소</th><th>가입일</th><th>이번 달 주문</th><th>장바구니</th><th>포인트</th><th>관리</th></tr></thead>
<tbody>${found.map(m=>`<tr>
 <td data-label="아이디"><strong>${esc(m.id)}</strong>${me===m.id?'<span class="ad-on">나</span>':''}</td>
 <td data-label="이름">${esc(m.name)}</td><td data-label="휴대폰">${esc(m.phone||'-')}</td><td data-label="이메일">${esc(m.email||'-')}</td>
 <td data-label="주소" class="ad-addr">${esc(addrText(m.address))||'<span class="ad-none">없음</span>'}</td>
 <td data-label="가입일">${date(m.joined)}</td>
 <td data-label="이번 달 주문">${monthOrders(m).length?`<b>${monthOrders(m).length}건</b><br><small>${money(sum(monthOrders(m)))}</small>`:'<span class="ad-none">없음</span>'}</td>
 <td data-label="장바구니">${cartQty(m.cart)?`${cartQty(m.cart)}개`:'<span class="ad-none">비어 있음</span>'}</td>
 <td data-label="포인트">${m.points?`${Number(m.points).toLocaleString('ko-KR')}c`:'<span class="ad-none">0c</span>'}</td>
 <td class="ad-actions"><button type="button" class="ghost" data-detail="${esc(m.id)}">내역</button><button type="button" class="ghost" data-edit="${esc(m.id)}">수정</button>${me===m.id?'':`<button type="button" class="ghost ad-del" data-del="${esc(m.id)}">삭제</button>`}</td>
</tr>`).join('')}</tbody></table></div>
<p class="ad-count">${countText(found.length,all.length)}</p>`:`<div class="my-none">'${esc(query)}'에 맞는 회원이 없습니다.</div>`)
:`<div class="empty"><h2>아직 가입한 회원이 없습니다</h2><p>헤더의 MEMBER 메뉴에서 회원가입하면 여기에 나타납니다.</p></div>`}
<section class="ad-guests"><div class="block-title"><h2>비회원 주문 <small>${guests.length}건 · 최근 주문부터</small></h2></div>
${guests.length?`<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>주문번호</th><th>주문일</th><th>주문자</th><th>연락처</th><th>주문 영상</th><th>결제 수단</th><th>금액</th></tr></thead><tbody>
${[...guests].sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(o=>`<tr><td data-label="주문번호"><strong>${esc(o.no)}</strong></td><td data-label="주문일">${date(o.date)}</td><td data-label="주문자">${esc(o.buyer?.name)}</td><td data-label="연락처">${esc(o.buyer?.phone)}</td><td data-label="주문 영상">${(o.items||[]).map(i=>`${esc(i.quality)} · ${esc(i.duration)} × ${i.quantity}`).join('<br>')}</td><td data-label="결제 수단">${esc(o.method)}</td><td data-label="금액">${money(o.total)}</td></tr>`).join('')}
</tbody></table></div>`:'<div class="my-none">아직 비회원 주문이 없습니다.</div>'}</section>
<dialog class="ad-dialog"></dialog>`;
 flash='';
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

// ---------------- 엑셀 저장: 파일 하나에 시트를 나눠 담는다 ----------------
// 회원 목록 · 회원 주문 · 장바구니 · 상담 신청 · 비회원 주문 · 판매 현황
const XLSX_SRC='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
let xlsxReady=null;
function loadXLSX(){
 if(window.XLSX)return Promise.resolve();
 return xlsxReady||(xlsxReady=new Promise((ok,fail)=>{const s=document.createElement('script');s.src=XLSX_SRC;s.onload=ok;s.onerror=()=>{xlsxReady=null;fail()};document.head.append(s)}));
}
const dateTime=iso=>{const d=new Date(iso);return isNaN(d)?'':`${date(iso)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};
const itemsText=o=>(o.items||[]).map(i=>`${i.quality} · ${i.duration} × ${i.quantity}`).join(', ');
function sheets(){
 const list=filtered(),byDate=(a,b)=>String(b.date||'').localeCompare(String(a.date||''));
 const memberRows=list.map(m=>[m.id,m.name,m.phone,m.email,m.address?.zip,m.address?.addr1,m.address?.addr2,date(m.joined),(m.orders||[]).length,sum(m.orders||[]),cartQty(m.cart)]);
 const orderRows=[],cartRows=[],consultRows=[];
 for(const m of list){
  for(const o of [...(m.orders||[])].sort(byDate))orderRows.push([o.no,dateTime(o.date),m.id,m.name,o.buyer?.phone,o.buyer?.email,itemsText(o),o.method,Number(o.subtotal)||0,Number(o.vat)||0,Number(o.total)||0,o.request]);
  for(const i of [...(m.cart||[])].sort((a,b)=>String(b.addedAt||'').localeCompare(String(a.addedAt||''))))cartRows.push([m.id,m.name,dateTime(i.addedAt)||'기록 없음',cartLabel(i),Number(i.quantity)||1]);
  for(const r of [...(m.consults||[])].sort((a,b)=>String(b.savedAt||'').localeCompare(String(a.savedAt||''))))consultRows.push([dateTime(r.savedAt),m.id,m.name,r.fields?.contact,r.fields?.time,(r.items||[]).map(i=>`${i.quality} · ${i.duration} × ${i.quantity}`).join(', '),r.fields?.request]);
 }
 const guestRows=[...guests].sort(byDate).map(o=>[o.no,dateTime(o.date),o.buyer?.name,o.buyer?.phone,o.buyer?.email,itemsText(o),o.method,Number(o.subtotal)||0,Number(o.vat)||0,Number(o.total)||0,o.request]);
 // 판매 현황: 회원 · 비회원 전체 주문을 화질 · 길이 조합별로 합친다
 const count={};
 for(const o of [...list.flatMap(m=>m.orders||[]),...guests])for(const i of o.items||[]){const k=`${i.quality} · ${i.duration}`;const c=count[k]||(count[k]={qty:0,sales:0,orders:0});c.qty+=Number(i.quantity)||1;c.sales+=Number(i.price)||0;c.orders++}
 const salesRows=Object.entries(count).sort((a,b)=>b[1].qty-a[1].qty||b[1].sales-a[1].sales).map(([k,c],i)=>[i+1,k,c.orders,c.qty,c.sales]);
 return [
  ['회원 목록',['아이디','이름','휴대폰','이메일','우편번호','주소','상세 주소','가입일','주문 수','주문 금액','장바구니 수량'],memberRows],
  ['회원 주문',['주문번호','주문일시','아이디','이름','휴대폰','이메일','주문 영상','결제 수단','상품 금액','부가세','결제 금액','요청사항'],orderRows],
  ['장바구니',['아이디','이름','담은 날짜','영상 (화질 · 길이)','수량'],cartRows],
  ['상담 신청',['신청일시','아이디','이름','연락처','희망 시간','상담 영상','상담 내용'],consultRows],
  ['비회원 주문',['주문번호','주문일시','이름','휴대폰','이메일','주문 영상','결제 수단','상품 금액','부가세','결제 금액','요청사항'],guestRows],
  ['판매 현황',['순위','영상 (화질 · 길이)','주문 건수','판매 수량','판매 금액'],salesRows]
 ];
}
async function saveExcel(){
 await loadXLSX();
 const book=XLSX.utils.book_new();
 for(const [name,header,rows] of sheets()){
  const ws=XLSX.utils.aoa_to_sheet([header,...rows.map(r=>r.map(v=>v??''))]);
  ws['!cols']=header.map((h,c)=>({wch:Math.min(50,Math.max(String(h).length*2+2,...rows.map(r=>String(r[c]??'').length+2)))}));
  XLSX.utils.book_append_sheet(book,ws,name);
 }
 XLSX.writeFile(book,`상상스튜디오_관리자데이터_${date(new Date().toISOString()).replace(/\./g,'')}.xlsx`);
}

shop.addEventListener('input',e=>{
 if(e.target.matches('.ad-search')){query=e.target.value;const pos=e.target.selectionStart;render();const s=shop.querySelector('.ad-search');s.focus();s.setSelectionRange(pos,pos)}
});
shop.addEventListener('change',e=>{if(e.target.matches('.ad-sort')){sort=e.target.value;render()}});
shop.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-login')){openLogin();return}
 if(b.hasAttribute('data-refresh')){load();return}
 if(b.dataset.edit){openEdit(b.dataset.edit);return}
 if(b.dataset.detail){openDetail(b.dataset.detail);return}
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
