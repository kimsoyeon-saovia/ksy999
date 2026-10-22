// CART 메뉴 + 장바구니 창
// 장바구니 내용 = CONTACT 개인 견적에서 '담기'로 확정한 영상 목록(견적서와 같은 저장값)을 그대로 쓴다.
(()=>{
const siteRoot=new URL('.',document.currentScript.src);
const host=document.querySelector('sangsang-header');if(!host||!host.shadowRoot)return;
const shadow=host.shadowRoot;const nav=shadow.querySelector('nav');if(!nav||shadow.querySelector('[data-cart]'))return;
const DRAFT='sangsang-studio-draft-v1',SESSION='sangsang-member-session';
const PERSONAL_URL=new URL('contact/index.html',siteRoot);
const CART_URL=new URL('cart/index.html',siteRoot),CHECKOUT_URL=new URL('cart/checkout.html',siteRoot);
const money=n=>n.toLocaleString('ko-KR')+'원';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// 가격표: CONTACT 페이지가 아니면 견적 설정 파일을 직접 불러온다
let config=window.INQUIRY_CONFIG||null;
if(!config){const s=document.createElement('script');s.src=new URL('contact/inquiry-config.js',siteRoot);s.onload=()=>{config=window.INQUIRY_CONFIG;refresh()};document.head.append(s)}
const unitPrice=item=>{if(!config)return 0;const q=config.qualities.find(x=>x.id===item.quality),d=config.durations.find(x=>x.id===item.duration);return ((q?.points||0)+(d?.points||0))*config.pointValue};
const labelOf=item=>{if(!config)return '';return [config.qualities.find(x=>x.id===item.quality)?.name,config.durations.find(x=>x.id===item.duration)?.name].filter(Boolean).join(' · ')};
const qty=item=>Math.max(1,Math.min(999,Math.trunc(Number(item.quantity))||1));

const readDraft=()=>{try{return JSON.parse(localStorage.getItem(DRAFT)||'{}')||{}}catch{return {}}};
const items=()=>{const p=readDraft().personal;return Array.isArray(p?.items)?p.items:[]};
function writeItems(list){try{const d=readDraft();d.personal={...(d.personal||{}),items:list};localStorage.setItem(DRAFT,JSON.stringify(d))}catch{}}
// CONTACT 페이지에서는 견적서 화면이 같은 목록을 메모리에 들고 있으므로, 견적서의 버튼을 대신 눌러 함께 바뀌게 한다
const inquiry=()=>document.body.dataset.sitePage==='contact'?document.querySelector('#inquiry'):null;
const quoteButton=sel=>inquiry()?.querySelector(sel);
// 휴대폰에서는 접힌 견적서를 처음 누르면 펼치기만 하고(site-enhancements.js) 잠긴(inert) 부분도 있으므로,
// 잠깐 '펼친 상태'로 두고 눌러서 견적서 버튼이 그대로 동작하게 한다
function press(btn){
 const body=document.body,wasOpen=body.classList.contains('quote-open'),locked=[];
 for(let el=btn;el;el=el.parentElement)if(el.inert){locked.push(el);el.inert=false}
 body.classList.add('quote-open');btn.click();if(!wasOpen)body.classList.remove('quote-open');
 locked.forEach(el=>{el.inert=true});
}

const style=document.createElement('style');
style.textContent=`
nav a[data-cart]{position:relative;gap:6px}
.cart-count{display:inline-flex;align-items:center;justify-content:center;min-width:19px;height:19px;padding:0 5px;border-radius:10px;background:#080808;color:#fff;font:700 11px Arial,sans-serif;line-height:1}
.cart-count[hidden]{display:none}
nav a[data-cart].bump .cart-count{animation:cart-bump .45s}
@keyframes cart-bump{40%{transform:scale(1.45);background:#1647ff}}
.cart-layer{position:fixed;inset:0;z-index:11;background:rgba(8,8,8,.5);opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s;font-family:UnifiedSeoul,Arial,sans-serif}
.cart-layer.open{opacity:1;visibility:visible}
.cart-panel{position:absolute;top:0;right:0;display:flex;flex-direction:column;width:min(420px,100%);height:100%;background:#fff;transform:translateX(100%);transition:transform .32s cubic-bezier(.2,.8,.2,1)}
.cart-layer.open .cart-panel{transform:none}
.cart-head{display:flex;align-items:center;justify-content:space-between;padding:26px 24px 18px;border-bottom:2px solid #080808}
.cart-head h2{margin:0;font-size:24px;font-weight:800}.cart-head h2 small{margin-left:8px;font-size:15px;font-weight:400;color:#777}
.cart-head p{margin:4px 0 0;font-size:13px;color:#777}
.cart-x{width:40px;height:40px;border:0;background:none;font-size:26px;cursor:pointer;color:#080808}.cart-x:hover{background:#e0ff4f}
.cart-list{flex:1;overflow:auto;padding:8px 24px}
.cart-item{padding:18px 0;border-bottom:1px solid #e5e5e5}
.cart-item-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.cart-item h3{margin:0 0 4px;font-size:17px;font-weight:800}.cart-item p{margin:0;font-size:14px;color:#555}
.cart-del{border:0;background:none;padding:2px 0;font:400 13px UnifiedSeoul,Arial,sans-serif;color:#888;text-decoration:underline;cursor:pointer}.cart-del:hover{color:#e5402f}
.cart-item-bottom{display:flex;justify-content:space-between;align-items:center;margin-top:14px}
.cart-step{display:inline-flex;border:1px solid #080808}
.cart-step button{width:34px;height:32px;border:0;background:#fff;font-size:18px;cursor:pointer;color:#080808}.cart-step button:hover:not(:disabled){background:#e0ff4f}.cart-step button:disabled{color:#ccc;cursor:default}
.cart-step output{display:inline-flex;align-items:center;justify-content:center;min-width:40px;border-left:1px solid #080808;border-right:1px solid #080808;font-size:15px}
.cart-item strong{font-size:18px;font-weight:800}
.cart-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px;text-align:center;color:#555}
.cart-empty svg{width:56px;height:56px;stroke:#bbb;margin-bottom:6px}.cart-empty h3{margin:0;font-size:19px;color:#080808}.cart-empty p{margin:0 0 18px;font-size:14px}
.cart-foot{padding:20px 24px 26px;border-top:1px solid #e5e5e5;background:#fafafa}
.cart-total{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px}.cart-total span{font-size:15px}.cart-total strong{font-size:28px;font-weight:800}
.cart-vat{margin:0 0 16px;font-size:12px;color:#888;text-align:right}
.cart-go{display:flex;align-items:center;justify-content:space-between;width:100%;height:56px;padding:0 20px;border:0;background:#e0ff4f;color:#080808;font:500 17px UnifiedSeoul,Arial,sans-serif;cursor:pointer;text-decoration:none;transition:background .2s,color .2s}
.cart-go:hover{background:#080808;color:#fff}.cart-go::after{content:"→";font-size:21px}
.cart-more{display:block;width:100%;margin-top:10px;padding:12px 0;border:1px solid #080808;background:#fff;font:400 15px UnifiedSeoul,Arial,sans-serif;color:#080808;text-align:center;cursor:pointer;text-decoration:none}.cart-more:hover{background:#080808;color:#fff}
.cart-note{margin:12px 0 0;font-size:12px;color:#888;text-align:center}.cart-note a{color:#555;text-decoration:underline;text-underline-offset:2px}.cart-note a:hover{color:#080808}
.cart-toast{position:fixed;left:50%;bottom:32px;z-index:12;display:flex;align-items:center;gap:14px;padding:14px 16px 14px 22px;background:#080808;color:#fff;font:400 15px UnifiedSeoul,Arial,sans-serif;transform:translate(-50%,20px);opacity:0;visibility:hidden;transition:.25s}
.cart-toast.show{transform:translate(-50%,0);opacity:1;visibility:visible}
.cart-toast button{border:0;background:#e0ff4f;padding:8px 12px;font:500 14px UnifiedSeoul,Arial,sans-serif;cursor:pointer}
@media(max-width:520px){nav a{font-size:10.5px;padding:9px 3px}nav a[data-cart]{gap:3px}.cart-count{min-width:15px;height:15px;font-size:9px;padding:0 3px}.cart-toast{bottom:96px;width:max-content;max-width:92vw}}
`;
shadow.append(style);

const link=document.createElement('a');link.href=CART_URL;link.dataset.cart='';link.setAttribute('aria-haspopup','dialog');
link.innerHTML='CART<span class="cart-count" hidden>0</span>';
nav.append(link);

const layer=document.createElement('div');layer.className='cart-layer';
layer.innerHTML=`<aside class="cart-panel" role="dialog" aria-modal="true" aria-label="장바구니"><div class="cart-head"><div><h2>장바구니<small></small></h2><p></p></div><button class="cart-x" type="button" aria-label="닫기">×</button></div><div class="cart-list"></div><div class="cart-foot"></div></aside>`;
shadow.append(layer);
const toast=document.createElement('div');toast.className='cart-toast';toast.setAttribute('role','status');
toast.innerHTML='<span>장바구니에 담았습니다</span><button type="button">보기</button>';
shadow.append(toast);

const $=s=>layer.querySelector(s);
const onCorporate=()=>!!inquiry()&&!quoteButton('[data-add-video],[data-remove-video]')&&/corporate/.test(location.pathname+location.hash);
let lastCount=-1;
function refresh(){
 const list=items(),count=list.reduce((n,i)=>n+qty(i),0);
 const badge=link.querySelector('.cart-count');badge.hidden=!count;badge.textContent=count>99?'99+':count;
 link.setAttribute('aria-label',`장바구니 ${count}개`);
 if(lastCount>=0&&count>lastCount){link.classList.remove('bump');void link.offsetWidth;link.classList.add('bump')}
 lastCount=count;
 if(layer.classList.contains('open'))paint(list);
 return count;
}
function paint(list=items()){
 let me=null;try{me=JSON.parse(localStorage.getItem(SESSION))}catch{}
 $('.cart-head small').textContent=list.length?`${list.length}건`:'';
 $('.cart-head p').textContent=me?.name?`${me.name}님이 담은 영상`:'개인 맞춤 영상 견적';
 const editable=!onCorporate();
 if(!list.length){
  $('.cart-list').innerHTML=`<div class="cart-empty"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2"/><circle cx="9.5" cy="19" r="1.3"/><circle cx="17" cy="19" r="1.3"/></svg><h3>장바구니가 비어 있습니다</h3><p>화질과 길이를 골라 영상을 담아 보세요.</p><a class="cart-go" href="${PERSONAL_URL}" data-to-estimate style="width:auto;min-width:220px">견적 내러 가기</a></div>`;
  $('.cart-foot').hidden=true;return;
 }
 $('.cart-foot').hidden=false;
 $('.cart-list').innerHTML=list.map((item,i)=>{const n=qty(item),unit=unitPrice(item);return `<article class="cart-item"><div class="cart-item-top"><div><h3>개인 맞춤 영상 ${i+1}</h3><p>${esc(labelOf(item))} · 개당 ${money(unit)}</p></div>${editable?`<button type="button" class="cart-del" data-del="${esc(item.id)}">삭제</button>`:''}</div><div class="cart-item-bottom">${editable?`<div class="cart-step" role="group" aria-label="영상 ${i+1} 수량"><button type="button" data-step="-1" data-id="${esc(item.id)}" aria-label="수량 줄이기" ${n<=1?'disabled':''}>−</button><output>${n}</output><button type="button" data-step="1" data-id="${esc(item.id)}" aria-label="수량 늘리기" ${n>=999?'disabled':''}>+</button></div>`:`<p>수량 ${n}개</p>`}<strong>${money(unit*n)}</strong></div></article>`}).join('');
 const total=list.reduce((s,i)=>s+unitPrice(i)*qty(i),0);
 $('.cart-foot').innerHTML=`<div class="cart-total"><span>예상 합계</span><strong>${money(total)}</strong></div><p class="cart-vat">VAT 별도 · 상담 후 최종 확정</p><a class="cart-go" href="${CHECKOUT_URL}" data-order>주문하기</a><a class="cart-more" href="${CART_URL}">장바구니 전체 보기</a><p class="cart-note"><a href="${PERSONAL_URL}" data-to-estimate>영상 더 담기</a> · <a href="${PERSONAL_URL}#inquiry-form" data-checkout>결제 전에 상담 먼저 받기</a></p>${editable?'':'<p class="cart-note">수량 변경은 개인 견적 페이지에서 할 수 있습니다.</p>'}`;
}
let lastFocus=null;
// 견적서 하단 시트 등 페이지 요소보다 위에 보이도록 열려 있는 동안 헤더를 맨 위로 올린다
function open(){lastFocus=document.activeElement;paint();host.style.zIndex='2147483000';layer.classList.add('open');document.documentElement.style.overflow='hidden';$('.cart-x').focus()}
function close(){layer.classList.remove('open');host.style.zIndex='';document.documentElement.style.overflow='';lastFocus?.focus?.()}
const onPersonal=()=>!!quoteButton('[data-add-video]')||!!quoteButton('[data-remove-video]')||(!!inquiry()&&!onCorporate());

// PC·휴대폰 모두 장바구니 전체 페이지로 바로 간다
const onCartPage=document.body.dataset.sitePage==='cart';
if(onCartPage)link.setAttribute('aria-current','page');
function showCart(){if(onCartPage){scrollTo({top:0,behavior:'smooth'});return}location.href=CART_URL}
link.addEventListener('click',e=>{e.preventDefault();showCart()});
$('.cart-x').addEventListener('click',close);
layer.addEventListener('click',e=>{
 if(e.target===layer){close();return}
 const b=e.target.closest('button,a');if(!b)return;
 if(b.dataset.del!==undefined){
  const viaQuote=quoteButton(`[data-remove-video="${CSS.escape(b.dataset.del)}"]`);
  if(viaQuote)press(viaQuote);else writeItems(items().filter(i=>i.id!==b.dataset.del));
  setTimeout(()=>{refresh();paint()},0);return;
 }
 if(b.dataset.step){
  const id=b.dataset.id,step=Number(b.dataset.step);
  const viaQuote=quoteButton(`[data-video-step="${step}"][data-id="${CSS.escape(id)}"]`);
  if(viaQuote)press(viaQuote);else writeItems(items().map(i=>i.id===id?{...i,quantity:Math.max(1,Math.min(999,qty(i)+step))}:i));
  setTimeout(()=>{refresh();paint()},0);return;
 }
 if(b.hasAttribute('data-checkout')||b.hasAttribute('data-to-estimate')){
  if(onPersonal()){e.preventDefault();close();const target=b.hasAttribute('data-checkout')?inquiry().querySelector('#inquiry-form'):inquiry().querySelector('[data-choice="quality"]');target?.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>target?.querySelector?.('input')?.focus({preventScroll:true}),500);return}
  e.preventDefault();location.href=PERSONAL_URL+(b.hasAttribute('data-checkout')?'#inquiry-form':'');
 }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&layer.classList.contains('open'))close()});
toast.querySelector('button').addEventListener('click',()=>{toast.classList.remove('show');showCart()});
// 서랍의 '주문하기'는 담긴 영상 전체를 주문한다(장바구니 페이지에서 고른 선택은 지운다)
layer.addEventListener('click',e=>{if(e.target.closest('[data-order]'))try{sessionStorage.removeItem('sangsang-checkout-ids')}catch{}},true);
window.addEventListener('sangsang-cart-change',refresh);

// 견적서의 '담기'·수량·삭제 버튼이 눌린 뒤(견적서가 저장한 다음) 숫자를 다시 센다
let toastTimer=0;
document.addEventListener('click',e=>{
 if(!inquiry())return;
 const added=!!e.target.closest?.('[data-add-video]');
 setTimeout(()=>{const before=lastCount,now=refresh();if(added&&now>before){toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2600)}},0);
});
window.addEventListener('storage',e=>{if(e.key===DRAFT||e.key===SESSION)refresh()});
window.addEventListener('pageshow',refresh);
refresh();
// 장바구니의 '상담 신청하기'로 넘어온 경우 견적서 입력 칸으로 이동
if(location.hash==='#inquiry-form'&&inquiry())setTimeout(()=>inquiry().querySelector('#inquiry-form')?.scrollIntoView({behavior:'smooth',block:'center'}),600);
})();
