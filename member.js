// MEMBER 메뉴 + 로그인/회원가입 팝업
// 정적 사이트라 서버가 없으므로, 가입 정보는 이 브라우저(localStorage)에만 시연용으로 저장된다.
(()=>{
const siteRoot=new URL('.',document.currentScript.src);
const host=document.querySelector('sangsang-header');if(!host||!host.shadowRoot)return;
const shadow=host.shadowRoot;const nav=shadow.querySelector('nav');if(!nav||shadow.querySelector('[data-member]'))return;

const style=document.createElement('style');
style.textContent=`
.member-layer{position:fixed;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(8,8,8,.62);opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s;font-family:UnifiedSeoul,Arial,sans-serif}
.member-layer.open{opacity:1;visibility:visible}
.member-dialog{position:relative;display:grid;grid-template-columns:5fr 6fr;width:min(880px,100%);max-height:calc(100vh - 48px);overflow:hidden;background:#fff;transform:translateY(24px);transition:transform .3s}
/* 회원가입처럼 긴 화면에서만 창 높이를 고정하고, 왼쪽 검은 소개 영역은 그대로 둔 채 오른쪽 입력 영역만 스크롤 */
.member-dialog.tall{height:min(680px,calc(100vh - 48px))}
.member-body{min-height:0;overflow-y:auto;overscroll-behavior:contain}
.member-layer.open .member-dialog{transform:none}
.member-visual{display:flex;flex-direction:column;justify-content:space-between;gap:40px;padding:48px 40px;background:#080808;color:#fff}
.member-visual .brand{display:flex;align-items:center;gap:10px}.member-visual .brand span{font:800 11px Arial;letter-spacing:4px}.member-visual .brand strong{font-size:26px;font-weight:800}
.member-visual h2{margin:0;font-size:38px;font-weight:800;line-height:1.25;letter-spacing:-.02em}.member-visual h2 em{font-style:normal;color:#e0ff4f}
.member-visual p{margin:0;font-size:15px;line-height:1.6;color:#bdbdbd}
.member-body{padding:44px 44px 40px}
.member-close{position:absolute;top:14px;right:14px;width:40px;height:40px;border:0;background:none;font-size:26px;line-height:1;cursor:pointer;color:#080808}
.member-close:hover{background:#e0ff4f}
.member-tabs{display:grid;grid-template-columns:1fr 1fr;margin-bottom:32px;border-bottom:1px solid #ddd}
.member-tabs button{padding:14px 0;border:0;background:none;font:500 17px UnifiedSeoul,Arial,sans-serif;color:#9a9a9a;cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-1px}
.member-tabs button[aria-selected="true"]{color:#080808;font-weight:800;border-bottom-color:#080808}
.member-tabs button:hover{color:#080808}
form[hidden],.member-done[hidden],.member-tabs[hidden]{display:none}
.field{margin-bottom:20px}
.field label{display:block;margin-bottom:6px;font-size:13px;color:#555}.field label b{color:#1647ff;font-weight:500}
.field input{width:100%;padding:10px 0;border:0;border-bottom:1px solid #bbb;font:400 16px UnifiedSeoul,Arial,sans-serif;color:#080808;background:none;border-radius:0}
.field input:focus{outline:0;border-bottom:2px solid #080808;padding-bottom:9px}
.field.error input{border-bottom-color:#e5402f}
/* 찾기 질문: 처음 모양(테두리 상자) 그대로, 위아래 간격만 다른 칸과 맞춘다 */
.field select{display:block;width:100%;margin:2px 0 12px;padding:10px 8px;border:1px solid #bbb;font:400 15px UnifiedSeoul,Arial,sans-serif;color:#080808;background:#fff;border-radius:0}
.field.q-field{margin-top:24px;margin-bottom:24px}
.field.q-field label{margin-bottom:8px}
form[data-method="mail"] .by-q,form[data-method="q"] .by-mail{display:none}
.find-method{display:grid;grid-template-columns:1fr 1fr;margin:0 0 22px;padding-bottom:22px;border-bottom:1px solid #ddd}
.find-method button{height:44px;border:1px solid #080808;background:#fff;font:500 15px UnifiedSeoul,Arial,sans-serif;color:#080808;cursor:pointer;transition:background .2s,color .2s,border-color .2s}
.find-method button+button{border-left:0}
.find-method button[aria-checked="true"]{background:#080808;color:#fff}
.find-method button:hover{background:#1647ff;border-color:#1647ff;color:#fff}
.member-find button,.member-note button{transition:color .2s,background .2s}
.member-find button:hover{background:#1647ff;color:#fff;text-decoration:none}
.member-find{margin-top:14px}.member-find-title{margin:0 0 20px;font-size:22px;font-weight:800}
.field .msg{display:none;margin-top:6px;font-size:12px;color:#e5402f}.field.error .msg{display:block}
.field .ok{margin:6px 0 0;font-size:12px;color:#1647ff}.field.error .ok{display:none}
.with-btn{display:flex;align-items:flex-end;gap:10px}.with-btn input{flex:1;min-width:0}
.check-btn{flex:0 0 auto;height:38px;padding:0 14px;border:1px solid #080808;background:#fff;font:500 14px UnifiedSeoul,Arial,sans-serif;color:#080808;cursor:pointer;transition:background .2s,color .2s}
.check-btn:hover{background:#080808;color:#fff}.check-btn.done{background:#e0ff4f;border-color:#e0ff4f}
form[data-form="join"] .field{margin-bottom:16px}
.agree{display:flex;align-items:center;gap:8px;margin:4px 0 24px;font-size:14px;color:#333;cursor:pointer}.agree input{width:18px;height:18px;accent-color:#080808}
.agree.error{color:#e5402f}
.member-submit{display:flex;align-items:center;justify-content:space-between;width:100%;height:58px;padding:0 22px;border:0;background:#e0ff4f;color:#080808;font:500 18px UnifiedSeoul,Arial,sans-serif;cursor:pointer;transition:background .2s,color .2s}
.member-submit:hover{background:#080808;color:#fff}
.member-submit::after{content:"→";font-size:22px}
.member-note{margin:16px 0 0;font-size:13px;color:#888;text-align:center}
.member-note button{border:0;background:none;padding:0;font:inherit;color:#080808;text-decoration:underline;cursor:pointer}
.member-form-msg{min-height:20px;margin:-8px 0 12px;font-size:13px;color:#e5402f}
.today-skip{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:16px;font-size:14px;color:#555;cursor:pointer}.today-skip[hidden]{display:none}.today-skip input{width:17px;height:17px;accent-color:#080808}
.member-done .member-alt{margin-bottom:10px}
.member-done{padding:28px 0 8px;text-align:center}.member-done h3{margin:0 0 10px;font-size:26px;font-weight:800}.member-done p{margin:0 0 28px;color:#555;line-height:1.6}
.member-alt{margin-bottom:10px;background:#fff;border:1px solid #080808;text-decoration:none;box-sizing:border-box}.member-alt[hidden]{display:none}
.addr-line{margin-top:8px}
.addr-layer{position:absolute;left:0;right:0;z-index:5;display:flex;flex-direction:column;background:#fff}.addr-layer[hidden]{display:none}
.addr-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:2px solid #080808;font-size:17px;font-weight:800}
.addr-head button{width:36px;height:36px;border:0;background:none;font-size:24px;cursor:pointer}.addr-head button:hover{background:#e0ff4f}
.addr-box{flex:1;min-height:0;overflow:hidden}
.addr-fail{padding:24px 18px;font-size:14px;line-height:1.7;color:#555}
.addr-note{margin:0;padding:10px 18px;background:#f4f4f4;font-size:13px;line-height:1.55;color:#555}.addr-note b{color:#080808}
@media(max-width:750px){nav{gap:2px}nav a{padding:10px 6px}}
@media(max-width:520px){nav{gap:0}nav a{font-size:11.5px;padding:9px 5px;letter-spacing:-.01em}}
@media(max-width:750px){.member-layer{padding:14px}.member-dialog{grid-template-columns:1fr;height:auto;max-height:calc(100vh - 28px)}.member-visual{display:none}.member-body{padding:52px 22px 28px}.member-visual h2{font-size:28px}}
`;
shadow.append(style);

const link=document.createElement('a');link.href='#member';link.textContent='MEMBER';link.dataset.member='';link.setAttribute('aria-haspopup','dialog');
nav.append(link);

const qOptions=(window.SangsangDB?.questions||[]).map(q=>`<option>${q}</option>`).join('');
// 찾기 방법: 가입 이메일로 인증 / 가입할 때 고른 질문으로 인증
const methodSwitch=`<div class="find-method" role="radiogroup" aria-label="인증 방법"><button type="button" role="radio" data-method="mail" aria-checked="true">이메일로 인증</button><button type="button" role="radio" data-method="q" aria-checked="false">질문으로 인증</button></div>`;
const layer=document.createElement('div');layer.className='member-layer';
layer.innerHTML=`<div class="member-dialog" role="dialog" aria-modal="true" aria-label="회원 로그인 및 가입">
<button class="member-close" type="button" aria-label="닫기">×</button>
<div class="member-visual"><div class="brand"><span>STUDIO</span><strong>상상</strong></div>
<h2>상상을 함께할<br><em>멤버</em>가<br>되어 주세요</h2>
<p>회원이 되면 견적 내역과<br>상담 진행 상황을 한 곳에서 확인할 수 있습니다.</p></div>
<div class="member-body">
<div class="member-tabs" role="tablist"><button type="button" role="tab" data-tab="login" aria-selected="true">로그인</button><button type="button" role="tab" data-tab="join" aria-selected="false">회원가입</button></div>
<form data-form="login" novalidate>
<div class="field"><label for="m-login-id">아이디 <b>*</b></label><input id="m-login-id" name="userid" type="text" autocomplete="username" autocapitalize="off" spellcheck="false" placeholder="아이디"><p class="msg">아이디를 입력해 주세요.</p></div>
<div class="field"><label for="m-login-pw">비밀번호 <b>*</b></label><input id="m-login-pw" name="password" type="password" autocomplete="current-password" placeholder="비밀번호"><p class="msg">비밀번호를 입력해 주세요.</p></div>
<p class="member-form-msg" aria-live="polite"></p>
<button class="member-submit" type="submit">로그인</button>
<p class="member-note member-find"><button type="button" data-go="findid">아이디 찾기</button> · <button type="button" data-go="findpw">비밀번호 찾기</button></p>
<p class="member-note">아직 회원이 아니신가요? <button type="button" data-go="join">회원가입</button></p>
</form>
<form data-form="findsetup" novalidate hidden>
<h3 class="member-find-title">찾기 질문 등록</h3>
<p class="member-note member-setup-guide">질문과 답을 등록하면 로그인 창의 '아이디 찾기 · 비밀번호 찾기'에서 질문으로 찾을 수 있습니다.</p>
<div class="field q-field"><label for="m-set-q">찾기 질문 <b>*</b></label><select id="m-set-q" name="question">${qOptions}</select><input name="answer" type="text" autocomplete="off" placeholder="질문의 답" aria-label="질문의 답"><p class="msg">질문의 답을 입력해 주세요.</p></div>
<div class="field" data-setup-mail><label for="m-set-email">찾기에 쓸 메일 <b>*</b></label><input id="m-set-email" name="email" type="email" autocomplete="email" placeholder="example@email.com"><p class="msg">이메일 형식으로 입력해 주세요.</p><p class="ok">등록한 메일로 인증 링크를 보내 드립니다. 인증하면 메일로도 비밀번호를 찾을 수 있습니다.</p></div>
<p class="member-form-msg" aria-live="polite"></p>
<button class="member-submit" type="submit">등록하기</button>
<p class="member-note"><button type="button" data-setup-later>나중에 할게요</button></p>
</form>
<form data-form="findid" data-method="mail" novalidate hidden>
<h3 class="member-find-title">아이디 찾기</h3>
${methodSwitch}
<div class="field"><label for="m-fid-email">가입한 이메일 <b>*</b></label><input id="m-fid-email" name="email" type="email" autocomplete="email" placeholder="example@email.com"><p class="msg">이메일 형식으로 입력해 주세요.</p></div>
<div class="field q-field by-q"><label for="m-fid-q">가입할 때 고른 질문 <b>*</b></label><select id="m-fid-q" name="question">${qOptions}</select><input name="answer" type="text" autocomplete="off" placeholder="질문의 답" aria-label="질문의 답"><p class="msg">답을 입력해 주세요.</p></div>
<p class="member-form-msg" aria-live="polite"></p>
<p class="member-note by-mail">가입한 이메일로 확인 링크를 보내 드립니다. 메일의 링크를 누르면 아이디가 보입니다.</p>
<button class="member-submit" type="submit"><span class="by-mail">확인 메일 받기</span><span class="by-q">아이디 찾기</span></button>
<p class="member-note"><button type="button" data-go="login">로그인으로 돌아가기</button></p>
</form>
<form data-form="findpw" data-method="mail" novalidate hidden>
<h3 class="member-find-title">비밀번호 찾기</h3>
${methodSwitch}
<div class="field"><label for="m-fpw-id">아이디 <b>*</b></label><input id="m-fpw-id" name="userid" type="text" autocomplete="username" autocapitalize="off" spellcheck="false" placeholder="아이디"><p class="msg">아이디를 입력해 주세요.</p></div>
<div class="field by-mail"><label for="m-fpw-email">가입한 이메일 <b>*</b></label><input id="m-fpw-email" name="email" type="email" autocomplete="email" placeholder="example@email.com"><p class="msg">이메일 형식으로 입력해 주세요.</p></div>
<div class="field q-field by-q"><label for="m-fpw-q">가입할 때 고른 질문 <b>*</b></label><select id="m-fpw-q" name="question">${qOptions}</select><input name="answer" type="text" autocomplete="off" placeholder="질문의 답" aria-label="질문의 답"><p class="msg">답을 입력해 주세요.</p></div>
<p class="member-form-msg" aria-live="polite"></p>
<button class="member-submit" type="submit">재설정 메일 받기</button>
<p class="member-note">확인되면 가입한 이메일로 비밀번호 재설정 링크를 보내 드립니다. <button type="button" data-go="login">로그인으로 돌아가기</button></p>
</form>
<form data-form="join" novalidate hidden>
<div class="field"><label for="m-join-id">아이디 <b>*</b></label><div class="with-btn"><input id="m-join-id" name="userid" type="text" autocomplete="username" autocapitalize="off" spellcheck="false" maxlength="12" placeholder="영문 소문자·숫자 4~12자"><button type="button" class="check-btn" data-check-id>중복확인</button></div><p class="msg">영문 소문자로 시작하는 4~12자(소문자·숫자)로 입력해 주세요.</p><p class="ok" hidden></p></div>
<div class="field"><label for="m-join-pw">비밀번호 <b>*</b></label><input id="m-join-pw" name="password" type="password" autocomplete="new-password" placeholder="영문·숫자 포함 8자 이상"><p class="msg">영문과 숫자를 함께 넣어 8자 이상 입력해 주세요.</p></div>
<div class="field"><label for="m-join-pw2">비밀번호 확인 <b>*</b></label><input id="m-join-pw2" name="password2" type="password" autocomplete="new-password" placeholder="비밀번호 다시 입력"><p class="msg">비밀번호가 일치하지 않습니다.</p></div>
<div class="field"><label for="m-join-name">이름 <b>*</b></label><input id="m-join-name" name="name" type="text" autocomplete="name" placeholder="홍길동"><p class="msg">이름을 입력해 주세요.</p></div>
<div class="field"><label for="m-join-phone">휴대폰 번호 <b>*</b></label><input id="m-join-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" maxlength="13" placeholder="010-0000-0000"><p class="msg">휴대폰 번호를 정확히 입력해 주세요.</p></div>
<div class="field"><label for="m-join-email">이메일 <b>*</b></label><input id="m-join-email" name="email" type="email" autocomplete="email" placeholder="example@email.com"><p class="msg">이메일 형식으로 입력해 주세요.</p></div>
<div class="field q-field"><label for="m-join-q">아이디 · 비밀번호 찾기 질문 <b>*</b></label><select id="m-join-q" name="question">${qOptions}</select><input name="answer" type="text" autocomplete="off" placeholder="질문의 답" aria-label="질문의 답"><p class="msg">질문을 고르고 답을 입력해 주세요.</p></div>
<div class="field" data-address><label for="m-join-zip">주소 (선택)</label><div class="with-btn"><input id="m-join-zip" name="zip" readonly placeholder="우편번호"><button type="button" class="check-btn" data-addr>주소 검색</button></div><input class="addr-line" name="addr1" readonly placeholder="주소 검색을 눌러 주세요" aria-label="기본 주소"><input class="addr-line" name="addr2" autocomplete="address-line2" placeholder="상세 주소 (동 · 호수)" aria-label="상세 주소"><p class="msg">주소 검색으로 주소를 입력해 주세요.</p></div>
<label class="agree"><input name="agree" type="checkbox"> 개인정보 수집 및 이용에 동의합니다 (필수)</label>
<p class="member-form-msg" aria-live="polite"></p>
<button class="member-submit" type="submit">회원가입</button>
<p class="member-note">이미 회원이신가요? <button type="button" data-go="login">로그인</button></p>
</form>
<div class="member-done" hidden><h3></h3><p></p><a class="member-submit member-alt" data-mypage href="${new URL('mypage/index.html',siteRoot)}" hidden>마이페이지</a><button class="member-submit" type="button" data-done>확인</button><label class="today-skip" hidden><input type="checkbox" data-skip-today> 오늘 다시 보지 않기</label></div>
</div>
<div class="addr-layer" role="dialog" aria-label="주소 검색" hidden><div class="addr-head">주소 검색<button type="button" data-addr-close aria-label="주소 검색 닫기">×</button></div><div class="addr-box"></div></div>
</div>`;
shadow.append(layer);

const $=s=>layer.querySelector(s);
const forms={login:$('[data-form="login"]'),join:$('[data-form="join"]'),findid:$('[data-form="findid"]'),findpw:$('[data-form="findpw"]'),findsetup:$('[data-form="findsetup"]')};
const done=$('.member-done');
// 가입 · 로그인은 member-db.js(Firebase)가 처리하고, 여기서는 로그인한 회원의 사본만 읽는다
const SESSION='sangsang-member-session';
const DB=window.SangsangDB;
// 사이트 운영용으로 남겨 두는 아이디
const RESERVED=['admin','sangsang','studio','test1234'];
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
// 예전 버전에서 이 브라우저에만 저장했던 회원 정보는 더 쓰지 않으므로 지운다
try{localStorage.removeItem('sangsang-members')}catch{}
// 버튼을 누른 뒤 서버 응답을 기다리는 동안 두 번 누르지 않게 막는다
async function busy(btn,job){btn.disabled=true;try{return await job()}finally{btn.disabled=false}}
const isEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isId=v=>/^[a-z][a-z0-9]{3,11}$/.test(v);
const isPw=v=>v.length>=8&&/[a-zA-Z]/.test(v)&&/\d/.test(v);
const isPhone=v=>/^01[016789]-\d{3,4}-\d{4}$/.test(v);
const fmtPhone=v=>{const d=v.replace(/\D/g,'').slice(0,11);return d.length<4?d:d.length<8?`${d.slice(0,3)}-${d.slice(3)}`:`${d.slice(0,3)}-${d.slice(3,d.length-4)}-${d.slice(-4)}`};
let checkedId='';

function showTab(name){
 for(const b of layer.querySelectorAll('[data-tab]'))b.setAttribute('aria-selected',String(b.dataset.tab===name));
 for(const [k,f] of Object.entries(forms))f.hidden=k!==name;
 dialog.classList.toggle('tall',name==='join');
 done.hidden=true;$('.member-tabs').hidden=false;
 for(const f of Object.values(forms)){f.querySelectorAll('.error').forEach(e=>e.classList.remove('error'));f.querySelector('.member-form-msg').textContent=''}
 resetIdCheck();
 forms[name].querySelector('input').focus();
}
function showDone(title,text,mypage=false){
 for(const f of Object.values(forms))f.hidden=true;
 $('.member-tabs').hidden=true;done.hidden=false;$('.member-dialog').classList.remove('tall');
 done.querySelector('h3').textContent=title;done.querySelector('p').textContent=text;
 const link=done.querySelector('[data-mypage]');link.hidden=!mypage;link.textContent='마이페이지';link.href=new URL('mypage/index.html',siteRoot);
 done.querySelector('.today-skip').hidden=true;
 (mypage?done.querySelector('[data-mypage]'):done.querySelector('button')).focus();
}

// ---------- 주소 검색: 카카오(다음) 우편번호 서비스 (API 키 없이 무료) ----------
// 폴더에서 파일을 바로 열어도 되도록 주소는 https:// 로 적는다 ('//'로 시작하면 file:// 에서 못 불러옴)
const POSTCODE_URL='https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
let postcodeLoading=null;
function loadPostcode(){
 if(window.daum?.Postcode)return Promise.resolve();
 return postcodeLoading||=new Promise((ok,fail)=>{const s=document.createElement('script');s.src=POSTCODE_URL;s.onload=()=>window.daum?.Postcode?ok():fail();s.onerror=()=>{postcodeLoading=null;fail()};document.head.append(s)});
}
const addrLayer=$('.addr-layer'),addrBox=$('.addr-box'),dialog=$('.member-dialog');
// 우편번호 서비스는 shadow DOM 안에 넣으면 주소를 골라도 결과를 돌려주지 못한다
// (서비스가 만든 전송 폼이 문서에 연결되지 않음). 그래서 검색 화면만 본문(body)에 두고 addr-box 위치에 겹쳐 띄운다.
const kakaoBox=document.createElement('div');kakaoBox.style.cssText='position:fixed;z-index:2147483001;display:none;background:#fff';document.body.append(kakaoBox);
// 폴더에서 파일(file://)로 열면 우편번호 서비스가 고른 주소를 돌려주지 못한다. 이때는 안내를 띄우고 직접 입력하게 한다.
const FILE_MODE=location.protocol==='file:';
function placeKakao(){if(kakaoBox.style.display==='none')return;const r=addrBox.getBoundingClientRect(),note=addrBox.querySelector('.addr-note')?.offsetHeight||0;Object.assign(kakaoBox.style,{left:r.left+'px',top:(r.top+note)+'px',width:r.width+'px',height:(r.height-note)+'px'})}
window.addEventListener('resize',placeKakao);dialog.addEventListener('scroll',placeKakao);dialog.addEventListener('transitionend',placeKakao);
function closeAddr(){addrLayer.hidden=true;addrBox.innerHTML='';kakaoBox.style.display='none';kakaoBox.innerHTML=''}
async function openAddr(){
 const f=forms.join.elements;
 addrLayer.style.top=dialog.scrollTop+'px';addrLayer.style.height=dialog.clientHeight+'px';addrLayer.hidden=false;
 addrBox.innerHTML='<p class="addr-fail">주소 검색을 불러오는 중입니다…</p>';
 try{await loadPostcode()}catch{
  addrBox.innerHTML='<p class="addr-fail">주소 검색을 불러오지 못했습니다.<br>인터넷 연결을 확인하거나, 닫고 주소를 직접 입력해 주세요.</p>';
  f.zip.readOnly=false;f.addr1.readOnly=false;f.addr1.placeholder='기본 주소';return;
 }
 addrBox.innerHTML=FILE_MODE?'<p class="addr-note">파일로 연 화면에서는 주소를 눌러도 자동으로 입력되지 않습니다. 검색으로 주소를 확인한 뒤 닫고 <b>직접 입력</b>해 주세요. (웹에 배포한 사이트에서는 바로 입력됩니다)</p>':'';
 if(FILE_MODE){f.zip.readOnly=false;f.addr1.readOnly=false;f.addr1.placeholder='기본 주소'}
 kakaoBox.innerHTML='';kakaoBox.style.display='block';placeKakao();
 new window.daum.Postcode({width:'100%',height:'100%',
  oncomplete:d=>{
   let addr=d.userSelectedType==='J'?d.jibunAddress:d.roadAddress;
   // 도로명 주소에는 법정동 · 건물명을 괄호로 붙인다 (우편번호 서비스 안내 방식)
   if(d.userSelectedType!=='J'){const extra=[];if(d.bname&&/[동로가]$/.test(d.bname))extra.push(d.bname);if(d.buildingName&&d.apartment==='Y')extra.push(d.buildingName);if(extra.length)addr+=` (${extra.join(', ')})`}
   f.zip.value=d.zonecode;f.addr1.value=addr;f.zip.closest('.field').classList.remove('error');
   closeAddr();f.addr2.focus();
  }}).embed(kakaoBox,{autoClose:false});
}
$('[data-addr]').addEventListener('click',openAddr);
forms.join.elements.zip.addEventListener('click',()=>{if(forms.join.elements.zip.readOnly)openAddr()});
forms.join.elements.addr1.addEventListener('click',()=>{if(forms.join.elements.addr1.readOnly)openAddr()});
$('[data-addr-close]').addEventListener('click',()=>{closeAddr();$('[data-addr]').focus()});
let lastFocus=null;
function open(){
 lastFocus=document.activeElement;host.style.zIndex='2147483000';layer.classList.add('open');document.documentElement.style.overflow='hidden';
 const me=read(SESSION,null);
 if(me){showDone(`${me.name}님, 반갑습니다`,'로그인된 상태입니다. 주문 내역은 마이페이지에서 볼 수 있어요.',true);done.querySelector('button').textContent='로그아웃';done.dataset.mode='logout'}
 else{done.dataset.mode='';done.querySelector('button').textContent='확인';showTab('login')}
}
function close(){closeAddr();loginPw='';layer.classList.remove('open');host.style.zIndex='';document.documentElement.style.overflow='';lastFocus?.focus?.()}
function mark(input,bad){input.closest('.field').classList.toggle('error',bad);return bad}
function setIdMsg(text,ok){
 const field=forms.join.elements.userid.closest('.field'),okEl=field.querySelector('.ok'),bad=field.querySelector('.msg');
 field.classList.toggle('error',!ok);okEl.hidden=!ok;okEl.textContent=ok?text:'';if(!ok)bad.textContent=text;
}
function resetIdCheck(){
 checkedId='';const field=forms.join.elements.userid.closest('.field');
 field.querySelector('.ok').hidden=true;field.querySelector('.msg').textContent='영문 소문자로 시작하는 4~12자(소문자·숫자)로 입력해 주세요.';
 $('[data-check-id]').classList.remove('done');$('[data-check-id]').textContent='중복확인';
}
$('[data-check-id]').addEventListener('click',async e=>{
 const id=forms.join.elements.userid.value.trim().toLowerCase();forms.join.elements.userid.value=id;
 if(!isId(id)){checkedId='';setIdMsg('영문 소문자로 시작하는 4~12자(소문자·숫자)로 입력해 주세요.',false);return}
 let taken=RESERVED.includes(id);
 if(!taken){try{taken=await busy(e.currentTarget,()=>DB.isIdTaken(id))}catch(err){checkedId='';setIdMsg(DB.errorText(err),false);return}}
 if(taken){checkedId='';setIdMsg('이미 사용 중인 아이디입니다.',false);return}
 checkedId=id;setIdMsg('사용 가능한 아이디입니다.',true);
 const b=$('[data-check-id]');b.classList.add('done');b.textContent='확인완료';
});
forms.join.elements.userid.addEventListener('input',()=>{if(checkedId)resetIdCheck()});
forms.join.elements.phone.addEventListener('input',e=>{e.target.value=fmtPhone(e.target.value)});

link.addEventListener('click',e=>{e.preventDefault();open()});
$('.member-close').addEventListener('click',close);
layer.addEventListener('click',e=>{if(e.target===layer)close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&layer.classList.contains('open'))close()});
layer.querySelectorAll('[data-tab],[data-go]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab||b.dataset.go)));
layer.querySelectorAll('input').forEach(i=>i.addEventListener('input',()=>i.closest('.field')?.classList.remove('error')));
// 약관에 동의하면 빨간 안내를 바로 지운다
forms.join.elements.agree.addEventListener('change',e=>{if(e.target.checked){forms.join.querySelector('.agree').classList.remove('error');forms.join.querySelector('.member-form-msg').textContent=''}});
done.querySelector('button').addEventListener('click',()=>{
 const mode=done.dataset.mode;done.dataset.mode='';done.querySelector('button').textContent='확인';
 if(mode==='logout'){DB.logout().catch(()=>{});showTab('login');return}
 if(mode==='to-login'){showTab('login');return}
 close();
});

forms.login.addEventListener('submit',async e=>{
 e.preventDefault();const f=forms.login,msg=f.querySelector('.member-form-msg');
 const el=f.elements,id=el.userid.value.trim().toLowerCase(),pw=el.password.value;
 const bad=[mark(el.userid,!id),mark(el.password,!pw)].some(Boolean);
 if(bad){msg.textContent='';return}
 msg.textContent='';
 let user;try{user=await busy(f.querySelector('.member-submit'),()=>DB.login(id,pw))}catch(err){msg.textContent=DB.errorText(err);return}
 // 로그인 직후 찾기 질문을 등록할 때 비밀번호를 다시 묻지 않도록 이 창이 열려 있는 동안만 기억한다
 loginPw=pw;
 f.reset();
 done.dataset.mode='';done.querySelector('button').textContent='확인';
 showDone(`${user.name}님, 반갑습니다`,'로그인되었습니다.',true);
 // 찾기 기능이 생기기 전에 가입한 회원에게: 찾기 질문 등록 안내 (오늘 다시 보지 않기)
 if(!skippedToday()&&await DB.needsFindSetup().catch(()=>false))showFindNotice(user);
});
const SKIP_KEY='sangsang-find-notice-skip';
const today=()=>new Date().toISOString().slice(0,10);
const skippedToday=()=>{try{return localStorage.getItem(SKIP_KEY)===today()}catch{return false}};
function showFindNotice(user){
 showDone('아이디 · 비밀번호 찾기 기능이 추가되었습니다',`${user.name}님, 찾기 질문을 등록해 주세요. 등록하면 질문으로 아이디 · 비밀번호를 찾을 수 있습니다. 기존에 등록한 메일로도 찾기가 가능합니다.`,true);
 const link=done.querySelector('[data-mypage]');link.textContent='찾기 질문 등록하기';link.href='#find-setup';
 done.querySelector('button').textContent='나중에 할게요';done.dataset.mode='notice';
 const skip=done.querySelector('.today-skip');skip.hidden=false;skip.querySelector('input').checked=false;
}
let loginPw='';
// 안내를 닫거나 등록하러 갈 때 '오늘 다시 보지 않기'를 저장하고, '찾기 질문 등록하기'는 이 팝업 안에서 등록 칸을 연다
done.addEventListener('click',e=>{
 if(done.dataset.mode!=='notice'||!e.target.closest('[data-mypage],[data-done]'))return;
 if(done.querySelector('[data-skip-today]').checked)try{localStorage.setItem(SKIP_KEY,today())}catch{}
 if(e.target.closest('[data-mypage]')){e.preventDefault();e.stopPropagation();showFindSetup()}
},true);
function showFindSetup(){
 const f=forms.findsetup,legacy=DB.isLegacy(),me=read(SESSION,null);
 let email='';try{email=JSON.parse(localStorage.getItem('sangsang-members-v2'))?.[me?.id]?.email||''}catch{}
 for(const x of Object.values(forms))x.hidden=x!==f;
 done.hidden=true;$('.member-tabs').hidden=true;dialog.classList.add('tall');
 f.reset();f.querySelectorAll('.error').forEach(x=>x.classList.remove('error'));f.querySelector('.member-form-msg').textContent='';
 f.querySelector('[data-setup-mail]').hidden=!legacy;f.elements.email.value=email;
 f.elements.question.focus();
}
forms.findsetup.addEventListener('submit',async e=>{
 e.preventDefault();const f=forms.findsetup,el=f.elements,msg=f.querySelector('.member-form-msg');
 const legacy=!f.querySelector('[data-setup-mail]').hidden,answer=el.answer.value.trim(),email=el.email.value.trim();
 if([mark(el.answer,!answer),legacy&&mark(el.email,!isEmail(email))].some(Boolean)){msg.textContent='';return}
 if(!loginPw){msg.textContent='다시 로그인한 뒤 등록해 주세요.';return}
 let r;try{r=await busy(f.querySelector('.member-submit'),()=>DB.setupFind({password:loginPw,question:el.question.value,answer,email}))}catch(err){msg.textContent=DB.errorText(err);return}
 loginPw='';
 showDone('찾기 질문을 등록했습니다',r.legacy&&r.mailSent?`이제 질문으로 아이디 · 비밀번호를 찾을 수 있습니다. ${email}(으)로 인증 메일을 보냈습니다. 메일의 링크를 누르면 메일로도 비밀번호를 찾을 수 있습니다. (스팸함도 확인해 주세요)`:'이제 질문으로 아이디 · 비밀번호를 찾을 수 있습니다.',true);
 done.dataset.mode='';done.querySelector('[data-done]').textContent='확인';
});
forms.findsetup.querySelector('[data-setup-later]').addEventListener('click',()=>{loginPw='';close()});
forms.join.addEventListener('submit',async e=>{
 e.preventDefault();const f=forms.join,msg=f.querySelector('.member-form-msg');
 const el=f.elements;
 const id=el.userid.value.trim().toLowerCase(),pw=el.password.value,pw2=el.password2.value,name=el.name.value.trim(),phone=el.phone.value.trim(),email=el.email.value.trim();
 const agreeBad=!el.agree.checked;f.querySelector('.agree').classList.toggle('error',agreeBad);
 const idBad=!isId(id)||checkedId!==id;
 if(!isId(id))setIdMsg('영문 소문자로 시작하는 4~12자(소문자·숫자)로 입력해 주세요.',false);
 else if(checkedId!==id)setIdMsg('아이디 중복확인을 해 주세요.',false);
 const address={zip:el.zip.value.trim(),addr1:el.addr1.value.trim(),addr2:el.addr2.value.trim()};
 const question=el.question.value,answer=el.answer.value.trim();
 const bad=[idBad,mark(el.password,!isPw(pw)),mark(el.password2,!pw2||pw!==pw2),mark(el.name,!name),mark(el.phone,!isPhone(phone)),mark(el.email,!isEmail(email)),mark(el.answer,!answer),mark(el.zip,false),agreeBad].some(Boolean);
 if(bad){msg.textContent=agreeBad?'필수 약관에 동의해 주세요.':'';return}
 msg.textContent='';
 try{await busy(f.querySelector('.member-submit'),()=>DB.signup({id,password:pw,name,phone,email,address,question,answer}))}
 catch(err){const t=DB.errorText(err);if(/^이미 사용 중인 아이디/.test(t)){resetIdCheck();setIdMsg(t,false)}else msg.textContent=t;return}
 f.reset();resetIdCheck();
 showDone(`${name}님, 가입을 환영합니다`,`${email}(으)로 인증 메일을 보냈습니다. 메일의 링크를 눌러 이메일 인증을 마쳐 주세요. (메일이 안 보이면 스팸함도 확인해 주세요)`);
 done.dataset.mode='to-login';done.querySelector('button').textContent='로그인하러 가기';
});
// 찾기 방법 고르기 (이메일 / 질문)
layer.querySelectorAll('[data-method]').forEach(b=>b.addEventListener('click',()=>{
 const f=b.closest('form');f.dataset.method=b.dataset.method;
 f.querySelectorAll('[data-method]').forEach(x=>x.setAttribute('aria-checked',String(x===b)));
 f.querySelectorAll('.error').forEach(x=>x.classList.remove('error'));f.querySelector('.member-form-msg').textContent='';
}));
// 아이디 찾기: 이메일 인증(확인 링크) 또는 가입 이메일 + 질문 + 답
forms.findid.addEventListener('submit',async e=>{
 e.preventDefault();const f=forms.findid,el=f.elements,msg=f.querySelector('.member-form-msg');
 const email=el.email.value.trim(),answer=el.answer.value.trim(),byQ=f.dataset.method==='q';
 if([mark(el.email,!isEmail(email)),byQ&&mark(el.answer,!answer)].some(Boolean)){msg.textContent='';return}
 if(!byQ){
  try{await busy(f.querySelector('.member-submit'),()=>DB.sendFindIdLink(email))}catch(err){msg.textContent=DB.errorText(err);return}
  f.reset();showDone('확인 메일을 보냈습니다',`${email}(으)로 확인 링크를 보냈습니다. 이 브라우저에서 메일의 링크를 누르면 아이디가 보입니다. (가입한 이메일이 아니면 메일이 와도 아이디가 나오지 않습니다 · 스팸함도 확인해 주세요)`);
  done.dataset.mode='';return;
 }
 let id;try{id=await busy(f.querySelector('.member-submit'),()=>DB.findId(email,el.question.value,answer))}catch(err){msg.textContent=DB.errorText(err);return}
 if(!id){msg.textContent='입력하신 정보와 맞는 회원이 없습니다. 이메일 · 질문 · 답을 다시 확인해 주세요.';return}
 f.reset();showDone('아이디를 찾았습니다',`회원님의 아이디는 「${id}」입니다.`);
 done.dataset.mode='to-login';done.querySelector('button').textContent='로그인하러 가기';
});
// 비밀번호 찾기: 아이디 + 질문 + 답 → 가입 이메일로 재설정 메일
forms.findpw.addEventListener('submit',async e=>{
 e.preventDefault();const f=forms.findpw,el=f.elements,msg=f.querySelector('.member-form-msg');
 const id=el.userid.value.trim().toLowerCase(),answer=el.answer.value.trim(),email=el.email.value.trim(),byQ=f.dataset.method==='q';
 if([mark(el.userid,!id),byQ?mark(el.answer,!answer):mark(el.email,!isEmail(email))].some(Boolean)){msg.textContent='';return}
 let sent;try{sent=await busy(f.querySelector('.member-submit'),()=>byQ?DB.resetPassword(id,el.question.value,answer):DB.resetByEmail(id,email))}catch(err){msg.textContent=DB.errorText(err);return}
 if(!sent){msg.textContent='입력하신 정보와 맞는 회원이 없습니다. (2026년 10월 31일 이전 가입 회원은 관리자에게 문의해 주세요)';return}
 f.reset();showDone('재설정 메일을 보냈습니다',`${sent}(으)로 비밀번호 재설정 링크를 보냈습니다. 메일의 링크에서 새 비밀번호를 정한 뒤 로그인해 주세요. (스팸함도 확인해 주세요)`);
 done.dataset.mode='to-login';done.querySelector('button').textContent='로그인하러 가기';
});
// 아이디 찾기 메일의 링크로 돌아왔을 때 결과를 보여 준다 (member-db.js가 남긴 결과)
function showFindResult(){
 let r=null;try{r=JSON.parse(sessionStorage.getItem('sangsang-find-result'));sessionStorage.removeItem('sangsang-find-result')}catch{}
 if(!r)return;
 open();
 showDone(r.ok?'아이디를 찾았습니다':'아이디를 찾지 못했습니다',r.ok?`회원님의 아이디는 「${r.id}」입니다.`:r.text);
 done.dataset.mode='to-login';done.querySelector('button').textContent='로그인하러 가기';
}
window.addEventListener('sangsang-find-result',showFindResult);showFindResult();
})();
