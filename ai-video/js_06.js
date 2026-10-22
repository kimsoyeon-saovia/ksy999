
function fitIntroScreens(){
 for(const screen of document.querySelectorAll('.hero-screen,#about>.section-head')){
 const content=screen.querySelector('.intro-content');screen.style.setProperty('--intro-scale','1');
 if(innerWidth<=750)continue;
 const style=getComputedStyle(screen),available=screen.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
 const scale=Math.min(1,available/content.offsetHeight,screen.clientWidth/content.scrollWidth);
 screen.style.setProperty('--intro-scale',String(scale));
 }
}
document.fonts.ready.then(()=>{fitIntro();fitIntroScreens()});
addEventListener('load',fitIntroScreens);addEventListener('resize',()=>requestAnimationFrame(fitIntroScreens));fitIntroScreens();
