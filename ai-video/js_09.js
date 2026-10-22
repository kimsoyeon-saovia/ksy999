
(()=>{const heading=document.querySelector('#about .split-heading');if(!heading)return;const start=()=>heading.classList.add('shine-started');if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){start();observer.disconnect()}},{threshold:.25});observer.observe(heading)}else start()})();
