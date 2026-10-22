// 회원 관리(관리자 화면): 회원 목록 · 검색 · 정보 수정 · 삭제 · 엑셀(CSV) 저장
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
let DB=null,members=[],query='',sort='new',flash='';

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
 shop.innerHTML=head(`<ul class="my-stats ad-stats"><li><b>${all.length}</b>전체 회원</li><li><b>${all.filter(m=>String(m.joined||'').startsWith(month)).length}</b>이번 달 가입</li></ul>`)+`
<p class="ad-notice">관리자 화면 · 회원 정보는 <b>Firebase 데이터베이스</b>에 저장되어 있어 어느 기기에서 가입한 회원이든 모두 보입니다. <button type="button" class="text-link" data-refresh>새로고침</button></p>
<div class="list-tools ad-tools">
 <input class="ad-search" type="search" placeholder="아이디 · 이름 · 휴대폰 · 이메일 · 주소 검색" value="${esc(query)}" aria-label="회원 검색">
 <div class="tool-btns"><select class="ad-sort" aria-label="정렬"><option value="new"${sort==='new'?' selected':''}>최근 가입순</option><option value="name"${sort==='name'?' selected':''}>이름순</option></select>
 <button type="button" class="ghost" data-csv${all.length?'':' disabled'}>엑셀(CSV) 저장</button></div>
</div>
<p class="ad-flash" role="status">${esc(flash)}</p>
${all.length?(found.length?`<div class="ad-table-wrap"><table class="ad-table">
<thead><tr><th>아이디</th><th>이름</th><th>휴대폰</th><th>이메일</th><th>주소</th><th>가입일</th><th>관리</th></tr></thead>
<tbody>${found.map(m=>`<tr>
 <td data-label="아이디"><strong>${esc(m.id)}</strong>${me===m.id?'<span class="ad-on">나</span>':''}</td>
 <td data-label="이름">${esc(m.name)}</td><td data-label="휴대폰">${esc(m.phone||'-')}</td><td data-label="이메일">${esc(m.email||'-')}</td>
 <td data-label="주소" class="ad-addr">${esc(addrText(m.address))||'<span class="ad-none">없음</span>'}</td>
 <td data-label="가입일">${date(m.joined)}</td>
 <td class="ad-actions"><button type="button" class="ghost" data-edit="${esc(m.id)}">수정</button>${me===m.id?'':`<button type="button" class="ghost ad-del" data-del="${esc(m.id)}">삭제</button>`}</td>
</tr>`).join('')}</tbody></table></div>
<p class="ad-count">${countText(found.length,all.length)}</p>`:`<div class="my-none">'${esc(query)}'에 맞는 회원이 없습니다.</div>`)
:`<div class="empty"><h2>아직 가입한 회원이 없습니다</h2><p>헤더의 MEMBER 메뉴에서 회원가입하면 여기에 나타납니다.</p></div>`}
<dialog class="ad-dialog"></dialog>`;
 flash='';
}

async function load(){
 shop.innerHTML=head()+'<div class="empty"><p>회원 정보를 불러오는 중입니다…</p></div>';
 try{await DB.whenAuthKnown()}catch{}
 if(!DB.current()){message('관리자 로그인이 필요합니다','관리자로 등록된 아이디로 로그인하면 회원 목록이 보입니다.',true);return}
 if(!await DB.isAdmin()){message('관리자 권한이 없습니다',`${esc(DB.current().id)} 계정은 관리자로 등록되어 있지 않습니다.`,false);return}
 try{members=await DB.listMembers()}catch(err){message('회원 목록을 불러오지 못했습니다',esc(DB.errorText(err)),false);return}
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

shop.addEventListener('input',e=>{
 if(e.target.matches('.ad-search')){query=e.target.value;const pos=e.target.selectionStart;render();const s=shop.querySelector('.ad-search');s.focus();s.setSelectionRange(pos,pos)}
});
shop.addEventListener('change',e=>{if(e.target.matches('.ad-sort')){sort=e.target.value;render()}});
shop.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-login')){openLogin();return}
 if(b.hasAttribute('data-refresh')){load();return}
 if(b.dataset.edit){openEdit(b.dataset.edit);return}
 if(b.dataset.del){
  const id=b.dataset.del,m=members.find(x=>x.id===id);if(!m)return;
  if(!confirm(`${id} (${m.name}) 회원을 삭제할까요?\n회원 정보가 데이터베이스에서 지워지고, 이 아이디로는 더 로그인할 수 없습니다.`))return;
  b.disabled=true;
  try{await DB.deleteMember(id)}catch(x){b.disabled=false;alert('삭제하지 못했습니다. '+DB.errorText(x));return}
  members=members.filter(x=>x.id!==id);flash=`${id} 회원을 삭제했습니다.`;render();return;
 }
 if(b.hasAttribute('data-csv')){
  const rows=[['아이디','이름','휴대폰','이메일','우편번호','주소','상세 주소','가입일'],...filtered().map(m=>[m.id,m.name,m.phone,m.email,m.address?.zip,m.address?.addr1,m.address?.addr2,date(m.joined)])];
  const csv=rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
  // 엑셀에서 한글이 깨지지 않도록 BOM을 붙인다
  const url=URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=`상상스튜디오_회원목록_${date(new Date().toISOString()).replace(/\./g,'')}.csv`;a.click();URL.revokeObjectURL(url);
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
