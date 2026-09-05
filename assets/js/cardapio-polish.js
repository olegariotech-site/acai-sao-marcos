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

  const addHeroProductImages = () => {
    if (!isCardapio) return;
    const items = [
      ['.acai .hero', '/assets/img/produtos/acai/acai-trufado-frutas-crocante-hero-960.webp', 'Açaí montado com frutas e acompanhamentos'],
      ['.milk .hero', '/assets/img/produto-milkshake-sabores-960.webp', 'Milk-shakes do Açaí do Dudu'],
      ['.bat .hero', '/assets/img/produtos/acai/acai-origem-garrafas-960.webp', 'Batidão de açaí em garrafas']
    ];

    items.forEach(([selector, src, alt]) => {
      const hero = document.querySelector(selector);
      if (!hero || hero.querySelector('.hero-product')) return;
      const img = document.createElement('img');
      img.className = 'hero-product';
      img.src = src;
      img.alt = alt;
      img.decoding = 'async';
      hero.appendChild(img);
    });
  };

  const installPolish = () => {
    if (document.getElementById('ot-cardapio-polish-style')) return;
    const style = document.createElement('style');
    style.id = 'ot-cardapio-polish-style';

    if (isCardapio) {
      style.textContent = `
        .sheet{grid-template-rows:16.5% minmax(0,1fr)}
        .hero{padding-top:calc(var(--safeT) + 43px);padding-bottom:10px}
        .logo{left:14px;bottom:5px;width:36px;height:36px}
        .hero-copy{padding-left:44px;max-width:88%}
        .hero h1{font-size:clamp(25px,4.05vh,36px)}
        .topbar{top:calc(var(--safeT) + 3px)}
        .chip{min-height:28px;padding:5px 10px;font-size:10.5px}
        .head{font-size:clamp(10.2px,1.28vh,13.2px);line-height:1.05}
        .price{padding:1px 0;font-size:clamp(9.8px,1.16vh,12.2px);line-height:1.12}
        .price strong{font-size:.96em;white-space:nowrap}

        .hero-product{position:absolute;z-index:2;right:14px;bottom:14px;width:82px;height:82px;object-fit:cover;object-position:center;border-radius:18px;border:2px solid rgba(255,210,31,.92);box-shadow:0 8px 20px #0007;background:#2a0430}
        .acai .hero-copy,.milk .hero-copy,.bat .hero-copy{max-width:67%}

        .acai .body{grid-template-rows:1.02fr 1fr .76fr .64fr auto auto}
        .acai .grid2:first-child .panel:first-child .inside{padding-top:3px;padding-bottom:3px}
        .acai .grid2:first-child .panel:first-child .price{line-height:1.05}

        .trio .body{grid-template-rows:1.50fr 1.00fr .58fr auto}
        .trio-top{grid-template-columns:minmax(0,1.12fr) minmax(128px,.88fr);gap:8px;align-items:stretch}
        .trio video{width:100%;height:100%;object-fit:contain!important;object-position:center center!important;background:#210129;display:block;border-radius:13px;border:1.6px solid #6b1778}
        .trio .tags.dense .tag{font-size:clamp(7.6px,.90vh,9.2px);padding:2px 4px}
        .bigprice{justify-content:flex-start!important;padding:12px 10px 8px!important;gap:5px;overflow:hidden}
        .bigprice small{font-size:10.2px}
        .bigprice strong{font-size:clamp(23px,3.65vh,34px)!important;line-height:.92;white-space:nowrap}
        .bigprice p{margin:0!important;font-size:clamp(8px,.96vh,10px)!important;line-height:1.14}

        .bat .body{grid-template-rows:.76fr .83fr .70fr auto}
        .bat .hero h1{font-size:clamp(22px,3.45vh,31px);line-height:.88}
        .prod .money{font-size:clamp(18px,2.35vh,25px);white-space:nowrap}
        .gelados .body{grid-template-rows:1.08fr .66fr auto}
        .gelados .hero h1{font-size:clamp(23px,3.7vh,33px);line-height:.88}
        .gelados .hero-copy,.potes .hero-copy{max-width:90%}
        .picitem b{font-size:clamp(18px,2.45vh,26px);white-space:nowrap}

        @media(max-width:390px){
          .hero h1{font-size:clamp(22px,3.55vh,32px)}
          .hero-product{right:10px;bottom:12px;width:68px;height:68px;border-radius:15px}
          .acai .hero-copy,.milk .hero-copy,.bat .hero-copy{max-width:69%}
          .bat .hero h1,.gelados .hero h1{font-size:clamp(20px,3.15vh,28px)}
          .trio .body{grid-template-rows:1.46fr 1.02fr .58fr auto}
          .trio-top{grid-template-columns:minmax(0,1.15fr) minmax(116px,.85fr);gap:6px}
          .bigprice strong{font-size:clamp(21px,3.25vh,30px)!important}
          .bigprice{padding:10px 7px 7px!important}
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
    document.documentElement.dataset.cardapioPolish = '20260905-produtos-visuais-final';
  };

  const run = () => {
    formatCurrency();
    addHeroProductImages();
    installPolish();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
