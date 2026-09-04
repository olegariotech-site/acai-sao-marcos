(() => {
  'use strict';

  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const isCardapio = path === '/cardapio';
  const isSabores = path === '/sabores';
  if (!isCardapio && !isSabores) return;

  const formatCurrency = () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const parent = node.parentElement;
      if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) return;
      node.nodeValue = node.nodeValue.replace(/R\$\s*(\d+)(?![\d,])/g, 'R$ $1,00');
    });
  };

  const installPolish = () => {
    if (document.getElementById('ot-cardapio-polish-style')) return;
    const style = document.createElement('style');
    style.id = 'ot-cardapio-polish-style';

    if (isCardapio) {
      style.textContent = `
        .sheet{grid-template-rows:15.5% minmax(0,1fr)}
        .hero{padding-top:calc(var(--safeT) + 37px)}
        .hero-copy{max-width:86%}
        .hero h1{font-size:clamp(25px,4.05vh,36px)}
        .head{font-size:clamp(10.2px,1.28vh,13.2px);line-height:1.05}
        .price{padding:1px 0;font-size:clamp(9.8px,1.16vh,12.2px);line-height:1.12}
        .price strong{font-size:.96em;white-space:nowrap}
        .acai .body{grid-template-rows:.94fr 1fr .78fr .66fr auto auto}
        .acai .grid2:first-child .panel:first-child .inside{padding-top:3px;padding-bottom:3px}
        .acai .grid2:first-child .panel:first-child .price{line-height:1.05}
        .trio .body{grid-template-rows:1.24fr 1.04fr .62fr auto}
        .trio video{object-position:center 38%}
        .trio .tags.dense .tag{font-size:clamp(7.7px,.91vh,9.3px);padding:2px 4px}
        .bigprice{padding:7px}
        .bigprice small{font-size:9px}
        .bigprice strong{font-size:clamp(26px,4.15vh,38px);line-height:.9;white-space:nowrap}
        .bigprice p{margin-top:3px;font-size:clamp(8.2px,1vh,10.5px);line-height:1.12}
        .bat .body{grid-template-rows:.76fr .83fr .70fr auto}
        .bat .hero h1{font-size:clamp(23px,3.65vh,32px);line-height:.88}
        .bat .hero-copy{max-width:90%}
        .prod .money{font-size:clamp(18px,2.35vh,25px);white-space:nowrap}
        .gelados .body{grid-template-rows:1.08fr .66fr auto}
        .gelados .hero h1{font-size:clamp(23px,3.7vh,33px);line-height:.88}
        .gelados .hero-copy,.potes .hero-copy{max-width:90%}
        .picitem b{font-size:clamp(18px,2.45vh,26px);white-space:nowrap}
        @media(max-width:390px){
          .hero h1{font-size:clamp(23px,3.75vh,33px)}
          .bat .hero h1,.gelados .hero h1{font-size:clamp(21px,3.4vh,30px)}
          .bigprice strong{font-size:clamp(24px,3.8vh,34px)}
          .prod .money{font-size:clamp(17px,2.2vh,23px)}
        }
      `;
    } else {
      style.textContent = `
        .head{font-size:clamp(9.8px,1.23vh,12.6px);line-height:1.08}
        .price{font-size:clamp(9.3px,1.1vh,11.7px)}
        .price strong{white-space:nowrap}
      `;
    }

    document.head.appendChild(style);
    document.documentElement.dataset.cardapioPolish = '20260904';
  };

  const run = () => {
    formatCurrency();
    installPolish();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
