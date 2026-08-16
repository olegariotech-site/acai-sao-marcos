from pathlib import Path

path = Path('assets/css/mobile-fixes.css')
css = path.read_text(encoding='utf-8')

old = """.modal-media [data-modal-media]:not([hidden]) {
  display: block;
  visibility: visible;
}
"""
new = """/* A mídia só pode forçar visibilidade quando o modal estiver realmente aberto. */
.product-modal.open .modal-media [data-modal-media]:not([hidden]) {
  display: block;
  visibility: visible;
}

/* Modal fechado nunca pode virar uma camada invisível sobre os cliques da página. */
.product-modal[aria-hidden='true'],
.product-modal:not(.open) {
  pointer-events: none !important;
}

.product-modal.open[aria-hidden='false'] {
  pointer-events: auto;
}
"""

if old not in css:
    raise SystemExit('Regra de mídia do modal não encontrada em mobile-fixes.css')

path.write_text(css.replace(old, new, 1), encoding='utf-8')
print('Modal fechado agora ignora pointer events; visibilidade da mídia ficou restrita ao estado aberto.')
