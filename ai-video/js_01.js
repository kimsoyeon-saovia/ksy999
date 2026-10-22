
for(const selector of ['.hero-screen','#about>.section-head']){
 const screen=document.querySelector(selector),content=document.createElement('div');
 content.className='intro-content';while(screen.firstChild)content.append(screen.firstChild);screen.append(content);
}
