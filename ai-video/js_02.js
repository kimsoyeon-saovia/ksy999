
// Two requested desktop screens: PLAN + CREATE, then FINISH + HOW WE WORK.
(()=>{
 const benefits=document.querySelector('#about>.benefits');
 const rows=[...benefits.querySelectorAll('.benefit')];
 const process=document.getElementById('process');
 function screen(id,label,nodes){const outer=document.createElement('div');outer.className='paired-screen';outer.id=id;outer.setAttribute('aria-label',label);const inner=document.createElement('div');inner.className='paired-content';nodes.forEach(node=>inner.append(node));outer.append(inner);benefits.append(outer)}
 screen('plan-create-screen','PLAN과 CREATE',[rows[0],rows[1]]);
 screen('finish-process-screen','FINISH와 제작 과정',[rows[2],process]);
 function fitScreens(){
 const header=document.querySelector('header').getBoundingClientRect().height;
 document.documentElement.style.setProperty('--header-height',header+'px');
 document.querySelectorAll('.paired-screen').forEach(outer=>{const inner=outer.firstElementChild;outer.style.setProperty('--screen-scale','1');if(innerWidth>750){const available=innerHeight-header-24;const natural=inner.offsetHeight;outer.style.setProperty('--screen-scale',Math.min(1,available/natural))}});
 }
 document.fonts.ready.then(fitScreens);addEventListener('load',fitScreens);addEventListener('resize',fitScreens);document.querySelectorAll('.paired-screen img').forEach(img=>img.addEventListener('load',fitScreens));fitScreens();
})();
