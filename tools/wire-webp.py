from pathlib import Path
import json
import re


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Não foi possível localizar {label}')
    return text.replace(old, new, 1)


def main():
    manifest = json.loads(Path('data/image-optimization.json').read_text(encoding='utf-8'))
    mapping = {item['source']: item for item in manifest['assets']}

    catalog_path = Path('data/products.json')
    catalog = json.loads(catalog_path.read_text(encoding='utf-8'))

    for product in catalog.get('products', []):
        original = product.get('imageFallback') or product.get('image')
        item = mapping.get(original)
        if not item:
            continue
        product['imageFallback'] = original
        product['image'] = item['webp']
        product['imageMobile'] = item['mobileWebp']
        product['imageWidth'] = item['width']
        product['imageMobileWidth'] = item['mobileWidth']

    for gallery_item in catalog.get('gallery', []):
        original = gallery_item.get('fallback') or gallery_item.get('src')
        item = mapping.get(original)
        if not item:
            continue
        gallery_item['fallback'] = original
        gallery_item['src'] = item['webp']
        gallery_item['mobileSrc'] = item['mobileWebp']
        gallery_item['width'] = item['width']
        gallery_item['mobileWidth'] = item['mobileWidth']

    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    js_path = Path('assets/js/site-v2.js')
    js = js_path.read_text(encoding='utf-8')

    media_block = r'''  const productImageTemplate = (product, { alt = product.name, className = '', ariaHidden = false } = {}) => {
    const fallback = product.imageFallback || product.image;
    const sourceWidth = Number(product.imageWidth) || 0;
    const mobileWidth = Number(product.imageMobileWidth) || 0;
    const canUseResponsive = product.imageMobile && sourceWidth > 0 && mobileWidth > 0 && mobileWidth < sourceWidth;
    const srcset = canUseResponsive
      ? ` srcset="${escapeHTML(product.imageMobile)} ${mobileWidth}w, ${escapeHTML(product.image)} ${sourceWidth}w" sizes="(max-width: 760px) 92vw, (max-width: 1060px) 48vw, 32vw"`
      : '';
    const classAttr = className ? ` class="${escapeHTML(className)}"` : '';
    const hiddenAttr = ariaHidden ? ' aria-hidden="true"' : '';
    return `<img${classAttr} src="${escapeHTML(product.image)}"${srcset} data-fallback="${escapeHTML(fallback)}" alt="${escapeHTML(alt)}"${hiddenAttr} loading="lazy" decoding="async" />`;
  };

  const productMediaTemplate = (product) => {
    if (product.video) {
      return `
        ${productImageTemplate(product, { alt: '', className: 'product-video-fallback', ariaHidden: true })}
        <video
          src="${escapeHTML(product.video)}"
          poster="${escapeHTML(product.image)}"
          data-fallback="${escapeHTML(product.imageFallback || product.image)}"
          aria-label="Vídeo de ${escapeHTML(product.name)}"
          autoplay
          muted
          loop
          playsinline
          preload="metadata"
          style="width:100%;height:100%;object-fit:cover;opacity:0;"
        ></video>
      `;
    }

    return productImageTemplate(product);
  };'''

    pattern = re.compile(r"  const productMediaTemplate = \(product\) => \{.*?\n  \};\n\n  const productCardTemplate", re.S)
    js, count = pattern.subn(media_block + '\n\n  const productCardTemplate', js, count=1)
    if count == 0 and 'const productImageTemplate = (product' not in js:
        raise SystemExit('Não foi possível substituir productMediaTemplate')

    gallery_block = r'''  const renderGallery = () => {
    if (!state.catalog || !elements.galleryGrid) return;
    elements.galleryGrid.innerHTML = state.catalog.gallery.map((item) => {
      const sourceWidth = Number(item.width) || 0;
      const mobileWidth = Number(item.mobileWidth) || 0;
      const canUseResponsive = item.mobileSrc && sourceWidth > 0 && mobileWidth > 0 && mobileWidth < sourceWidth;
      const srcset = canUseResponsive
        ? ` srcset="${escapeHTML(item.mobileSrc)} ${mobileWidth}w, ${escapeHTML(item.src)} ${sourceWidth}w" sizes="(max-width: 760px) 92vw, 40vw"`
        : '';
      return `
        <figure class="gallery-item" data-reveal>
          <img src="${escapeHTML(item.src)}"${srcset} data-fallback="${escapeHTML(item.fallback || item.src)}" alt="${escapeHTML(item.alt)}" loading="lazy" decoding="async" />
        </figure>
      `;
    }).join('');
    observeReveals(elements.galleryGrid);
  };'''

    pattern = re.compile(r"  const renderGallery = \(\) => \{.*?\n  \};\n\n  const listTemplate", re.S)
    js, count = pattern.subn(gallery_block + '\n\n  const listTemplate', js, count=1)
    if count == 0 and 'const canUseResponsive = item.mobileSrc' not in js:
        raise SystemExit('Não foi possível substituir renderGallery')

    js = js.replace(
        "elements.modalMedia.dataset.fallback = 'assets/assetslogologo-acai-sao-marcos.png?v=20260815-1';",
        "elements.modalMedia.dataset.fallback = product.imageFallback || 'assets/assetslogologo-acai-sao-marcos.png?v=20260815-1';"
    )
    js = js.replace('video.dataset.fallback = product.image;', 'video.dataset.fallback = product.imageFallback || product.image;')
    js = js.replace(
        "    elements.modalMedia.dataset.mediaFallbackStep = '0';\n    elements.modalMedia.hidden = false;\n    elements.modalMedia.src = product.image;",
        "    elements.modalMedia.dataset.mediaFallbackStep = '0';\n    elements.modalMedia.dataset.fallback = product.imageFallback || 'assets/assetslogologo-acai-sao-marcos.png?v=20260815-1';\n    elements.modalMedia.hidden = false;\n    elements.modalMedia.src = product.image;"
    )
    js_path.write_text(js, encoding='utf-8')

    mobile_path = Path('assets/js/mobile-fixes.js')
    mobile = mobile_path.read_text(encoding='utf-8')
    old = "const fallbackSrc = video.getAttribute('poster') || video.dataset.fallback || PRIMARY_FALLBACK;"
    new = "const fallbackSrc = video.dataset.fallback || video.getAttribute('poster') || PRIMARY_FALLBACK;"
    if old in mobile:
        mobile = mobile.replace(old, new, 1)
    elif new not in mobile:
        raise SystemExit('Fallback de vídeo esperado não encontrado')
    mobile_path.write_text(mobile, encoding='utf-8')

    html_path = Path('index.html')
    html = html_path.read_text(encoding='utf-8')

    old_preload = '<link rel="preload" as="image" href="https://acaidodudu.com.br/assets/img/produtos/acai/acai-trufado-frutas-crocante-hero.png?v=20260814-3" fetchpriority="high" />'
    new_preload = '<link rel="preload" as="image" type="image/webp" href="https://acaidodudu.com.br/assets/img/produtos/acai/acai-trufado-frutas-crocante-hero.webp?v=20260816-webp-1" imagesrcset="https://acaidodudu.com.br/assets/img/produtos/acai/acai-trufado-frutas-crocante-hero-960.webp?v=20260816-webp-1 960w, https://acaidodudu.com.br/assets/img/produtos/acai/acai-trufado-frutas-crocante-hero.webp?v=20260816-webp-1 1122w" imagesizes="(max-width: 760px) 92vw, 50vw" fetchpriority="high" />'
    if old_preload in html:
        html = html.replace(old_preload, new_preload, 1)

    old_hero = 'src="assets/img/produtos/acai/acai-trufado-frutas-crocante-hero.png?v=20260814-3"\n              data-fallback="assets/img/hero-copo-acai-morango.png?v=20260814-3"'
    new_hero = 'src="assets/img/produtos/acai/acai-trufado-frutas-crocante-hero.webp?v=20260816-webp-1"\n              srcset="assets/img/produtos/acai/acai-trufado-frutas-crocante-hero-960.webp?v=20260816-webp-1 960w, assets/img/produtos/acai/acai-trufado-frutas-crocante-hero.webp?v=20260816-webp-1 1122w"\n              sizes="(max-width: 760px) 92vw, 50vw"\n              data-fallback="assets/img/produtos/acai/acai-trufado-frutas-crocante-hero.png?v=20260814-3"'
    if old_hero in html:
        html = html.replace(old_hero, new_hero, 1)

    def wire_static_img(text, png, item, sizes):
        webp_marker = f'src="{item["webp"]}"'
        if webp_marker in text:
            return text
        needle = f'src="{png}"'
        replacement = (
            f'src="{item["webp"]}" '
            f'srcset="{item["mobileWebp"]} {item["mobileWidth"]}w, {item["webp"]} {item["width"]}w" '
            f'sizes="{sizes}" data-fallback="{png}"'
        )
        if needle not in text:
            raise SystemExit(f'Imagem estática não encontrada no HTML: {png}')
        return text.replace(needle, replacement, 1)

    static_sizes = {
        'assets/img/produtos/sorvetes/sergel-skimo-85g-sabores-selecionados.png': '(max-width: 760px) 92vw, 30vw',
        'assets/img/produtos/sorvetes/sergel-2l-iogurte-com-amarena.png': '(max-width: 760px) 92vw, 30vw',
        'assets/img/produtos/sorvetes/sergel-2l-chocolate-com-pedacos.png': '(max-width: 760px) 92vw, 30vw',
        'assets/img/produtos/milkshake/trio-acai-e-milkshake-destaque.png': '(max-width: 760px) 92vw, 48vw',
        'assets/img/produtos/adicionais/acompanhamentos-extras-2-reais.png': '(max-width: 760px) 42vw, 22vw',
        'assets/img/fachada/fachada-acai-do-dudu-proposta-ot.png': '(max-width: 760px) 100vw, 62vw',
    }
    for png, sizes in static_sizes.items():
        html = wire_static_img(html, png, mapping[png], sizes)

    html = html.replace('assets/js/site-v2.js?v=20260816-premium-1', 'assets/js/site-v2.js?v=20260816-webp-1')
    html = html.replace('assets/js/mobile-fixes.js?v=20260816-final-audit-1', 'assets/js/mobile-fixes.js?v=20260816-webp-1')
    html_path.write_text(html, encoding='utf-8')


if __name__ == '__main__':
    main()
