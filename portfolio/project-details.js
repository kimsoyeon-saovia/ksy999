// Project detail window: name, overview and use cases rendered as real text in one shared style,
// replacing the cropped screenshots whose colours differed per project. Photos live in uses/.
(()=>{
const P=(title,overview,labels,sub)=>({title,overview,labels,sub});
const details={
 0:P('게온담, 바다의 깊은 맛을 담다',['윤기 나는 간장게장과 정갈한 상차림을 통해','식품 브랜드의 깊은 맛과 정성을 전하는 광고 영상 프로젝트입니다.'],['식품·제품 광고','브랜드 홍보 영상','온라인몰 상세페이지','SNS·숏폼 콘텐츠']),
 1:P('너에게 기울던 오후',['한 시절의 설렘과 우정을 담은 감성 웹드라마 예고편 프로젝트입니다.','따뜻한 오후의 빛과 두 주인공의 시선으로 풋풋한 첫사랑의 순간을 그렸습니다.'],['웹드라마 예고편','SNS·숏폼 티저','플랫폼 대표 썸네일','캐릭터·OST 홍보']),
 2:P('벨루네브, 향기를 영상으로 담다',['로즈핑크와 샴페인 골드의 우아한 무드를 바탕으로','향수 브랜드의 매력을 전하는 광고 영상 프로젝트입니다.'],['향수·뷰티 광고','브랜드 홍보 영상','신제품 론칭','SNS·숏폼 콘텐츠']),
 3:P('케르빅, 다음 기록을 향한 질주',['역동적인 러닝 장면과 제품 클로즈업을 통해','스포츠 브랜드의 에너지와 도전 정신을 전하는 광고 영상 프로젝트입니다.'],['스포츠·제품 광고','브랜드 캠페인','신제품 론칭','SNS·숏폼 콘텐츠']),
 4:P('빵 친구들과 떠나는 달콤한 대전 여행',['친근한 빵 캐릭터와 대전의 명소를 생생하게 담아','도시의 매력과 여행의 즐거움을 전하는 지역 홍보 영상 프로젝트입니다.'],['지역 관광 홍보','지역 축제 안내','특산물·상권 홍보','SNS·숏폼 콘텐츠']),
 5:P('팔삼이와 떠나는 특별한 대구 여행',['83타워를 모티브로 한 캐릭터 팔삼이와 함께','대구의 명소와 이야기를 친근하게 전하는 지역 홍보 영상 프로젝트입니다.'],['지역 관광 홍보','지역 축제 안내','문화·명소 소개','SNS·숏폼 콘텐츠']),
 6:P('AI 스마트 안경 홍보',['스마트 안경이 만들어가는 더 나은 일상을 주제로','AI 기술이 접목된 스마트 안경의 혁신적인 기능과 가치를','감각적으로 보여주는 홍보 영상을 제작한 프로젝트입니다.'],['글로벌 비즈니스 & 실시간 통역','야간 안전 & 실시간 기록','음성 안내 & 정보 검색']),
 7:P('가족사진, 소중한 추억을 영상으로',['일상의 소중한 순간을 영상으로 기억할 수 있도록','AI 기술과 감성적인 스토리텔링을 결합한 맞춤형 영상 제작 서비스입니다.'],['가족 추억 영상','브랜드 광고','여행 및 일상 기록']),
 8:P('나만의 창작이야기',['나 또는 가족을 넣어서 재미있는 영상을 만들거나','영화를 만들 수 있는 광고 콘텐츠입니다.'],['나만의 영화','가족 주연 영상','반려동물 영화','SNS 숏폼 콘텐츠']),
 9:P('횡성한우 지역 홍보',['횡성한우의 우수한 품질과 지역의 매력을 효과적으로 알리기 위해','지역 특산물과 자연환경, 전통의 가치를 함께 담아낸','홍보 영상을 제작한 프로젝트입니다.'],['브랜드 홍보','온라인 광고','매장 홍보','선물세트 소개']),
 10:P('마법 같은 날들을 선물해 주신 부모님께',['부모님의 환갑을 맞아, 딸의 기억 속 가족을 판타지로 담아낸 헌정 영상입니다.','마법 같았던 어린 시절부터 오늘의 포옹까지, 감사와 사랑의 마음을 전합니다.'],['가족 기념 영상','부모님 선물','생일·기념일 콘텐츠','유튜브/SNS 콘텐츠']),
 11:P('우리 집 강아지가 아이돌이 되었다',['반려견 포포를 무대 위 아이돌 DJ로 재해석한 7초 분량의 AI 실사 영상입니다.','화려한 조명과 반짝이는 무대 의상으로 포포의 사랑스러운 매력을 유쾌하게 담았습니다.'],['반려동물 기념 영상','캐릭터 소개 콘텐츠','쇼츠·릴스 콘텐츠','유튜브/SNS 콘텐츠']),
 12:P('우리가 알던 경주와 다른 경주를 만나다',['두 친구가 루지와 경주월드, 도자기 체험과 황리단길을 즐기고','한옥 스테이에서 쉬어가며 경주의 새로운 매력을 발견하는 여행 홍보 영상입니다.'],['루지','경주월드','한옥 스테이','도자기 체험']),
 13:P('우리들의 구독',['취향과 일상을 채우는 다양한 구독 서비스를 생활 속 장면으로 담아,','매달 새로운 즐거움을 만나는 순간을 전하는 브랜드 광고입니다.'],['구독 서비스 홍보','라이프스타일 제품 소개','구독 선물 프로모션','SNS·온라인 광고']),
 14:P('책을 읽읍시다',['애니메이션 느낌의 친근한 광고로 책 읽는 즐거움을 전하고,','누구나 일상 속에서 독서를 시작하도록 돕는 공공 캠페인입니다.'],['독서 장려 캠페인','도서관·서점 홍보','이달의 추천 도서','SNS 책 소개 콘텐츠'],'이달의 책 소개'),
 15:P('배움으로 가까워지는 디지털 세상',['디지털이 낯선 시니어의 일상을 따뜻한 이야기로 담아,','공공기관의 교육사업과 참여 가치를 알리는 AI 홍보영상입니다.'],['시니어 디지털 교육','공공서비스 안내','교육 참여자 모집','디지털 포용 캠페인']),
 16:P('작아진 옷, 이어지는 이야기',['아이가 자라 작아진 옷이 이웃에게 전해지는 이야기로,','중고거래가 이어 주는 새로운 시작과 브랜드 가치를 담았습니다.'],['브랜드 스토리 광고','서비스 이용 안내','자원순환 캠페인','SNS 공감형 콘텐츠']),
 17:P('빵 친구들과 떠나는 달콤한 대전 여행',['친근한 빵 캐릭터와 대전의 명소를 생생하게 담아','도시의 매력과 여행의 즐거움을 전하는 지역 홍보 영상 프로젝트입니다.'],['지역 관광 홍보','지역 축제 안내','특산물·상권 홍보','SNS·숏폼 콘텐츠'])
};
const dialog=document.getElementById('project-dialog');
const panel=dialog.querySelector('.original-panel');
const player=dialog.querySelector('.clean-player');
const info=document.createElement('div');info.className='project-info';info.hidden=true;
player.after(info);
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const label=t=>`<p class="info-label"><span>${t}</span></p>`;
const beforeInfoOpen=openProject;
openProject=function(card,index){
 const d=details[index];
 beforeInfoOpen(card,index);
 dialog.classList.toggle('has-info',!!d);
 info.hidden=!d;panel.hidden=!!d;
 if(!d)return;
 const n=String(index).padStart(2,'0');
 info.innerHTML=`${label('프로젝트 명')}<h2 class="info-title">${esc(d.title)}</h2>${d.sub?`<p class="info-sub">${esc(d.sub)}</p>`:''}
<div class="info-block">${label('프로젝트 개요')}<p class="info-overview">${d.overview.map(esc).join('<br> ')}</p></div>
<div class="info-block">${label('주요 활용 사례')}<div class="info-uses" style="--uses:${d.labels.length}">${d.labels.map((t,i)=>`<figure><img src="uses/p${n}-${i+1}.jpg" alt="${esc(t)}" loading="lazy"><figcaption>${esc(t)}</figcaption></figure>`).join('')}</div></div>`;
 dialog.setAttribute('aria-label',d.title+' 프로젝트 상세');
 dialog.scrollTop=0;
 fitToWindow();requestAnimationFrame(fitToWindow);
};
// Keep the whole window on screen without scrolling.
// Desktop: narrow the whole window (video and text together) until it fits, so it never looks
// like a wide box with a small video. Phones: the sheet is full width, so only the video narrows.
const phone=matchMedia('(max-width:600px)');
function fitToWindow(){
 if(!dialog.open||!dialog.classList.contains('has-info'))return;
 dialog.style.removeProperty('--fit-w');dialog.classList.remove('is-compact');player.style.maxWidth='';
 if(phone.matches){
  const over=dialog.scrollHeight-dialog.clientHeight;if(over<=0)return;
  const w=player.offsetWidth,h=player.offsetHeight;
  player.style.maxWidth=Math.floor(w*Math.max(h-over-2,h*.6)/h)+'px';
  return;
 }
 const narrow=min=>{for(let i=0;i<8;i++){
  const over=dialog.scrollHeight-dialog.clientHeight;if(over<=1)return true;
  const w=dialog.offsetWidth,next=Math.max(min,Math.floor(w-over*16/9-4));
  if(next>=w)return false;
  dialog.style.setProperty('--fit-w',next+'px');
 }return dialog.scrollHeight-dialog.clientHeight<=1;};
 if(!narrow(560)){dialog.classList.add('is-compact');narrow(500);}
}
addEventListener('resize',()=>requestAnimationFrame(fitToWindow));
info.addEventListener('load',()=>requestAnimationFrame(fitToWindow),true);
dialog.addEventListener('close',()=>{dialog.style.removeProperty('--fit-w');dialog.classList.remove('is-compact');player.style.maxWidth='';});
})();

// Video play images supplied for the detail window (16:9 key visuals), keyed by project index.
// Hoengseong's image already shows its own play button, so the overlay icon is hidden for it.
(()=>{
const posters={0:'play-geondam',1:'play-afternoon',2:'play-veluneve',3:'play-kerviq',4:'play-daejeon',6:'play-ai-glasses',7:'play-family',8:'play-cat-story',9:'play-hoengseong',17:'play-daejeon'};
const embeddedPlay=new Set([9]);
const player=document.querySelector('#project-dialog .clean-player');
const beforePosterOpen=openProject;
openProject=function(card,index){
 beforePosterOpen(card,index);
 const name=posters[index];
 player.classList.toggle('embedded-play',embeddedPlay.has(index));
 if(!name)return;
 player.classList.remove('daejeon-project');
 const img=player.querySelector('img');
 img.src=`posters/${name}.webp`;
 img.alt=card.querySelector('h3').textContent;
};
})();
