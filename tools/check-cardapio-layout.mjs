import { chromium, webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.CARDAPIO_BASE_URL || 'http://127.0.0.1:4174';
const output = process.env.CARDAPIO_SCREENSHOTS || '/tmp/cardapio-qa';
const sizes = [[360,800],[360,740],[390,844],[393,852],[412,915],[430,932],[360,640],[390,664],[1366,768]];
const failures = [];
const names = ['Açaí','Trio do Dudu','Milk-shakes','Batidão','Potes','Picolés e Coco'];
const server = process.env.CARDAPIO_BASE_URL ? null : spawn('python3',['-m','http.server','4174','--bind','127.0.0.1'],{stdio:'ignore'});
await mkdir(output,{recursive:true});
if (server) {
  for (let attempt=0;attempt<50;attempt++) {
    try { if ((await fetch(base)).ok) break; } catch (_) { /* server starting */ }
    await new Promise(resolve=>setTimeout(resolve,100));
  }
}

// Inspect actual text rectangles against every clipping ancestor: checking only
// document.scrollHeight misses text hidden by nested overflow and grid sizing.
const clipping = root => {
  const errors=[];
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()) {
    const node=walker.currentNode;
    if(!node.textContent.trim() || node.parentElement.closest('[hidden],script,style')) continue;
    const range=document.createRange();range.selectNodeContents(node);
    for(const rect of range.getClientRects()) {
      if(!rect.width || !rect.height) continue;
      for(let parent=node.parentElement;parent && parent!==root.parentElement;parent=parent.parentElement) {
        const style=getComputedStyle(parent),box=parent.getBoundingClientRect();
        if (/(hidden|clip|auto|scroll)/.test(style.overflowX) && (rect.left<box.left-2 || rect.right>box.right+2) ||
            /(hidden|clip|auto|scroll)/.test(style.overflowY) && (rect.top<box.top-2 || rect.bottom>box.bottom+2)) {
          errors.push(`${node.textContent.trim()} clipped by .${parent.className}`);break;
        }
      }
    }
  }
  return [...new Set(errors)];
};

try {
  for(const [engine,type] of [['android',chromium],['webkit',webkit]]) {
    const browser=await type.launch({headless:true});
    try {
      for(const [width,height] of sizes) {
        const mobile=width<600;
        const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
        const page=await context.newPage();
        const errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        try {
          await page.goto(`${base}/cardapio/`);
          await page.getByRole('button',{name:'Recusar',exact:true}).click();
          for(let i=0;i<names.length;i++) {
            await page.getByRole('button',{name:names[i],exact:true}).click();
            await page.waitForFunction(i=>Math.abs(document.querySelector('[data-book]').scrollLeft-i*innerWidth)<2,i);
            const card=page.locator('.page').nth(i);
            assert.deepEqual(await card.evaluate(clipping),[],`${engine} ${width}x${height} ${names[i]}`);
            const geometry=await card.evaluate(root=>{
              const overlap=(a,b)=>a.left<b.right && a.right>b.left && a.top<b.bottom && a.bottom>b.top;
              const logo=root.querySelector('.logo').getBoundingClientRect();
              const nav=document.querySelector('.topbar').getBoundingClientRect();
              const copy=root.querySelector('.hero-copy').getBoundingClientRect();
              const img=root.querySelector('.hero-product')?.getBoundingClientRect();
              const money=[...root.querySelectorAll('.price')].some(row=>{
                const a=row.querySelector('span'),b=row.querySelector('strong');
                return a&&b&&overlap(a.getBoundingClientRect(),b.getBoundingClientRect());
              });
              return {overlap:overlap(logo,nav)||overlap(copy,nav)||!!(img&&overlap(copy,img)),money,
                vertical:document.documentElement.scrollHeight>innerHeight+1,
                cardHeight:root.getBoundingClientRect().height};
            });
            assert.equal(geometry.overlap,false,'Header overlap');
            assert.equal(geometry.money,false,'Price overlaps label');
            assert.equal(geometry.vertical,false,'Vertical document overflow');
            assert.ok(geometry.cardHeight<=height+1,'Card exceeds viewport');
            assert.equal(/R\$\s*\d+(?![\d,])/.test(await card.innerText()),false,'Currency missing cents');
            if(i===1) {
              const state=await card.locator('video').evaluate(v=>{
                const box=v.getBoundingClientRect(),frame=v.closest('.trio-top').getBoundingClientRect();
                return {fit:getComputedStyle(v).objectFit,bottom:box.bottom,frameBottom:frame.bottom,muted:v.muted,inline:v.playsInline};
              });
              assert.equal(state.fit,'contain');assert.ok(state.bottom<=state.frameBottom+1);
              assert.equal(state.muted,true);assert.equal(state.inline,true);
              assert.equal(await card.locator('.bigprice strong').innerText(),'R$ 14,00');
            }
            if(width===360 && [640,740].includes(height) || width===390 && height===844) {
              const file=`${engine}-${width}x${height}-card-${i+1}.jpg`;
              const bytes=await page.screenshot({path:`${output}/${file}`,type:'jpeg',quality:65});
              if(process.env.CARDAPIO_LOG_EVIDENCE==='1' && width===360 && height===740) console.log(`QA_IMAGE ${file} ${bytes.toString('base64')}`);
            }
          }
          // Preserve the originating main card while switching catalog categories.
          await page.getByRole('button',{name:'Potes',exact:true}).click();
          await page.getByRole('link',{name:'Ver todos os sabores de potes →',exact:true}).click();
          await page.waitForURL('**/sabores/?from=potes#potes');
          for(const [id,name] of [['dudu','PICOLÉS DUDU'],['sergel','PICOLÉS SERGEL'],['potes','POTES']]) {
            await page.getByRole('link',{name,exact:true}).click();
            await page.waitForFunction(id=>document.querySelector('.categories [aria-current]').hash==='#'+id,id);
            assert.equal(await page.locator('#'+id).isVisible(),true);
            assert.equal(await page.locator('.category:visible').count(),1);
            assert.deepEqual(await page.locator('#'+id).evaluate(clipping),[],`${engine} ${width}x${height} catálogo ${name}`);
            const state=await page.evaluate(()=>({
              overflow:document.documentElement.scrollWidth>innerWidth,
              vertical:document.documentElement.scrollHeight>innerHeight,
              small:[...document.querySelectorAll('.category:not([hidden]) .flavors li')].some(e=>parseFloat(getComputedStyle(e).fontSize)<14),
              targets:[...document.querySelectorAll('.categories a')].every(e=>e.getBoundingClientRect().height>=44),
              h1:document.querySelectorAll('h1').length,
              polish:!!document.querySelector('script[src*="cardapio-polish"]')
            }));
            assert.deepEqual(state,{overflow:false,vertical:true,small:false,targets:true,h1:1,polish:false});
            await page.locator('#'+id+' figure img').scrollIntoViewIfNeeded();
            await page.waitForFunction(id=>{const im=document.querySelector('#'+id+' img');return im.complete&&im.naturalWidth>0;},id);
            await page.evaluate(()=>window.scrollTo(0,0));
            if(width===390 || width===1366) {
              const file=`catalogo-${engine}-${width}x${height}-${id}.jpg`;
              const bytes=await page.screenshot({path:`${output}/${file}`,type:'jpeg',quality:75,fullPage:true});
              if(process.env.CARDAPIO_LOG_EVIDENCE==='1' && height!==664) console.log(`QA_IMAGE ${file} ${bytes.toString('base64')}`);
            }
          }
          assert.equal(await page.getByRole('link',{name:'Como chegar',exact:true}).getAttribute('href'),'https://www.google.com/maps/search/?api=1&query=Rua%20Claudemires%20dos%20Santos%2086%20S%C3%A3o%20Marcos%20Valinhos%20SP');
          assert.ok((await page.getByRole('link',{name:'Consultar disponibilidade',exact:true}).getAttribute('href')).startsWith('https://wa.me/5519991288849?text='));
          await page.getByRole('link',{name:'← Voltar ao cardápio',exact:true}).first().click();
          await page.waitForURL('**/cardapio/#potes');
          await page.waitForFunction(()=>Math.abs(document.querySelector('[data-book]').scrollLeft-4*innerWidth)<2);
          await page.getByRole('button',{name:'Picolés e Coco',exact:true}).click();
          await page.getByRole('link',{name:'Abrir todos os sabores de picolés e potes →',exact:true}).click();
          await page.waitForURL('**/sabores/?from=picoles#dudu');
          await page.getByRole('link',{name:'POTES',exact:true}).click();
          await page.getByRole('link',{name:'← Voltar ao cardápio',exact:true}).first().click();
          await page.waitForURL('**/cardapio/#picoles');
          await page.waitForFunction(()=>Math.abs(document.querySelector('[data-book]').scrollLeft-5*innerWidth)<2);
          for(const id of ['dudu','sergel','potes']) {
            await page.goto(`${base}/sabores/#${id}`);
            await page.waitForFunction(id=>document.querySelector('.categories [aria-current]').hash==='#'+id,id);
            assert.equal(await page.locator('#'+id).isVisible(),true);
          }
          assert.deepEqual(errors,[],'Uncaught page errors');
          console.log(`PASS ${engine} ${width}x${height}: six cards, full video, text bounds, prices, catalog navigation`);
        } catch(error) {
          const bytes=await page.screenshot({path:`${output}/failure-${engine}-${width}x${height}.jpg`,type:'jpeg',quality:65});
          if(process.env.CARDAPIO_LOG_EVIDENCE==='1') console.log(`QA_IMAGE failure-${engine}-${width}x${height}.jpg ${bytes.toString('base64')}`);
          failures.push(`${engine} ${width}x${height}: ${error.message}`);
          console.error(error.message);
        } finally { await context.close(); }
      }

      // Deny programmatic play until an actual click on the fallback button.
      const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
      await context.addInitScript(()=>{
        const original=HTMLMediaElement.prototype.play;
        let allow=false;
        HTMLMediaElement.prototype.play=function(){
          return allow ? original.call(this) : Promise.reject(new DOMException('Autoplay blocked for regression test','NotAllowedError'));
        };
        document.addEventListener('DOMContentLoaded',()=>{
          const v=document.querySelector('.trio video');v?.removeAttribute('autoplay');v?.pause();
        });
        document.addEventListener('click',event=>{if(event.target.closest('.trio-play'))allow=true;},true);
      });
      const page=await context.newPage();
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(`${base}/cardapio/`);
      await page.getByRole('button',{name:'Recusar',exact:true}).click();
      await page.getByRole('button',{name:'Trio do Dudu',exact:true}).click();
      const play=page.getByRole('button',{name:'Reproduzir vídeo do Trio',exact:true});
      await play.waitFor({state:'visible'});await play.click();
      await page.waitForFunction(()=>{const v=document.querySelector('.trio video');return !v.paused&&v.currentTime>0;});
      assert.equal(await play.isVisible(),false);
      await page.getByRole('button',{name:'Milk-shakes',exact:true}).click();
      await page.waitForFunction(()=>document.querySelector('.trio video').paused);
      await page.getByRole('button',{name:'Trio do Dudu',exact:true}).click();
      await page.waitForFunction(()=>!document.querySelector('.trio video').paused);
      assert.deepEqual(errors,[]);console.log(`PASS ${engine}: blocked autoplay fallback, inline playback, pause/resume on card change`);
      await context.close();
    } finally { await browser.close(); }
  }
  assert.deepEqual(failures, [], 'Layout failures');
} finally { server?.kill('SIGTERM'); }
