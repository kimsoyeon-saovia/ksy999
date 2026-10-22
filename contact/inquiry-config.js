window.INQUIRY_CONFIG = {
  company: '상상 스튜디오',
  contacts: { phone: '0507-8765-4321', email: '', kakao: 'https://accounts.kakao.com/login/?continue=https%3A%2F%2Fmail.kakao.com#login' },
  consultation: { timeZone:'Asia/Seoul', weekdays:[1,2,3,4,5], openHour:10, closeHour:19, demoPhone:'0507-8765-4321' },
  inquiryEndpoint: '',
  privacy: { purpose: '영상 제작 상담 및 견적 안내', retention: '실제 접수 연결 전 보유 기간과 처리방침 확인이 필요합니다.' },
  pointValue: 10,
  qualities: [
    {id:'720p',name:'720p',points:500,description:'가볍게 공유하는 기본 화질'},
    {id:'1080p',name:'1080p',points:600,description:'선명하고 자연스러운 표준 화질'},
    {id:'2k',name:'2K (UHD)',points:650,description:'디테일까지 또렷한 고화질'},
    {id:'4k',name:'4K',points:650,description:'큰 화면에서도 살아나는 최고 화질'}
  ],
  durations: [{id:'5',name:'5초',points:200},{id:'10',name:'10초',points:370},{id:'15',name:'15초',points:520},{id:'30',name:'30초',points:990},{id:'60',name:'1분',points:1890}],
  plans: [{id:'starter',name:'STARTER',price:50000,points:5000,bonus:1000},{id:'plus',name:'PLUS',price:100000,points:10000,bonus:3000}],
  products: [
    {id:'shorts',name:'AI 숏폼',duration:'15~30초',description:'SNS 광고 및 숏폼 콘텐츠',price:900000,display:'90만원부터',image:'shorts.png',video:'shorts.mp4',alt:'하늘을 나는 빨간 망토의 치킨 캐릭터'},
    {id:'brand',name:'브랜드 영상',duration:'30~60초',description:'제품 · 서비스 · 기업 소개',price:1800000,display:'180만원부터',image:'brand.webp',video:'brand.mp4',alt:'노을과 조경이 어우러진 고급 주거 단지'},
    {id:'campaign',name:'AI 캠페인',duration:'60~90초',description:'캠페인 및 브랜드 필름',price:3500000,display:'350만원부터',image:'campaign.webp',video:'campaign.mp4',alt:'한국 전통 건축 앞 한복을 입은 동물 캐릭터'},
    {id:'custom',name:'기타',duration:'기본 1분',description:'무한한 상상을 새로운 장면으로',price:null,display:'상담 후 안내',image:'custom.webp',video:'custom.mp4',alt:'미래 도시를 달리는 자동차와 무한대 모양 빛의 궤적'}
  ],
  extras: [
    {id:'ratio',name:'채널별 추가 비율 납품',description:'게시 채널에 맞춰 화면 비율을 추가 제작합니다.',price:120000},
    {id:'voice',name:'성우 내레이션',description:'영상의 메시지를 전문 성우의 목소리로 전달합니다.',price:250000},
    {id:'subtitle',name:'외국어 자막 버전',description:'해외 시청자를 위한 외국어 자막 버전을 제작합니다.',price:160000},
    {id:'urgent',name:'긴급 납품',description:'희망 일정에 맞춰 제작 가능 여부를 상담합니다. 납기는 상담 후 확정됩니다.',price:300000}
  ]
};
