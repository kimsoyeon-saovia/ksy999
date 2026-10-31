(() => {
const C=window.INQUIRY_CONFIG,P=window.InquiryPricing;
const money=n=>window.INQUIRY_CONFIG.comma(n)+'원';
// 상품 이름 · 가격의 단위 글자(p · 초 · 분 · 원 · 만원)는 숫자보다 작게(70%) 보이도록 감싼다
const unitHTML=s=>String(s).replace(/(\d)(만 ?원|원|초|분|p)/g,'$1<span class="u">$2</span>');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inquiryRevisions={personal:0,corporate:0};
const states={personal:{quality:null,duration:null,items:[],nextVideoId:0,notice:'',plans:{},fields:{},faq:[],errors:{},submitting:false},corporate:{product:null,extras:[],fields:{},faq:[],errors:{},submitting:false}};
const DRAFT_STORAGE_KEY='sangsang-studio-draft-v1',INQUIRY_STORAGE_KEY='sangsang-studio-inquiries-v1';
const clone=value=>JSON.parse(JSON.stringify(value));
// 장바구니는 견적서와 따로 저장한다. 견적서에서 '담기'한 영상은 담은 시각과 함께 장바구니에 한 줄씩 더해지고,
// 이번 방문 중 견적서에서 바꾼 수량 · 삭제는 그 줄에만 반영된다. 장바구니 내용이 견적서로 다시 불려 오지는 않는다.
const CART_STORAGE_KEY='sangsang-cart-v1',cartLinks=new Set();
// 이 페이지에 들어온 시각: 이번 방문에 담은 상품은 장바구니에서 한 묶음(같은 시각)으로 보인다
const CART_BATCH=new Date().toISOString();
function syncCart(){try{
 const cart=JSON.parse(localStorage.getItem(CART_STORAGE_KEY)||'{}')||{};
 let list=Array.isArray(cart.items)?cart.items:[],next=Number(cart.nextId)||list.reduce((n,c)=>Math.max(n,Number(c.id)||0),0);
 const before=JSON.stringify(list),alive=new Set();
 for(const item of states.personal.items){
  const quantity=P.videoQuantity(item);
  if(!item.cartId){item.cartId=String(++next);cartLinks.add(item.cartId);list.push({id:item.cartId,...(item.plan?{plan:item.plan}:{quality:item.quality,duration:item.duration}),quantity,addedAt:new Date().toISOString(),batch:CART_BATCH});}
  else list=list.map(c=>c.id===item.cartId?{...c,quantity}:c);
  alive.add(item.cartId);
 }
 list=list.filter(c=>!cartLinks.has(c.id)||alive.has(c.id));
 cartLinks.forEach(id=>{if(!alive.has(id))cartLinks.delete(id);});
 if(JSON.stringify(list)!==before){localStorage.setItem(CART_STORAGE_KEY,JSON.stringify({items:list,nextId:next}));window.dispatchEvent(new Event('sangsang-cart-change'));}
}catch{}}
function saveDrafts(){syncCart();try{const draft=clone(states);Object.values(draft).forEach(state=>{state.errors={};state.notice='';state.submitting=false;});localStorage.setItem(DRAFT_STORAGE_KEY,JSON.stringify(draft));}catch{}}
function restoreDrafts(){try{const draft=JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY)||'{}');['personal','corporate'].forEach(type=>{const saved=draft?.[type];if(saved&&typeof saved==='object')Object.assign(states[type],saved,{errors:{},notice:'',submitting:false});if(type==='personal')Object.assign(states.personal,{quality:null,duration:null,plans:{},items:[],nextVideoId:0});});}catch{}}
// 로그인한 회원이 신청하면 회원 아이디를 함께 남겨 마이페이지 · 관리자 화면의 상담 신청 내역에 보이게 한다 (member-db.js가 계정에도 저장)
function archiveInquiry(type){try{const state=clone(states[type]);state.errors={};state.notice='';state.submitting=false;let memberId=null;try{memberId=JSON.parse(localStorage.getItem('sangsang-member-session'))?.id||null}catch{}
const items=type==='personal'?(state.items||[]).map(i=>{const p=C.planOf(i);return {quality:p?'포인트 충전':C.qualities.find(x=>x.id===i.quality)?.name,duration:p?p.name:C.durations.find(x=>x.id===i.duration)?.name,quantity:P.videoQuantity(i)}}):[];
const record={savedAt:new Date().toISOString(),type,memberId,fields:state.fields,items,selection:state,estimate:type==='personal'?P.personal(state,C):P.corporate(state,C)};const saved=JSON.parse(localStorage.getItem(INQUIRY_STORAGE_KEY)||'[]');const records=Array.isArray(saved)?saved:[];records.push(record);localStorage.setItem(INQUIRY_STORAGE_KEY,JSON.stringify(records));}catch{}}
const pageFromURL=()=>location.hash==='#corporate'?'corporate':location.hash==='#personal'?'personal':location.pathname.endsWith('corporate.html')?'corporate':'personal';
let page=pageFromURL(),audienceSelection=null,returnFocus;
const root=document.querySelector('#inquiry'),dialog=document.querySelector('#modal');
const quoteSpring={element:null,position:0,velocity:0,lastY:scrollY,lastTime:0,frame:0};
let activePreview=null;
const S=()=>states[page];
const selected=(yes)=>yes?' chosen':'';
const faqs={personal:[
 ['연락처를 꼭 입력해야 하나요?','상담 안내를 드릴 수 있도록 연락처를 입력해 주세요. 원하시는 영상 화질과 길이를 먼저 선택한 뒤 상담을 신청해 주세요.'],
 ['제작 금액은 어떻게 계산되나요?','선택한 화질과 영상 길이의 요금을 합산해 예상 제작비를 안내합니다. 최종 제작 범위와 금액은 상담 후 확인합니다.'],
 ['사진이나 참고 영상을 보내도 되나요?','네. 본인이 이용 권한을 가진 사진이나 참고 자료를 상담 채널로 전달해 주세요. 자료의 활용 가능 여부는 제작 전 확인합니다.'],
 ['수정은 가능한가요?','제작 범위에 따른 수정 가능 항목과 횟수는 상담 시 협의합니다. 기획 변경이나 추가 제작은 별도 비용이 발생할 수 있습니다.'],
 ['제작 기간은 얼마나 걸리나요?','영상 길이, 자료 준비와 제작 범위에 따라 달라집니다. 상담을 통해 제작 일정과 납품일을 확인해 주세요.']
],corporate:[
 ['영상 제작 기간은 얼마나 걸리나요?','기획, 영상 길이와 제작 범위에 따라 달라집니다. 프로젝트 내용을 확인한 후 제작 일정과 납품일을 안내합니다. 긴급 납품 가능 여부도 상담 후 확정됩니다.'],
 ['아이디어만 있어도 제작을 의뢰할 수 있나요?','네. 전달하고 싶은 메시지와 사용 목적을 알려 주세요. 기획 방향과 필요한 자료부터 함께 정리합니다.'],
 ['견적 금액은 어떻게 결정되나요?','제작 상품의 시작 가격과 추가 옵션을 합산한 예상 금액입니다. 세부 제작 범위와 일정에 따라 상담 후 최종 확정하며 부가세(10%)가 포함된 금액입니다.'],
 ['영상 수정은 가능한가요?','수정 범위와 횟수는 제작 전 협의합니다. 큰 기획 변경이나 추가 제작에는 별도 비용이 발생할 수 있습니다.'],
 ['완성된 영상은 어떤 형식으로 받나요?','사용 채널과 목적에 맞는 해상도, 비율 및 파일 형식을 상담 시 협의해 전달합니다.'],
 ['제작한 영상을 광고나 SNS에 사용할 수 있나요?','예정된 광고와 SNS 사용 채널을 알려 주세요. 소재의 권리와 이용 조건을 확인하고 사용 범위를 제작 전에 협의합니다.']
]};
function step(n,title,sub=''){return `<div class="step${sub?' has-sub':''}"><span class="number">${n}</span><h3>${title}</h3>${sub?`<small>${sub}</small>`:''}</div>`;}
function quantity(kind,id,count){return `<div class="quantity"><label>수량 <input type="number" min="1" max="999" step="1" value="${count}" data-quantity="${kind}" data-id="${id}" aria-label="${esc(kind==='plan'?C.plans.find(x=>x.id===id).name:'제작 항목')} 수량"></label><button type="button" data-remove="${kind}" data-id="${id}">삭제</button></div>`;}
function personalContent(){const s=S();return `<div class="intro"><h2>영상 예상 제작 견적 확인하기</h2><p>화질과 영상길이를 선택해 주세요.</p></div>
<section class="selection">${step('01','영상 화질 선택')}<div class="choices quality" role="group" aria-label="영상 화질">${C.qualities.map(x=>`<button class="choice${selected(s.quality===x.id)}" data-choice="quality" data-id="${x.id}" aria-pressed="${s.quality===x.id}"><span class="check" aria-hidden="true">${s.quality===x.id?'✓':''}</span><strong>${unitHTML(x.name)}</strong><small>${unitHTML(money(x.points*C.pointValue))}</small><p class="description">${x.description}</p></button>`).join('')}</div></section>
<section class="selection">${step('02','영상 길이 선택')}<div class="choices duration" role="group" aria-label="영상 길이">${C.durations.map(x=>`<button class="choice${selected(s.duration===x.id)}" data-choice="duration" data-id="${x.id}" aria-pressed="${s.duration===x.id}"><span class="check" aria-hidden="true">${s.duration===x.id?'✓':''}</span><strong>${unitHTML(x.name)}</strong><small>${unitHTML(money(x.points*C.pointValue))}</small></button>`).join('')}</div></section>
<section class="selection" id="points">${step('03','포인트 충전','필요한 만큼 충전해 영상 제작에 사용할 수 있습니다.')}<div class="plans" role="group" aria-label="포인트 충전 상품">${C.plans.map(x=>{const on=planInCart(x.id);return `<button type="button" class="plan${on?' chosen':''}" data-plan="${x.id}" aria-pressed="${on}"><span class="plan-check" aria-hidden="true">✓ 견적서에 담음</span><h4>${x.name}</h4><strong>${unitHTML(money(x.price))}</strong><p><span class="plan-base">${C.comma(x.points)}<span class="pt-unit">포인트</span></span> <span class="plan-bonus">+ ${C.comma(x.bonus)}<span class="pt-unit">포인트 추가</span></span></p></button>`}).join('')}</div><p class="point-reference"><strong class="point-member">※ 포인트 충전은 회원가입 후 이용하실 수 있습니다.</strong><br>참고 · 1포인트 = ${C.pointValue}원 · 견적서에 담아 결제하면 회원 계정에 포인트가 들어갑니다</p></section>`;}
// 포인트 충전 상품은 장바구니에 담아 영상과 함께 결제한다 (회원만). 다시 누르면 장바구니에서 뺀다
// 포인트 충전 상품도 영상처럼 견적서에 담는다 (회원만). 다시 누르면 견적서에서 뺀다
const planInCart=id=>states.personal.items.some(i=>i.plan===id);
function togglePlan(id){
 const x=C.plans.find(p=>p.id===id),s=states.personal;if(!x)return;
 if(planInCart(id))s.items=s.items.filter(i=>i.plan!==id);
 else{
  if(!window.SangsangDB?.current()){modal('회원 전용입니다','<p>포인트 충전은 <strong>회원가입 후</strong> 이용하실 수 있습니다.<br>로그인한 뒤 다시 담아 주세요.</p>',[{label:'로그인 · 회원가입',run:()=>document.querySelector('sangsang-header')?.shadowRoot?.querySelector('[data-member]')?.click()},{label:'닫기'}]);return;}
  s.nextVideoId=(s.nextVideoId||0)+1;
  s.items.push({id:String(s.nextVideoId),plan:id,quantity:1});
 }
 s.notice=planInCart(id)?`${x.name} 포인트 충전 상품을 견적서에 담았습니다.`:'';
 renderQuote();repaint();
}
function productMedia(product){return `<button type="button" class="product-media" data-preview="${product.id}" data-preview-name="${product.name}" aria-label="${product.name} 영상 미리보기 재생" aria-describedby="preview-status-${product.id}"><img src="assets/${product.image}" alt="${product.alt}" width="1774" height="887" loading="lazy"><video src="assets/${product.video}" preload="none" muted playsinline aria-hidden="true" tabindex="-1"></video><span class="preview-cue" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13V5a1.5 1.5 0 0 1 3 0v6l1-1a1.7 1.7 0 0 1 2 0l1 1a1.7 1.7 0 0 1 2 0l1 1a1.7 1.7 0 0 1 2 1.7v3.5A4.8 4.8 0 0 1 15.2 22h-2.4a5 5 0 0 1-4-2L4 14a1.5 1.5 0 0 1 2.2-2Z"/><path d="M4 4 2 3M8 1V0M14 4l2-2"/></svg><span class="preview-text">클릭해서 재생</span></span><span class="preview-status" id="preview-status-${product.id}" role="status" aria-live="polite"></span></button>`;}
function productTitle(name){
 let index=0;
 const words=name.split(' ').map(word=>`<span class="product-title-word">${Array.from(word).map(char=>`<span class="product-title-char" style="--letter-delay:${300+index++*90}ms">${esc(char)}</span>`).join('')}</span>`).join(' ');
 return `<h4 aria-label="${esc(name)}"><span aria-hidden="true">${words}</span></h4>`;
}
function corporateContent(){const s=S();return `<div class="intro">${step('01','프로젝트 견적')}<p>원하시는 제작유형과 옵션을 선택해주세요.</p><p class="error" id="product-error" role="status">${esc(s.errors.product||'')}</p></div><section class="products" aria-label="제작 상품">${C.products.map(x=>`<article class="product">${productMedia(x)}<div class="product-copy">${productTitle(x.name)}<p>${x.duration}<br>${x.description}</p><strong>${unitHTML(x.display)}</strong><button class="${s.product===x.id?'black':'primary'}" data-product="${x.id}" aria-pressed="${s.product===x.id}">${s.product===x.id?'선택 완료 ✓':'선택하기 →'}</button></div></article>`).join('')}</section><section class="extras">${step('02','추가 옵션','선택 · 중복 가능')}${C.extras.map(x=>`<label class="extra"><input type="checkbox" data-extra="${x.id}" ${s.extras.includes(x.id)?'checked':''}><div><h4>${x.name}</h4><p>${x.description}</p></div><strong>+ ${x.price/10000}<span class="u">만 원</span></strong></label>`).join('')}</section>`;}
const icons={kakao:'<path d="M24 7C12 7 4 14 4 23c0 6 4 11 10 14l-2 7 10-6c13 0 22-6 22-15S35 7 24 7Z"/><text x="12" y="27" stroke="none" fill="#000" font-size="11">TALK</text>',phone:'<path d="m13 5-6 4c-4 3 0 16 10 25s20 11 23 7l4-6-10-7-5 5c-5-2-12-9-14-14l5-5Z"/>',email:'<rect x="4" y="8" width="40" height="32" rx="1"/><path d="m4 9 20 17L44 9"/>'};
function eventBanner(){return `<section class="review-event" aria-label="리뷰 이벤트 안내"><button type="button" class="review-event-button" data-review-event aria-label="리뷰 작성 시 결제 금액의 10퍼센트를 돌려드리는 리뷰 이벤트 자세히 보기"><svg class="review-event-art" viewBox="0 0 1920 1080" width="1920" height="1080" aria-hidden="true" focusable="false"><defs><clipPath id="review-static-clip"><path clip-rule="evenodd" d="M0 0H1920V1080H0Z M530 180H1885V680H475V610L530 570Z M40 220H515V625H40Z"/></clipPath><clipPath id="review-headline-clip"><path d="M530 180H1885V680H475V610L530 570Z"/></clipPath><clipPath id="review-bubble-clip"><path d="M40 220H515V625H40Z"/></clipPath></defs><image href="assets/review-event.webp" width="1920" height="1080" clip-path="url(#review-static-clip)"/><g class="review-bubble-puff"><g clip-path="url(#review-bubble-clip)"><image href="assets/review-event.webp" width="1920" height="1080"/></g></g><g class="review-headline-bounce"><g clip-path="url(#review-headline-clip)"><image href="assets/review-event.webp" width="1920" height="1080"/></g></g></svg></button></section>`;}
function commonContent(){return `<section class="contact" id="contact"><h2>편하게 물어보세요</h2><p>궁금한 내용을 남겨 주시면 안내해 드립니다</p><div class="contact-links">${[['kakao','카카오톡 상담','채널로 문의하기 ↗'],['phone','전화 문의','평일 10:00 - 19:00'],['email','이메일 문의','메일 보내기 ↗']].map(([id,title,sub])=>`<button data-contact="${id}"><svg viewBox="0 0 48 48" aria-hidden="true">${icons[id]}</svg><strong>${title}</strong><small>${sub}</small></button>`).join('')}</div></section><section class="faq"><h2>자주 묻는 질문</h2>${page==='corporate'?'<p>제작 전 궁금한 내용을 확인해 보세요.</p>':'<p>궁금한 내용을 확인해 보세요.</p>'}${faqs[page].map(([q,a],i)=>`<article class="faq-row${S().faq.includes(i)?' open':''}"><button class="faq-toggle" data-faq="${i}" aria-expanded="${S().faq.includes(i)}" aria-controls="answer-${page}-${i}"><span class="number">${String(i+1).padStart(2,'0')}</span><span class="faq-question">${esc(q)}</span><b aria-hidden="true">${S().faq.includes(i)?'−':'+'}</b></button><div class="faq-answer" id="answer-${page}-${i}" ${!S().faq.includes(i)?'inert':''}><div><p>${a}</p></div></div></article>`).join('')}</section>`;}
function field(name,label,required=false,multi=false,autocomplete='off'){const s=S();return `<label class="field" for="field-${name}">${label}${required?' <em>*</em>':''}${multi?`<textarea id="field-${name}" name="${name}" rows="2"`:`<input id="field-${name}" name="${name}" autocomplete="${autocomplete}" value="${esc(s.fields[name]||'')}"`} ${required?'required':''} aria-invalid="${!!s.errors[name]}" aria-describedby="error-${name}">${multi?esc(s.fields[name]||'')+'</textarea>':''}<span class="error" id="error-${name}">${esc(s.errors[name]||'')}</span></label>`;}
function quoteHTML(){const s=S(),personal=page==='personal',e=personal?P.personal(s,C):P.corporate(s,C);let lines='',subtitle=personal?'개인 맞춤 영상':`${e.product?.name||'제작 상품을 선택해 주세요'}${s.extras.length?' · 추가 옵션 '+s.extras.length+'개':''}`;
if(personal){
 let videoNo=0;
 lines=s.items.map((item,index)=>{const count=P.videoQuantity(item),plan=C.planOf(item),label=plan?'포인트 충전':`영상 ${++videoNo}`;return `<div class="confirmed-video${plan?' confirmed-plan':''}"><div><span class="confirmed-label">${label} · 확정 ✓</span><button type="button" class="remove-video" data-remove-video="${item.id}" aria-label="${label} 삭제">삭제</button></div><p><span>${plan?`${plan.name} · ${C.point(plan.points)} + ${C.point(plan.bonus)}`:`${C.qualities.find(x=>x.id===item.quality).name} · ${C.durations.find(x=>x.id===item.duration).name}`}</span><strong>${money(C.itemPrice(item)*count)}</strong></p><div class="video-quantity"><span>수량</span><div class="video-stepper" data-video-quantity="${item.id}" role="group" aria-label="영상 ${index+1} 수량"><button type="button" data-video-step="-1" data-id="${item.id}" aria-label="영상 ${index+1} 수량 줄이기" ${count===1?'disabled':''}>−</button><output tabindex="-1" aria-label="영상 ${index+1} 수량" aria-live="polite">${count}</output><button type="button" data-video-step="1" data-id="${item.id}" aria-label="영상 ${index+1} 수량 늘리기" ${count===999?'disabled':''}>+</button></div></div></div>`;}).join('');
 // 충전 상품과 영상을 함께 담으면, 충전 포인트로 영상 금액을 바로 차감했을 때의 결제 금액을 안내한다
 {const planSum=s.items.filter(i=>i.plan).reduce((n,i)=>n+C.itemPrice(i)*P.videoQuantity(i),0),gain=s.items.reduce((n,i)=>n+C.itemPoints(i)*P.videoQuantity(i),0),video=s.items.filter(i=>!i.plan).reduce((n,i)=>n+C.itemPrice(i)*P.videoQuantity(i),0);
 if(gain&&video){const cut=Math.min(video,gain*C.pointValue);lines+=`<div class="point-pay"><p><span>충전 포인트로 영상 금액 차감</span><span>−${money(cut)}</span></p><p class="point-pay-total"><span>차감 결제 시 결제 금액</span><strong>${money(planSum+video-cut)}</strong></p><small>남는 포인트 ${C.point(gain-cut/C.pointValue)} · 결제 화면에서 바로 차감됩니다</small></div>`;}}
 if(s.quality||s.duration)lines+=`<p class="video-draft"><span>선택 중 · ${[C.qualities.find(x=>x.id===s.quality)?.name,C.durations.find(x=>x.id===s.duration)?.name].filter(Boolean).join(' · ')}</span><span>${money(e.draft*C.pointValue)}</span></p>`;
 if(s.quality&&s.duration)lines+='<button type="button" class="primary confirm-video" data-add-video>담기 <span aria-hidden="true">→</span></button>';
 if(s.notice)lines+=`<p class="video-notice" role="status">${esc(s.notice)}</p>`;
}else{lines=`<p><span>${e.product?.name||'선택 상품 없음'}</span><span>${e.product?.price===null?'상담 후 안내':money(e.product?.price||0)}</span></p>${C.extras.filter(x=>s.extras.includes(x.id)).map(x=>`<p><span>${x.name}</span><span>${money(x.price)}</span></p>`).join('')}${!e.product&&s.extras.length?'<p>옵션을 미리 선택했습니다. 상품 선택 후 견적을 계산합니다.</p>':''}${e.total===null?`<p>추가 옵션 ${money(e.extra)} · 기본 제작비 별도 상담</p>`:''}`;}
return `<p class="eyebrow">• LIVE ESTIMATE</p><h2>예상 견적</h2><p class="quote-subtitle">${subtitle}</p><div class="quote-total" aria-live="polite" aria-atomic="true">${e.total===null?'상담 후 안내':`<span class="amount-number">${e.total.toLocaleString('ko-KR')}</span><span class="amount-unit">원</span>`}</div><p class="vat">VAT 포함 · 상담 후 ${personal?'최종 ':''}확정</p><div class="breakdown">${lines}</div><form id="inquiry-form" novalidate><h3>${personal?'의뢰 정보':'프로젝트 정보'}</h3>${personal?field('name','이름',false,false,'name')+field('contact','연락처',true,false,'tel')+field('request','희망 제작물',true)+field('mood','희망 분위기'):field('company','회사명 또는 기관명',true,false,'organization')+field('manager','담당자명',true,false,'name')+field('contact','이메일 또는 전화번호',true)+field('description','프로젝트 내용',false,true)}<div class="agreement"><input id="agreement" name="agreement" type="checkbox" ${s.fields.agreement?'checked':''} required aria-describedby="error-agreement"><div><label for="agreement">개인정보 수집 및 이용에 동의합니다.</label> <button type="button" class="text-link" data-privacy>내용보기</button><span id="error-agreement" class="error">${esc(s.errors.agreement||'')}</span></div></div><button class="primary submit" type="submit" ${s.submitting?'disabled':''}>${s.submitting?'문의 처리 중…':'상담 내용 문의하기'} <span>→</span></button>${personal?`<a class="black submit direct-payment" href="../cart/index.html" style="text-decoration:none">장바구니 보기 · 결제 <span aria-hidden="true">→</span></a>`:''}<p class="form-note">상담 및 요구사항에 따라 최종 금액이 달라질 수 있습니다.</p><p class="error" role="status">${esc(s.errors.submit||'')}</p></form>`;}
function renderQuote(){const q=document.querySelector('.quote');const scroll=q.scrollTop;q.innerHTML=quoteHTML();q.scrollTop=scroll;}
function adjustVideoQuantity(id,step){
 const delta=Number(step);
 if(page!=='personal'||(delta!==1&&delta!==-1))return;
 const s=S(),item=s.items.find(video=>video.id===id);if(!item)return;
 P.setVideoQuantity(s,id,P.videoQuantity(item)+delta);s.notice='';
 renderQuote();
 const controls=root.querySelector(`[data-video-quantity="${id}"]`);
 const button=controls?.querySelector(`[data-video-step="${delta}"]`);
 (button&&!button.disabled?button:controls?.querySelector('output'))?.focus({preventScroll:true});
}
function render(animate=false){stopProductPreviews();resetQuoteSpring();root.dataset.customer=page;const personal=page==='personal';document.title=`${personal?'개인':'기업'} 제작 문의 | ${C.company}`;root.className='';root.innerHTML=`<section class="hero hero-pending"><h1><span class="hero-title-ink">${personal?'상상이 현실이 되다':'상상으로 시작하세요'}</span></h1><p>${personal?'<span class="hero-line hero-line-first">사진 한 장과 아이디어로</span><span class="hero-line hero-line-second">나만의 AI 영상을 만들어 보세요</span>':'<span class="hero-line hero-line-first">브랜드의 정체성부터 지역·공공 홍보까지</span><span class="hero-line hero-line-second">상상이 당신의 메시지를 완성합니다</span>'}</p><div class="audience">${['personal','corporate'].map(type=>`<a href="${type}.html" data-page="${type}" class="${type===page?'current':''}" ${type===page?'aria-current="page"':''}>${type==='personal'?'개인':'기업'} 제작 문의${type!==page?' <span>→</span>':''}</a>`).join('')}</div></section><div class="page-grid"><div class="content">${personal?eventBanner():''}${personal?personalContent():corporateContent()}${commonContent()}</div><aside class="quote-rail" aria-label="예상 견적 및 문의 정보"><div class="quote">${quoteHTML()}</div></aside></div>`;prepareProductPreviews();document.querySelectorAll('.site-header [data-page]').forEach(a=>a.toggleAttribute('aria-current',a.dataset.page===page));}
function repaint(){
 const s=S();
 const productError=root.querySelector('#product-error');if(productError)productError.textContent=s.errors.product||'';
 // 선택 시 기존 이미지와 본문 DOM을 유지해 스크롤 위치가 바뀌지 않게 합니다.
 root.querySelectorAll('[data-choice]').forEach(button=>{
   const active=s[button.dataset.choice]===button.dataset.id;
   button.classList.toggle('chosen',active);button.setAttribute('aria-pressed',active);
   button.querySelector('.check').textContent=active?'✓':'';
 });
 // 충전 카드 자체가 버튼: 담기면 노란 카드 + 오른쪽 위 '✓ 견적서에 담음'
 root.querySelectorAll('.plan[data-plan]').forEach(card=>{
   const active=planInCart(card.dataset.plan);
   card.classList.toggle('chosen',active);card.setAttribute('aria-pressed',active);
 });
 root.querySelectorAll('[data-product]').forEach(button=>{
   const active=s.product===button.dataset.product;
   button.className=active?'black':'primary';button.setAttribute('aria-pressed',active);
   button.textContent=active?'선택 완료 ✓':'선택하기 →';
 });
 renderQuote();
}
function sizeProductButtons(){
 root.querySelectorAll('.product').forEach(product=>{
  const price=product.querySelector('.product-copy>strong'),button=product.querySelector('[data-product]');
  const textRange=document.createRange();textRange.selectNodeContents(price);
  button.style.width=Math.max(130,Math.ceil(textRange.getBoundingClientRect().width))+'px';
 });
}
window.addEventListener('resize',sizeProductButtons);
document.fonts.ready.then(sizeProductButtons);
document.fonts.addEventListener('loadingdone',sizeProductButtons);
function restoreProductPreview(button){
 const video=button.querySelector('video');
 button.dataset.previewToken=String((Number(button.dataset.previewToken)||0)+1);
 video.pause();if(video.readyState>0){try{video.currentTime=0;}catch{}}
 button.classList.remove('is-loading','is-playing');button.removeAttribute('aria-busy');
 button.setAttribute('aria-label',button.dataset.previewName+' 영상 미리보기 재생');
 button.querySelector('.preview-text').textContent='클릭해서 재생';
 if(activePreview===button)activePreview=null;
}
function stopProductPreviews(){if(activePreview)restoreProductPreview(activePreview);}
function showPreviewPlaying(button){
 if(activePreview!==button)return;
 button.classList.remove('is-loading');button.classList.add('is-playing');button.removeAttribute('aria-busy');
 button.setAttribute('aria-label',button.dataset.previewName+' 영상 미리보기 재생 중');
}
function prepareProductPreviews(){
 root.querySelectorAll('[data-preview]').forEach(button=>{
  const video=button.querySelector('video');
  video.addEventListener('playing',()=>showPreviewPlaying(button));
  video.addEventListener('ended',()=>{restoreProductPreview(button);button.querySelector('.preview-status').textContent='영상 미리보기 재생이 끝났습니다.';});
  video.addEventListener('error',()=>{
   if(activePreview!==button)return;
   restoreProductPreview(button);button.querySelector('.preview-text').textContent='다시 눌러 재생';
   button.querySelector('.preview-status').textContent='영상을 재생하지 못했습니다. 다시 눌러 주세요.';
  });
 });
}
async function playProductPreview(button){
 if(activePreview===button)return;
 stopProductPreviews();activePreview=button;
 const video=button.querySelector('video'),token=String((Number(button.dataset.previewToken)||0)+1);
 button.dataset.previewToken=token;button.classList.add('is-loading');button.setAttribute('aria-busy','true');
 button.setAttribute('aria-label',button.dataset.previewName+' 영상 불러오는 중');
 button.querySelector('.preview-text').textContent='불러오는 중';button.querySelector('.preview-status').textContent='';
 video.loop=false;video.muted=true;
 if(video.readyState>0){try{video.currentTime=0;}catch{}}
 try{
  await video.play();
  if(activePreview===button&&button.dataset.previewToken===token)showPreviewPlaying(button);
 }catch{
  if(button.dataset.previewToken!==token)return;
  restoreProductPreview(button);button.querySelector('.preview-text').textContent='다시 눌러 재생';
  button.querySelector('.preview-status').textContent='영상을 재생하지 못했습니다. 다시 눌러 주세요.';
 }
}
window.addEventListener('pagehide',stopProductPreviews);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopProductPreviews();});
let heroObserver;
let bodyMotionObserver;
function playShortEntrance(element,y,delay=0){
 if(typeof element.animate!=='function')return null;
 const animation=element.animate([
  {opacity:0,transform:`translateY(${Math.round(y*.45)}px)`},
  {opacity:1,transform:'none'}
 ],{duration:500,delay:Math.round(delay*.6),easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
 animation.finished.then(()=>animation.cancel()).catch(()=>{});
 return animation;
}
function prepareBodyMotion(){
 bodyMotionObserver?.disconnect();
 const targets=[];
 root.querySelectorAll('.product').forEach(product=>{
  targets.push({element:product.querySelector('.product-media'),direction:'up',delay:0});
  targets.push({element:product.querySelector('.product-copy'),direction:'up',delay:100});
 });
 root.querySelectorAll('.choices,.plans').forEach(group=>{
  [...group.children].forEach((element,index)=>targets.push({element,direction:'up',delay:index*65}));
 });
 root.querySelectorAll('.intro,.selection>.step,.selection>p,.extras>.step,.extra,.contact>h2,.contact>p,.contact-links>button,.faq>h2,.faq>p,.faq-row').forEach(element=>{
  targets.push({element,direction:'up',delay:0,distance:40});
 });
 const reduceMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
 bodyMotionObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   if(!entry.isIntersecting)return;
   const element=entry.target;
   element.classList.remove('motion-waiting');element.classList.add('motion-active');
   if(reduceMotion){
    playShortEntrance(element,parseFloat(element.style.getPropertyValue('--motion-y'))||64,parseFloat(element.style.getPropertyValue('--motion-delay'))||0);
   }
   element.dataset.revealed='true';bodyMotionObserver.unobserve(element);
  });
 },{threshold:.12,rootMargin:'0px 0px -20px 0px'});
 targets.forEach(({element,direction,delay,distance=64})=>{
  element.dataset.motion=direction;
  element.style.setProperty('--motion-y',distance+'px');
  element.style.setProperty('--motion-delay',delay+'ms');
  element.classList.add('motion-target','motion-waiting');
  element.addEventListener('animationend',event=>{
   if(event.target===element&&event.animationName==='content-action')element.classList.remove('motion-active');
  });
  bodyMotionObserver.observe(element);
 });
}
function prepareHero(){
 heroObserver?.disconnect();
 const hero=root.querySelector('.hero');
 let fontsReady=false,inView=false,played=false,shortAnimations=[];
 const play=()=>{
  if(!fontsReady||!inView||played||!hero.isConnected)return;
  played=true;
  hero.classList.remove('hero-pending','hero-reveal');
  void hero.offsetWidth;
  hero.classList.add('hero-reveal');
  if(matchMedia('(prefers-reduced-motion:reduce)').matches){
   shortAnimations=[
    playShortEntrance(hero.querySelector('h1'),50,100),
    playShortEntrance(hero.querySelector('.hero-line-first'),50,420),
    playShortEntrance(hero.querySelector('.hero-line-second'),50,600)
   ].filter(Boolean);
  }
 };
 heroObserver=new IntersectionObserver(entries=>{
  const entry=entries[0];
  const ratio=entry.intersectionRect.height/Math.max(1,Math.min(entry.boundingClientRect.height,innerHeight));
  inView=ratio>=.8;
  if(ratio<.1){
   shortAnimations.forEach(animation=>animation.cancel());shortAnimations=[];
   played=false;hero.classList.remove('hero-reveal');hero.classList.add('hero-pending');
  }
  play();
 },{threshold:[0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1]});
 heroObserver.observe(hero);
 Promise.all([document.fonts.load('900 124pt Seoul'),document.fonts.load('500 52pt Seoul')]).then(()=>{
  fontsReady=true;play();
 });
}
function closeFAQs(){
 Object.values(states).forEach(state=>{state.faq=[];});
 root.querySelectorAll('.faq-row').forEach(row=>{
  row.classList.remove('open');
  const toggle=row.querySelector('.faq-toggle');
  toggle.setAttribute('aria-expanded','false');toggle.querySelector('b').textContent='+';
  row.querySelector('.faq-answer').inert=true;
 });
}
window.addEventListener('pageshow',event=>{if(event.persisted)closeFAQs();});
function navigate(type,push=true){
 if(push)audienceSelection=type;
 if(type===page){updateAudience();showMainContent();return;}
 closeFAQs();
 resetInquiry(page,false);
 if(dialog.open)dialog.close();
 if(push){
   const target=location.protocol==='file:'?'#'+type:type+'.html';
   try{history.pushState({page:type},'',target);}catch{location.hash=type;}
 }
 if(!push)audienceSelection=type;
 page=type;render(true);prepareHero();prepareBodyMotion();sizeProductButtons();updateAudience();showMainContent();
}
function showMainContent(){
 const mainContent=root.querySelector('.page-grid');
 // Land just under the fixed shared header so the event banner at the top is not hidden behind it.
 const head=document.querySelector('sangsang-header')?.shadowRoot?.querySelector('header')?.getBoundingClientRect().height||81;
 const top=mainContent.getBoundingClientRect().top+scrollY-head;
 window.scrollTo({top:Math.max(0,top),behavior:'instant'});
 mainContent.setAttribute('tabindex','-1');mainContent.focus({preventScroll:true});
 if(!matchMedia('(prefers-reduced-motion:reduce)').matches){
  mainContent.animate([{opacity:.3},{opacity:1}],{duration:240,easing:'ease-out'});
 }
}
function stepQuoteSpring(position,velocity,seconds){
 const dt=Math.min(1/30,Math.max(1/240,seconds));
 const nextVelocity=velocity+(-115*position-7.5*velocity)*dt;
 return {position:position+nextVelocity*dt,velocity:nextVelocity};
}
function resetQuoteSpring(){
 if(quoteSpring.frame)cancelAnimationFrame(quoteSpring.frame);
 quoteSpring.element?.style.removeProperty('transform');
 quoteSpring.element=null;quoteSpring.position=0;quoteSpring.velocity=0;quoteSpring.frame=0;quoteSpring.lastTime=0;quoteSpring.lastY=scrollY;
}
function canSpringFollow(element){
 if(!element||!element.isConnected||innerWidth<=800||dialog.open||document.activeElement?.matches('.quote input,.quote textarea,.quote select'))return false;

 const top=element.getBoundingClientRect().top-quoteSpring.position;
 return top>=72&&top<=88;
}
function runQuoteSpring(time){
 const element=quoteSpring.element;
 if(!canSpringFollow(element)){resetQuoteSpring();return;}
 const dt=quoteSpring.lastTime?(time-quoteSpring.lastTime)/1000:1/60;
 quoteSpring.lastTime=time;
 const step=stepQuoteSpring(quoteSpring.position,quoteSpring.velocity,dt);
 const limit=32;
 quoteSpring.position=Math.max(-limit,Math.min(limit,step.position));quoteSpring.velocity=step.velocity;
 if(Math.abs(quoteSpring.position)<.05&&Math.abs(quoteSpring.velocity)<.15){resetQuoteSpring();return;}
 element.style.transform=`translateY(${quoteSpring.position.toFixed(2)}px)`;
 quoteSpring.frame=requestAnimationFrame(runQuoteSpring);
}
function followQuoteWithSpring(){
 const delta=scrollY-quoteSpring.lastY;quoteSpring.lastY=scrollY;
 const element=root.querySelector('.quote');
 if(!delta)return;
 if(Math.abs(delta)>innerHeight||!canSpringFollow(element)){resetQuoteSpring();return;}
 quoteSpring.element=element;

 const impulse=Math.max(-320,Math.min(320,delta*4));
 const maxVelocity=420;
 quoteSpring.velocity=Math.max(-maxVelocity,Math.min(maxVelocity,quoteSpring.velocity+impulse));
 if(!quoteSpring.frame)quoteSpring.frame=requestAnimationFrame(runQuoteSpring);
}
window.addEventListener('scroll',followQuoteWithSpring,{passive:true});
window.addEventListener('resize',resetQuoteSpring);
root.addEventListener('focusin',event=>{if(event.target.closest('.quote'))resetQuoteSpring();});
root.addEventListener('pointerdown',event=>{if(event.target.closest('.quote'))resetQuoteSpring();});
function updateAudience(){root.querySelectorAll('.audience [data-page]').forEach(a=>{const current=a.dataset.page===audienceSelection;a.classList.toggle('current',current);if(current)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');a.innerHTML=`${a.dataset.page==='personal'?'개인':'기업'} 제작 문의${current?'':' <span>→</span>'}`;});}
window.addEventListener('popstate',()=>navigate(pageFromURL(),false));
window.addEventListener('hashchange',()=>navigate(pageFromURL(),false));
function modal(title,body,actions=[{label:'확인'}]){
 returnFocus=document.activeElement;
 dialog.dataset.variant=title.includes('결제')?'payment':title==='이메일 문의'?'email':'';
 document.querySelector('#modal-title').textContent=title;
 document.querySelector('#modal-body').innerHTML=body;
 const type=title.includes('결제')?'payment':title.includes('개인정보')?'privacy':title.includes('전화')?'phone':title.includes('이메일')?'email':title.includes('카카오')?'kakao':title.includes('완료')?'success':'info';
 const symbols={payment:'<rect x="4" y="8" width="32" height="24" rx="3"/><path d="M4 15h32M10 25h7"/>',privacy:'<path d="m20 4 13 5v10c0 9-13 17-13 17S7 28 7 19V9Z"/><path d="m14 20 4 4 9-10"/>',phone:icons.phone,email:icons.email,kakao:icons.kakao,success:'<circle cx="20" cy="20" r="16"/><path d="m12 20 6 6 12-13"/>',info:'<circle cx="20" cy="20" r="16"/><path d="M20 17v12M20 10v2"/>'};
 document.querySelector('.modal-symbol').innerHTML=`<svg viewBox="0 0 ${['phone','email','kakao'].includes(type)?48:40} ${['phone','email','kakao'].includes(type)?48:40}">${symbols[type]}</svg>`;
 document.querySelector('.modal-eyebrow').textContent=type==='payment'?'PAYMENT CHECKOUT':type==='privacy'?'PRIVACY NOTICE':'상상 스튜디오 · 상담 안내';
 const container=document.querySelector('#modal-actions');container.innerHTML='';
 actions.forEach((action,i)=>{const b=document.createElement('button');b.textContent=action.label;b.className=i===0?'primary':'';b.onclick=()=>{if(!action.keepOpen)dialog.close();action.run?.();};container.append(b);});
 document.body.style.overflow='hidden';dialog.showModal();container.querySelector('button')?.focus();
}
dialog.querySelector('.modal-close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>{document.body.style.overflow='';if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
function privacy(){modal('개인정보 수집 및 이용',`<p class="modal-lead">상담에 필요한 정보와 이용 목적을 확인해 주세요.</p><dl class="modal-details"><div><dt>수집 항목</dt><dd>${page==='personal'?'이름, 연락처, 희망 제작물, 희망 분위기':'회사 또는 기관명, 담당자명, 이메일 또는 전화번호, 프로젝트 내용'}</dd></div><div><dt>이용 목적</dt><dd>${esc(C.privacy.purpose)}</dd></div><div><dt>보유 기간</dt><dd>${esc(C.privacy.retention)}</dd></div></dl><p class="modal-note">동의를 거부할 수 있으나 상담 접수가 제한될 수 있습니다. 내용을 확인해도 동의 항목은 자동으로 선택되지 않습니다.</p>${!C.inquiryEndpoint?'<p class="modal-note">현재 입력 내용은 이 페이지에서만 처리하며 서버로 전송하거나 영구 저장하지 않습니다.</p>':''}`, [{label:'내용 확인했어요'}]);}
function isConsultationOpen(){
 const policy=C.consultation;
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:policy.timeZone,weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
 const get=type=>parts.find(x=>x.type===type)?.value;
 const day=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(get('weekday'));
 const hour=Number(get('hour'))+Number(get('minute'))/60;
 return policy.weekdays.includes(day)&&hour>=policy.openHour&&hour<policy.closeHour;
}
function contact(kind){
 const target=C.contacts[kind],open=isConsultationOpen();
 const hours=`평일 ${C.consultation.openHour}:00 - ${C.consultation.closeHour}:00 · 한국 시간`;
 const closed=open?'':'<p class="office-closed">지금은 상담 안내 시간이 아닙니다.</p>';
 if(kind==='kakao'){
  modal('카카오톡 채널 안내',`<p class="modal-lead">카카오톡에서 ${esc(C.company)} 채널로 문의해 주세요.</p>${closed}<div class="channel-details"><strong>${esc(C.company)}</strong><p>영상 제작 목적과 참고 자료를 채널 채팅으로 보내 주세요.</p><p>${hours}</p></div>${!target?'<p class="modal-note">카카오톡 채널 주소는 등록 예정입니다. 현재는 채널 안내 화면입니다.</p>':''}`,[{label:'채널로 문의하기 ↗',run:()=>{if(target)window.open(target,'_blank','noopener,noreferrer');else modal('카카오톡 채널 안내','<p class="modal-lead">카카오톡 채널 주소 등록 후 연결됩니다.</p><p class="modal-note">입력하신 내용은 그대로 유지됩니다.</p>');}},{label:'닫기'}]);
  return;
 }
 if(kind==='phone'){
  const number=target||C.consultation.demoPhone;
  const connect=()=>{if(target)location.href='tel:'+target.replace(/[^+\d]/g,'');else modal('전화 연결 안내',`<p class="modal-lead">가상 번호 연결 확인 화면입니다.</p><div class="channel-details"><strong class="contact-number">${esc(number)}</strong><p>실제 통화는 연결되지 않습니다.</p></div>`);};
  modal('전화 문의',`${closed}<div class="channel-details"><strong class="contact-number">${esc(number)}</strong><p>${hours}</p>${!target?'<p>화면 확인용 가상 번호</p>':''}</div>${open?'<p class="modal-lead">지금 연결하시겠습니까?</p>':'<p class="modal-note">상담 안내 시간에 다시 문의해 주세요.</p>'}`,open?[{label:'연결하기',run:connect},{label:'취소'}]:[{label:'확인'}]);
  return;
 }
 const subject=`[${C.company}] ${page==='personal'?'개인':'기업'} 영상 제작 문의`;
 const body=Object.entries(S().fields).filter(([key])=>key!=='agreement').map(([key,value])=>`${key}: ${value}`).join('\n');
 const services=[{name:'카카오',url:'https://mail.kakao.com'},{name:'네이버',url:'https://mail.naver.com'},{name:'구글',url:'https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(target||'')+'&su='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body)}];
 const actions=services.map(service=>({label:service.name,run:()=>window.open(service.url,'_blank','noopener,noreferrer')}));
 if(target)actions.push({label:'주소 복사',keepOpen:true,run:async()=>{try{await navigator.clipboard.writeText(target);document.querySelector('#mail-address').textContent='이메일 주소를 복사했습니다.';}catch{document.querySelector('#mail-address').textContent=target;}}});
 modal('이메일 문의',`<p class="modal-lead">이용하실 이메일 서비스를 선택해 주세요.</p>${closed}<div class="channel-details"><strong>카카오 · 네이버 · 구글</strong><p>선택하신 메일 서비스를 새 창에서 엽니다.</p><p id="mail-address">${target?'받는 주소: '+esc(target):'회사 이메일 주소는 등록 예정입니다.'}</p></div>${!open?'<p class="modal-note">이메일은 상담 안내 시간 밖에도 작성하실 수 있습니다.</p>':''}`,actions);
}
function reviewEvent(){
 const target=C.contacts.kakao||'https://pf.kakao.com/';
 modal('카카오톡 리뷰 이벤트 안내',`<p class="modal-lead">리뷰 이벤트 기간과 참여 방법은 카카오톡 채널에서 안내해 드립니다.</p><div class="channel-details"><strong>${esc(C.company)}</strong><p>카카오톡 채널 검색창에 “${esc(C.company)}”를 입력해 주세요.</p></div><p class="modal-note">버튼을 누르면 카카오톡 채널 검색 화면이 새 창에서 열립니다.</p>`,[{label:'카카오톡 채널 검색하기 ↗',run:()=>window.open(target,'_blank','noopener,noreferrer')},{label:'닫기'}]);
}
document.addEventListener('click',e=>{const b=e.target.closest('button,a');if(!b)return;const d=b.dataset,s=S();if(d.page){if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();navigate(d.page);return;}
if(d.preview){playProductPreview(b);return;}
if(b.hasAttribute('data-review-event')){reviewEvent();return;}
if(d.choice){s[d.choice]=s[d.choice]===d.id?null:d.id;s.notice='';repaint(b);}
if(b.hasAttribute('data-add-video')&&page==='personal'){
 const added=P.confirmVideo(s,C);
 if(added){s.notice='영상을 담았습니다. 수량을 조절하거나 다음 영상을 선택해 주세요.';repaint();const firstChoice=root.querySelector('[data-choice="quality"]');firstChoice.focus({preventScroll:true});}
}
if(d.videoStep)adjustVideoQuantity(d.id,d.videoStep);
if(d.removeVideo&&page==='personal'){P.removeVideo(s,d.removeVideo);s.notice='';repaint();root.querySelector('.quote h2').setAttribute('tabindex','-1');root.querySelector('.quote h2').focus({preventScroll:true});}
if(d.plan&&page==='personal')togglePlan(d.plan);
if(d.product){s.product=s.product===d.product?null:d.product;delete s.errors.product;repaint(b);}
if(d.faq!==undefined){const i=Number(d.faq);s.faq=s.faq.includes(i)?s.faq.filter(x=>x!==i):[...s.faq,i];const row=b.closest('.faq-row'),open=s.faq.includes(i);row.classList.toggle('open',open);b.setAttribute('aria-expanded',open);b.querySelector('b').textContent=open?'−':'+';row.querySelector('.faq-answer').inert=!open;}
if(d.contact)contact(d.contact);if(b.hasAttribute('data-privacy'))privacy();});
// 연락처에 숫자만 넣으면 전화번호 모양으로 하이픈을 넣는다 (이메일을 쓰면 그대로 둔다)
const fmtPhone=v=>{const d=v.replace(/\D/g,'').slice(0,11);return d.length<4?d:d.length<8?`${d.slice(0,3)}-${d.slice(3)}`:`${d.slice(0,3)}-${d.slice(3,d.length-4)}-${d.slice(-4)}`};
root.addEventListener('input',e=>{const t=e.target;if(t.name==='contact'&&t.closest('#inquiry-form')&&/^[\d\s-]+$/.test(t.value)){const v=fmtPhone(t.value);if(v!==t.value)t.value=v;}if(t.closest('#inquiry-form')&&t.name){S().fields[t.name]=t.type==='checkbox'?t.checked:t.value;if(S().errors[t.name]){delete S().errors[t.name];t.setAttribute('aria-invalid','false');document.querySelector('#error-'+t.name).textContent='';}}});
root.addEventListener('change',e=>{const t=e.target,d=t.dataset,s=S();if(d.extra){s.extras=t.checked?[...s.extras,d.extra]:s.extras.filter(x=>x!==d.extra);renderQuote();}if(d.quantity){const count=Math.min(999,Math.max(1,Math.floor(Number(t.value)||1)));if(d.quantity==='plan')s.plans[d.id]=count;const key=`[data-quantity="${d.quantity}"][data-id="${d.id}"]`;repaint();document.querySelector(key)?.focus({preventScroll:true});}});
function selectionPrompt(type,state){
 if(type==='corporate'){
  if(C.products.some(product=>product.id===state.product))return null;
  return {title:'제작 상품을 먼저 선택해 주세요.',body:'원하시는 기업 제작 상품을 선택한 뒤 상담을 신청해 주세요.',selector:'[data-product]'};
 }
 const hasVideo=state.items.length>0||(C.qualities.some(quality=>quality.id===state.quality)&&C.durations.some(duration=>duration.id===state.duration));
 if(hasVideo)return null;
 return {title:'제작 항목을 먼저 선택해 주세요.',body:'영상 화질과 길이를 선택한 뒤 상담을 신청해 주세요.',selector:'[data-choice="quality"]'};
}
function resetInquiry(type,updateView=true){
 inquiryRevisions[type]++;
 const state=states[type];
 // 상담 신청 · 초기화로 견적서를 비워도 장바구니에 담긴 영상은 그대로 둔다
 if(type==='personal'){cartLinks.clear();Object.assign(state,{quality:null,duration:null,items:[],nextVideoId:0,notice:'',plans:{}});}
 else Object.assign(state,{product:null,extras:[]});
 Object.assign(state,{fields:{},errors:{},submitting:false});
 saveDrafts();
 if(page!==type||!updateView)return;
 resetQuoteSpring();repaint();
 root.querySelectorAll('[data-extra]').forEach(input=>{input.checked=false;});
 root.querySelector('.quote').scrollTop=0;
 returnFocus=root.querySelector('.quote .submit');
}
function paymentPreview(){
 const estimate=P.personal(states.personal,C),total=Math.max(0,Math.round(estimate.total||0)),vat=Math.round(total/11),subtotal=total-vat;
 const methods=['카카오페이','토스페이','네이버페이','신용카드','계좌이체','무통장입금'];
 modal('결제하기',`<p class="modal-lead">신청 내용을 확인하고 결제수단을 선택해 주세요.</p><div class="payment-receipt"><div><span>공급가액</span><strong>${money(subtotal)}</strong></div><div><span>부가세 (10%, 포함)</span><strong>${money(vat)}</strong></div><div class="payment-total"><span>총 결제 예정금액</span><strong>${money(total)}</strong></div></div><fieldset class="payment-methods"><legend>결제수단 선택</legend>${methods.map((name,index)=>`<label><input type="radio" name="demo-payment-method" value="${name}" ${index===0?'checked':''}><span>${name}</span></label>`).join('')}</fieldset><p class="payment-safety">🔒 안전한 결제 화면을 구성한 시안입니다.</p><p class="modal-note">현재는 화면 확인용으로 실제 결제나 출금이 이루어지지 않습니다.</p>`,[{label:`${money(total)} 결제하기`,run:()=>{
   const method=document.querySelector('input[name="demo-payment-method"]:checked')?.value||methods[0];
   modal('결제 화면 확인 완료',`<p class="modal-lead"><strong>${esc(method)}</strong> 결제 흐름이 선택되었습니다.</p><div class="payment-receipt"><div class="payment-total"><span>결제 예정금액</span><strong>${money(total)}</strong></div></div><p class="modal-note">이 화면은 결제 디자인 시안이므로 실제 승인이나 출금은 발생하지 않았습니다.</p>`);
 }},{label:'돌아가기'}]);
}
function completeInquiry(type,preview=false){
 if(page===type)modal('상담 신청이 완료되었습니다.',`<p class="modal-lead">확인 후 빠른 시일 내에 연락드리겠습니다.</p>${preview?'<p class="modal-note">화면 확인용 완료 안내입니다. 실제 상담 접수 서버는 아직 연결되지 않았습니다.</p>':''}`);
 archiveInquiry(type);
 resetInquiry(type);
}
async function submitInquiry(e){if(e.target.id!=='inquiry-form')return;e.preventDefault();const s=S(),submittedPage=page,revision=inquiryRevisions[page];if(s.submitting)return;
if(!s.fields.agreement){
 modal('개인정보 수집 및 이용에 동의해 주세요.', '<p class="modal-lead">상담 신청 또는 결제를 진행하려면 개인정보 수집 및 이용 동의가 필요합니다.</p><p class="modal-note">동의 내용을 확인한 뒤 체크해 주세요.</p>', [{label:'확인',run:()=>{const agreement=root.querySelector('#agreement');returnFocus=agreement;agreement?.scrollIntoView({block:'nearest',behavior:'smooth'});agreement?.focus({preventScroll:true});}}]);
 return;
}
const prompt=selectionPrompt(page,s);
if(prompt){modal(prompt.title,`<p class="modal-lead">${esc(prompt.body)}</p>`,[{label:'선택하러 가기',run:()=>{
 const target=root.querySelector(prompt.selector);returnFocus=target;
 target?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'center'});
 target?.focus({preventScroll:true});
}}]);return;}
s.errors={};const required=page==='personal'?['contact','request']:['company','manager','contact'];required.forEach(k=>{if(!String(s.fields[k]||'').trim())s.errors[k]='필수 내용을 입력해 주세요.';});if(!s.fields.agreement)s.errors.agreement='개인정보 수집 및 이용에 동의해 주세요.';
if(Object.keys(s.errors).length){renderQuote();const k=Object.keys(s.errors)[0];document.querySelector(k==='agreement'?'#agreement':'#field-'+k).focus();return;}
if(submittedPage==='personal'&&e.submitter?.hasAttribute('data-direct-payment')){paymentPreview();return;}
if(!C.inquiryEndpoint){completeInquiry(submittedPage,true);return;}
s.submitting=true;renderQuote();let completed=false;
try{
 const payload={type:submittedPage,fields:{...s.fields},selection:JSON.parse(JSON.stringify(s)),estimate:submittedPage==='personal'?P.personal(s,C):P.corporate(s,C)};
 const response=await fetch(C.inquiryEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 if(inquiryRevisions[submittedPage]!==revision)return;
 if(!response.ok)throw new Error('request failed');
 completeInquiry(submittedPage);completed=true;
}catch{if(inquiryRevisions[submittedPage]===revision)s.errors.submit='상담을 접수하지 못했습니다. 입력 내용은 유지됩니다. 잠시 후 다시 시도해 주세요.';}
finally{if(inquiryRevisions[submittedPage]===revision){s.submitting=false;if(page===submittedPage&&!completed)renderQuote();}}}
root.addEventListener('submit',submitInquiry);
const topButton=document.createElement('button');topButton.type='button';topButton.className='back-to-top';topButton.setAttribute('aria-label','맨 위로 이동');topButton.innerHTML='<span aria-hidden="true">↑</span><small>TOP</small>';document.body.append(topButton);
function updateTopButton(){topButton.hidden=scrollY<400;}
topButton.addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'}));window.addEventListener('scroll',updateTopButton,{passive:true});
restoreDrafts();
document.addEventListener('click',saveDrafts);
root.addEventListener('input',saveDrafts);
root.addEventListener('change',saveDrafts);
// 다른 페이지에 갔다가 뒤로 가기로 돌아오면 브라우저가 이전 화면을 그대로 보여 주므로, 새로 불러와 견적서를 비운다
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
render();prepareHero();prepareBodyMotion();sizeProductButtons();updateAudience();updateTopButton();
// 마이페이지 · 장바구니의 '포인트 충전하러 가기'(#points)로 오면 충전 카드가 바로 보이게 내려 준다
if(location.hash==='#points')setTimeout(()=>{const box=document.querySelector('#points');if(!box)return;box.querySelectorAll('.motion-waiting').forEach(el=>el.classList.remove('motion-waiting'));const top=box.getBoundingClientRect().top+scrollY-(document.querySelector('sangsang-header')?.getBoundingClientRect().height||80)-16;window.scrollTo({top,behavior:'instant'})},400);
})();

