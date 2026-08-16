from pathlib import Path
import re

site_path = Path('assets/js/site-v2.js')
mobile_path = Path('assets/js/mobile-fixes.js')
html_path = Path('index.html')
workflow_path = Path('.github/workflows/media-paths.yml')

site = site_path.read_text(encoding='utf-8')

# O script principal passa a ser o único dono da seleção de categoria + rolagem.
anchor = "  updateHeader();\n  window.addEventListener('scroll', updateHeader, { passive: true });\n\n  const renderCategories = () => {"
if anchor not in site:
    raise SystemExit('Âncora de renderCategories não encontrada em site-v2.js')

helpers = """  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  const afterPaint = (callback) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(callback));
  };

  const centerActiveCategory = () => {
    const button = elements.categoryRail?.querySelector('.category-button.active');
    if (!(button instanceof HTMLElement) || !(elements.categoryRail instanceof HTMLElement)) return;
    const left = button.offsetLeft - ((elements.categoryRail.clientWidth - button.offsetWidth) / 2);
    elements.categoryRail.scrollTo({
      left: Math.max(0, left),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
  };

  const scrollToActiveProducts = () => {
    const firstCard = elements.productGrid?.querySelector('[data-product-id]');
    const target = firstCard || elements.productGrid || document.querySelector('#cardapio');
    if (!(target instanceof HTMLElement)) return;

    const headerHeight = elements.header?.getBoundingClientRect().height || 78;
    const categoryHeight = document.querySelector('.category-rail-wrap')?.getBoundingClientRect().height || 60;
    const offset = headerHeight + Math.min(categoryHeight, 72) + 28;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);

    window.scrollTo({
      top,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
  };

  const selectCategory = (categoryId, { scroll = true } = {}) => {
    if (!state.catalog || !categoryId) return false;
    if (!state.catalog.categories.some((category) => category.id === categoryId)) return false;

    state.activeCategory = categoryId;
    renderCategories();
    renderProducts();
    track('catalog_category_select', { category: state.activeCategory });

    if (scroll) {
      afterPaint(() => {
        centerActiveCategory();
        scrollToActiveProducts();
      });
    }
    return true;
  };

  const renderCategories = () => {"""
site = site.replace(anchor, helpers, 1)

pattern = re.compile(
    r"  const renderCategories = \(\) => \{.*?\n  \};\n\n  const getVisibleProducts =",
    re.S,
)
replacement = """  const renderCategories = () => {
    if (!state.catalog || !elements.categoryRail) return;

    elements.categoryRail.innerHTML = state.catalog.categories.map((category) => `
      <button
        type=\"button\"
        class=\"category-button${category.id === state.activeCategory ? ' active' : ''}\"
        data-category=\"${escapeHTML(category.id)}\"
        aria-pressed=\"${category.id === state.activeCategory}\"
        ${category.id === state.activeCategory ? 'aria-current=\"true\"' : ''}
      >${escapeHTML(category.label)}</button>
    `).join('');
  };

  elements.categoryRail?.addEventListener('click', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('.category-button[data-category]')
      : null;
    if (!(button instanceof HTMLButtonElement) || !elements.categoryRail?.contains(button)) return;
    selectCategory(button.dataset.category);
  });

  const getVisibleProducts ="""
site, count = pattern.subn(replacement, site, count=1)
if count != 1:
    raise SystemExit(f'Falha ao substituir renderCategories: {count}')

site = site.replace(
    "target.scrollIntoView({ behavior: 'smooth', block: 'start' });",
    "target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });",
    1,
)
site_path.write_text(site, encoding='utf-8')

mobile = mobile_path.read_text(encoding='utf-8')

# Remove segunda camada de pós-clique de categoria. Quick links continuam chamando button.click().
mobile = re.sub(
    r"\n  const afterPaint = \(callback\) => \{\n    window\.requestAnimationFrame\(\(\) => window\.requestAnimationFrame\(callback\)\);\n  \};\n",
    "\n",
    mobile,
    count=1,
)
mobile = re.sub(
    r"\n  const centerCategoryButton = \(button\) => \{.*?\n  \};\n",
    "\n",
    mobile,
    count=1,
    flags=re.S,
)

activate_pattern = re.compile(
    r"  const activateCategory = \(categoryId, \{ scroll = true \} = \{\}\) => \{.*?\n  \};",
    re.S,
)
activate_replacement = """  const activateCategory = (categoryId, { scroll = true } = {}) => {
    const button = getCategoryButton(categoryId);
    if (!(button instanceof HTMLElement)) {
      if (scroll) document.querySelector('#cardapio')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      return false;
    }

    // site-v2.js é o único responsável por renderizar e posicionar o grid.
    button.click();
    return true;
  };"""
mobile, count = activate_pattern.subn(activate_replacement, mobile, count=1)
if count != 1:
    raise SystemExit(f'Falha ao simplificar activateCategory: {count}')

mobile, count = re.subn(
    r"\n  const installCategoryRouting = \(\) => \{.*?\n  \};\n\n  const installSergelRouting",
    "\n\n  const installSergelRouting",
    mobile,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit(f'Falha ao remover installCategoryRouting: {count}')

mobile = mobile.replace("    installCategoryRouting();\n", "", 1)
mobile_path.write_text(mobile, encoding='utf-8')

html = html_path.read_text(encoding='utf-8')
html = html.replace('assets/js/site-v2.js?v=20260816-webp-1', 'assets/js/site-v2.js?v=20260816-navfix-1')
html = html.replace('assets/js/mobile-fixes.js?v=20260816-webp-1', 'assets/js/mobile-fixes.js?v=20260816-navfix-1')
html_path.write_text(html, encoding='utf-8')

workflow = workflow_path.read_text(encoding='utf-8')
if 'browser-navigation:' not in workflow:
    workflow += """

  browser-navigation:
    runs-on: ubuntu-latest
    timeout-minutes: 8
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configurar Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Instalar Chromium para teste real
        run: |
          npm install --no-save playwright@1.55.0
          npx playwright install --with-deps chromium

      - name: Validar cliques em notebook e mobile
        run: node tools/check-browser-navigation.mjs
"""
workflow_path.write_text(workflow, encoding='utf-8')

print('Correção de navegação aplicada: categoria, quick links, cache-bust e E2E.')
