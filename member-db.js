// 회원 데이터베이스 (Firebase Authentication + Cloud Firestore)
// 가입 · 로그인 정보가 서버(Firebase)에 저장되어 어느 기기에서 가입해도 한곳에 모인다.
// 비밀번호는 Firebase가 관리하고, 사이트는 비밀번호를 저장하지 않는다.
// 로그인한 회원 정보는 다른 화면(장바구니 · 마이페이지)이 바로 읽을 수 있도록 localStorage에 사본만 남긴다.
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
  cache(profile);resolveFirst();
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
 async deleteMember(id){await ready;const b=db.batch();b.delete(db.doc(`members/${id}`));b.delete(db.doc(`usernames/${id}`));await b.commit()},
 // 본인 탈퇴: 회원 정보 · 아이디 · 로그인 계정을 모두 지운다
 async leave(){
  await ready;const u=auth.currentUser,id=idOf(u);if(!u||!id)return;
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
