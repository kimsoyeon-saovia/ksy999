
const portfolioDialog=document.getElementById('portfolio-dialog');
document.getElementById('portfolio-open').addEventListener('click',()=>{
 const gallery=portfolioDialog.querySelector('.portfolio-gallery');gallery.replaceChildren();
 document.querySelectorAll('.benefit').forEach(row=>{const figure=document.createElement('figure');const media=row.querySelector('.media-preview').firstElementChild.cloneNode(true);media.removeAttribute('loading');media.classList.remove('parallax-image');media.style.removeProperty('--parallax-y');const caption=document.createElement('figcaption');caption.textContent=row.querySelector('h3').textContent;figure.append(media,caption);gallery.append(figure)});portfolioDialog.showModal();
});
portfolioDialog.querySelector('.close').onclick=()=>portfolioDialog.close();
portfolioDialog.addEventListener('click',e=>{if(e.target===portfolioDialog){const r=portfolioDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)portfolioDialog.close()}});
document.getElementById('inquiry-open').onclick=()=>dialog.showModal();
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const revealNodes=document.querySelectorAll('.hero>.visual,#about>.section-head>.intro-content>.eyebrow,#about>.section-head h2,.benefit h3,.media-slot,#process>.section-head,.step,.contact');
if('IntersectionObserver' in window){
 revealNodes.forEach((el,i)=>{el.classList.add('scroll-reveal');if(el.classList.contains('step'))el.style.setProperty('--reveal-delay',((i%4)*70)+'ms')});
 document.documentElement.classList.add('motion-ready');
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.08,rootMargin:'0px 0px -25px 0px'});revealNodes.forEach(el=>observer.observe(el));
}
const parallaxImages=[...document.querySelectorAll('.visual>img,.media-preview>img')];parallaxImages.forEach(el=>el.classList.add('parallax-image'));
let scheduled=false;
function updateParallax(){scheduled=false;parallaxImages.forEach(img=>{if(reducedMotion.matches){img.style.setProperty('--parallax-y','0px');return}const r=img.parentElement.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;const offset=Math.max(-r.height*.055,Math.min(r.height*.055,(innerHeight/2-r.top-r.height/2)*.045));img.style.setProperty('--parallax-y',offset+'px')})}
function requestParallax(){if(!scheduled){scheduled=true;requestAnimationFrame(updateParallax)}}
addEventListener('scroll',requestParallax,{passive:true});addEventListener('resize',requestParallax);reducedMotion.addEventListener('change',requestParallax);requestParallax();
