(()=>{
  const categories=[...document.querySelectorAll('.category')];
  const links=[...document.querySelectorAll('.categories a')];
  const origin=new URLSearchParams(location.search).get('from');
  function activate(){
    const id=categories.some(section=>'#'+section.id===location.hash)?location.hash.slice(1):'dudu';
    categories.forEach(section=>{section.hidden=section.id!==id;});
    links.forEach(link=>{if(link.hash==='#'+id)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    const card=['potes','picoles'].includes(origin)?origin:id==='potes'?'potes':'picoles';
    document.querySelectorAll('[data-back]').forEach(link=>{link.href='/cardapio/#'+card;});
  }
  window.addEventListener('hashchange',()=>{activate();window.scrollTo({top:0,behavior:'instant'});});
  activate();
})();
