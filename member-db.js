// 회원 데이터베이스 (Firebase Authentication + Cloud Firestore)
// 가입 · 로그인 정보가 서버(Firebase)에 저장되어 어느 기기에서 가입해도 한곳에 모인다.
// 비밀번호는 Firebase가 관리하고, 사이트는 비밀번호를 저장하지 않는다.
// 로그인한 회원 정보는 다른 화면(장바구니 · 마이페이지)이 바로 읽을 수 있도록 localStorage에 사본만 남긴다.
// 로그인한 회원의 장바구니 · 주문 · 상담 내역도 계정(userdata/{uid})에 저장해 어느 브라우저에서든 이어서 보인다.
(()=>{
if(window.SangsangDB)return;
const CONFIG={
 apiKey:'AIzaSyDHCpyu5Vh2azygAvgcN08VdIrb7kkPgu8',
 authDomain:'sangsang-studio.firebaseapp.com',
 projectId:'sangsang-studio',
 storageBucket:'sangsang-studio.firebasestorage.app',
 messagingSenderId:'882254777273',
 appId:'1:882254777273:web:c618d4a7f70a27fc4cc468'
};
const SDK='https://www.gstatic.com/firebasejs/10.12.2/';
// 아이디로 로그인하도록, Firebase에는 아이디를 이메일 모양으로 바꿔 등록한다 (메일은 보내지 않음)
const ID_DOMAIN='member.sangsang.example';
const toEmail=id=>`${id}@${ID_DOMAIN}`;
const idOf=user=>user?.email?.endsWith('@'+ID_DOMAIN)?user.email.slice(0,-ID_DOMAIN.length-1):null;
const MEMBERS='sangsang-members-v2',SESSION='sangsang-member-session';
const write=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,JSON.stringify(v))}catch{}};

function load(src){return new Promise((ok,fail)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=ok;s.onerror=fail;document.head.append(s)})}
let auth,db,resolveFirst,signingUp=false;
const firstState=new Promise(r=>{resolveFirst=r});
async function profileOf(user){
 const id=idOf(user);if(!id)return null;
 const snap=await db.doc(`members/${id}`).get();return snap.exists?{id,...snap.data()}:null;
}
const ready=(async()=>{
 if(!window.firebase?.firestore){for(const f of ['firebase-app-compat.js','firebase-auth-compat.js','firebase-firestore-compat.js'])await load(SDK+f)}
 const app=firebase.apps.length?firebase.app():firebase.initializeApp(CONFIG);
 auth=app.auth();db=app.firestore();
 auth.onAuthStateChanged(async user=>{
  // 가입 중에는 회원 정보를 아직 만드는 중이라 건너뛴다
  if(signingUp)return;
  let profile=null;
  if(user){
   try{profile=await profileOf(user)}catch{}
   // 관리자가 삭제한 계정은 회원 정보가 없으므로 로그인 상태를 풀어 준다
   if(!profile){await auth.signOut();return}
  }
  cache(profile);
  // 장바구니 · 주문 · 상담 내역을 계정에서 불러오고(로그인), 이 브라우저에서 지운다(로그아웃)
  if(profile)await pull(user.uid,profile.id).catch(()=>{});else clearLocal();
  resolveFirst();
  window.dispatchEvent(new Event('sangsang-member-change'));
 });
})();
ready.catch(()=>resolveFirst());

// 다른 스크립트가 읽는 로그인 사본 (현재 로그인한 회원 한 명만)
function cache(p){
 if(!p){write(SESSION,null);write(MEMBERS,null);return}
 const {id,uid,...rest}=p;
 write(SESSION,{id,name:p.name});write(MEMBERS,{[id]:rest});
}
const errCode=e=>String(e?.code||'').replace('auth/','');

// ---------------- 장바구니 · 주문 · 상담 내역을 회원 계정(Firestore)에 저장 ----------------
// 화면 스크립트(cart.js · cart-page.js · mypage.js · inquiry.js)는 지금처럼 localStorage를 읽고 쓴다.
// 여기서 로그인한 회원의 값만 서버 userdata/{uid}와 맞춰, 다른 브라우저 · 기기에서 다시 로그인해도 그대로 보인다.
//  userdata/{uid}              cart: { items, nextVideoId }
//  userdata/{uid}/orders/{no}  주문 1건
//  userdata/{uid}/consults/{key} 결제 전 상담 신청 1건
const DRAFT='sangsang-studio-draft-v1',ORDERS='sangsang-orders',INQUIRIES='sangsang-studio-inquiries-v1';
const OWNER='sangsang-data-owner',PENDING='sangsang-cart-pending';
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
let syncUid=null,syncId=null,applying=false,cartTimer=0;
const userDoc=()=>db.doc(`userdata/${syncUid}`);
const consultKey=r=>String(r.savedAt||'').replace(/[^0-9A-Za-z]/g,'');
const myOrders=id=>(read(ORDERS,[])||[]).filter(o=>o&&o.memberId===id&&o.no);
const myConsults=id=>(read(INQUIRIES,[])||[]).filter(r=>r&&r.memberId===id&&r.savedAt);
const cartOf=()=>{const p=read(DRAFT,{})?.personal||{};return {items:Array.isArray(p.items)?p.items:[],nextVideoId:Number(p.nextVideoId)||0}};
// Firestore는 undefined 값을 받지 않으므로 JSON으로 한 번 정리해서 보낸다
const plain=v=>JSON.parse(JSON.stringify(v));
// 우리가 고친 값은 다시 서버로 보내지 않도록 applying 동안 쓴다
function apply(k,v){applying=true;try{localStorage.setItem(k,JSON.stringify(v))}catch{}finally{applying=false}}
function notify(){window.dispatchEvent(new Event('sangsang-cart-change'));window.dispatchEvent(new Event('sangsang-data-sync'))}

function pushCart(){
 clearTimeout(cartTimer);
 cartTimer=setTimeout(()=>{if(!syncUid)return;userDoc().set({cart:plain(cartOf()),updatedAt:new Date().toISOString()},{merge:true}).then(()=>{try{localStorage.removeItem(PENDING)}catch{}}).catch(()=>{})},400);
}
async function pushMissing(){
 if(!syncUid)return;
 const ref=userDoc(),done=[];
 for(const o of myOrders(syncId))if(!known.orders.has(o.no)){known.orders.add(o.no);done.push(ref.collection('orders').doc(o.no).set(plain(o)))}
 for(const r of myConsults(syncId)){const k=consultKey(r);if(!known.consults.has(k)){known.consults.add(k);done.push(ref.collection('consults').doc(k).set(plain(r)))}}
 await Promise.all(done).catch(()=>{});
}
const known={orders:new Set(),consults:new Set()};

// 로그인했을 때: 계정에 저장된 값을 이 브라우저로 불러온다
async function pull(uid,id){
 const ref=db.doc(`userdata/${uid}`);
 const [snap,os,cs]=await Promise.all([ref.get(),ref.collection('orders').get(),ref.collection('consults').get()]);
 const owner=read(OWNER,null),local=cartOf(),server=snap.data()?.cart;
 let items=Array.isArray(server?.items)?server.items:[],next=Number(server?.nextVideoId)||0,changed=false;
 if(owner?.id===id&&read(PENDING,false)){
  // 같은 회원이 저장되기 전에 고친 장바구니는 이 브라우저 값을 쓴다
  items=local.items;next=local.nextVideoId;changed=true;
 }else if(owner?.id!==id&&local.items.length){
  // 로그인 전에 비회원으로 담은 영상은 회원 장바구니에 더한다
  items=items.map(i=>({...i}));next=Math.max(next,...items.map(i=>Number(i.id)||0));
  for(const it of local.items){
   const same=items.find(x=>x.quality===it.quality&&x.duration===it.duration);
   if(same)same.quantity=(Number(same.quantity)||1)+(Number(it.quantity)||1);else items.push({...it,id:String(++next)});
  }
  changed=true;
 }
 const d=read(DRAFT,{})||{};d.personal={...(d.personal||{}),items,nextVideoId:next};apply(DRAFT,d);
 const serverOrders=os.docs.map(x=>x.data()),serverConsults=cs.docs.map(x=>x.data());
 known.orders=new Set(serverOrders.map(o=>o.no));known.consults=new Set(cs.docs.map(x=>x.id));
 // 이 브라우저에만 있던 내 주문 · 상담(예전 시연 기록)은 계정으로 올리고, 계정에 있는 것은 이 브라우저에 채운다
 const otherOrders=(read(ORDERS,[])||[]).filter(o=>o?.memberId!==id),localMine=myOrders(id);
 apply(ORDERS,[...otherOrders,...serverOrders,...localMine.filter(o=>!known.orders.has(o.no))]);
 const otherConsults=(read(INQUIRIES,[])||[]).filter(r=>r?.memberId!==id),localConsults=myConsults(id);
 apply(INQUIRIES,[...otherConsults,...serverConsults,...localConsults.filter(r=>!known.consults.has(consultKey(r)))]);
 apply(OWNER,{id,uid});
 syncUid=uid;syncId=id;
 if(changed)pushCart();
 await pushMissing();
 notify();
}
// 로그아웃했을 때: 그 회원의 장바구니 · 주문 · 상담을 이 브라우저에서 지운다 (계정에는 남아 있음)
function clearLocal(){
 syncUid=null;syncId=null;clearTimeout(cartTimer);
 const owner=read(OWNER,null);if(!owner)return;
 const d=read(DRAFT,{})||{};if(d.personal){d.personal={...d.personal,items:[],nextVideoId:0};apply(DRAFT,d)}
 apply(ORDERS,(read(ORDERS,[])||[]).filter(o=>o?.memberId!==owner.id));
 apply(INQUIRIES,(read(INQUIRIES,[])||[]).filter(r=>r?.memberId!==owner.id));
 try{localStorage.removeItem(OWNER);localStorage.removeItem(PENDING)}catch{}
 notify();
}
// 화면 스크립트가 localStorage에 쓸 때마다 로그인한 회원의 값이면 서버에도 저장한다
const nativeSet=Storage.prototype.setItem;
Storage.prototype.setItem=function(k,v){
 nativeSet.call(this,k,v);
 if(applying||this!==window.localStorage)return;
 // 저장이 끝나기 전에 페이지를 옮겨도 다음 페이지에서 이어 보내도록 '보내는 중' 표시를 남긴다
 if(k===DRAFT&&read(OWNER,null)){nativeSet.call(this,PENDING,'true');if(syncUid)pushCart()}
 else if((k===ORDERS||k===INQUIRIES)&&syncUid)pushMissing();
};
async function removeUserData(uid){
 const ref=db.doc(`userdata/${uid}`);
 const [os,cs]=await Promise.all([ref.collection('orders').get(),ref.collection('consults').get()]);
 const b=db.batch();os.docs.concat(cs.docs).forEach(x=>b.delete(x.ref));b.delete(ref);await b.commit();
}

window.SangsangDB={
 ready,
 whenAuthKnown:()=>ready.then(()=>firstState),
 // 아이디 중복 확인: usernames 컬렉션에는 아이디 → uid 만 저장되어 누구나 존재 여부만 확인할 수 있다
 async isIdTaken(id){await ready;return (await db.doc(`usernames/${id}`).get()).exists},
 async signup({id,password,name,phone,email,address}){
  await ready;signingUp=true;
  try{
   const cred=await auth.createUserWithEmailAndPassword(toEmail(id),password);
   const uid=cred.user.uid,b=db.batch();
   b.set(db.doc(`usernames/${id}`),{uid});
   b.set(db.doc(`members/${id}`),{uid,name,phone,email,address,joined:new Date().toISOString()});
   try{await b.commit()}catch(e){await cred.user.delete().catch(()=>{});throw e}
  }finally{
   signingUp=false;
   // 기존 흐름처럼 가입 후에는 로그인 화면으로 보낸다
   await auth.signOut().catch(()=>{});
  }
 },
 // 로그인 후 회원 정보를 바로 돌려준다 (환영 문구에 이름을 쓰기 위해)
 async login(id,password){
  await ready;
  const {user}=await auth.signInWithEmailAndPassword(toEmail(id),password);
  const profile=await profileOf(user);
  if(!profile){await auth.signOut();throw {code:'deleted'}}
  cache(profile);window.dispatchEvent(new Event('sangsang-member-change'));
  return profile;
 },
 async logout(){await ready;await auth.signOut()},
 current(){const id=idOf(auth?.currentUser);return id?{id}:null},
 async isAdmin(){await ready;const u=auth.currentUser;if(!u)return false;try{return (await db.doc(`admins/${u.uid}`).get()).exists}catch{return false}},
 async listMembers(){await ready;return (await db.collection('members').get()).docs.map(d=>({id:d.id,...d.data()}))},
 async updateMember(id,data){
  await ready;await db.doc(`members/${id}`).update(data);
  if(idOf(auth.currentUser)===id){const s=await db.doc(`members/${id}`).get();cache({id,...s.data()});window.dispatchEvent(new Event('sangsang-member-change'))}
 },
 // 관리자 삭제: 회원 정보와 아이디를 지운다 (로그인 계정은 남지만 회원 정보가 없어 로그인되지 않음)
 async deleteMember(id){
  await ready;
  const uid=(await db.doc(`members/${id}`).get()).data()?.uid;
  if(uid)await removeUserData(uid).catch(()=>{});
  const b=db.batch();b.delete(db.doc(`members/${id}`));b.delete(db.doc(`usernames/${id}`));await b.commit()},
 // 본인 탈퇴: 회원 정보 · 아이디 · 장바구니 · 주문 · 상담 내역 · 로그인 계정을 모두 지운다
 async leave(){
  await ready;const u=auth.currentUser,id=idOf(u);if(!u||!id)return;
  await removeUserData(u.uid);
  const b=db.batch();b.delete(db.doc(`members/${id}`));b.delete(db.doc(`usernames/${id}`));await b.commit();
  await u.delete().catch(()=>auth.signOut());
 },
 errorText(e){
  const c=errCode(e);
  if(c==='email-already-in-use')return '이미 사용 중인 아이디입니다.';
  if(c==='deleted')return '삭제된 계정입니다. 관리자에게 문의해 주세요.';
  if(['invalid-credential','wrong-password','user-not-found','invalid-login-credentials'].includes(c))return '아이디 또는 비밀번호가 맞지 않습니다.';
  if(c==='too-many-requests')return '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  if(c==='network-request-failed')return '인터넷 연결을 확인해 주세요.';
  if(c==='weak-password')return '비밀번호가 너무 쉽습니다. 영문 · 숫자를 섞어 8자 이상 입력해 주세요.';
  if(c==='permission-denied')return '권한이 없습니다.';
  return '잠시 후 다시 시도해 주세요.';
 }
};
})();
