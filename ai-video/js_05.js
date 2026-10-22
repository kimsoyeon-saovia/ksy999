
// Fit only the requested introduction text to the available screen width.
function fitIntro(){
 document.documentElement.style.setProperty('--header-height',document.querySelector('header').getBoundingClientRect().height+'px');
 const items=[['.hero-screen>.intro-content>h1',165.333333],['.hero-screen>.intro-content>.sub',52],['#about>.section-head p',52]];
 for(const [sel,max] of items){const el=document.querySelector(sel);el.style.fontSize='';if(innerWidth<=1200)continue;const available=el.parentElement.clientWidth;let size=max;el.style.fontSize=size+'px';while(el.scrollWidth>available+1&&size>20){size-=.5;el.style.fontSize=size+'px'}}
}
addEventListener('resize',fitIntro);document.fonts.ready.then(fitIntro);fitIntro();
