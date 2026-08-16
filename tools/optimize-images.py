from pathlib import Path
from PIL import Image
import json

TARGETS = [
    'assets/img/produtos/acai/acai-trufado-frutas-crocante-hero.png',
    'assets/img/produtos/agua-de-coco-dudu-hero.png',
    'assets/img/produtos/pote-tradicional-dudu-2l-hero.png',
    'assets/img/produtos/acai/acai-duplo-tropical-destaque.png',
    'assets/img/produtos/milkshake/trio-acai-e-milkshake-destaque.png',
    'assets/img/produto-milkshake-sabores.png',
    'assets/img/produtos/sorvetes/trio-sobremesas-tropicais.png',
    'assets/img/produtos/acai/acai-origem-garrafas.png',
    'assets/img/produtos/sorvetes/cone-supremo-caldas-escorrendo.png',
    'assets/img/produtos/galeria/trio-colorido-sobremesas-especiais.png',
    'assets/img/produtos/galeria/waffle-bowl-acai-granola-uvas.png',
    'assets/img/fachada/fachada-acai-do-dudu-proposta-ot.png',
    'assets/img/produtos/adicionais/acompanhamentos-extras-2-reais.png',
    'assets/img/produtos/sorvetes/sergel-skimo-85g-sabores-selecionados.png',
    'assets/img/produtos/sorvetes/sergel-2l-iogurte-com-amarena.png',
    'assets/img/produtos/sorvetes/sergel-2l-chocolate-com-pedacos.png',
]


def main():
    report = []
    for rel in TARGETS:
        src = Path(rel)
        if not src.exists():
            raise SystemExit(f'Arquivo não encontrado: {rel}')

        with Image.open(src) as original:
            original.load()
            width, height = original.size
            mode = original.mode
            img = original.copy()

        full = src.with_suffix('.webp')
        img.save(full, 'WEBP', quality=89, method=6, exact=True)

        mobile_width = min(960, width)
        if mobile_width < width:
            mobile_height = round(height * mobile_width / width)
            mobile = img.resize((mobile_width, mobile_height), Image.Resampling.LANCZOS)
        else:
            mobile = img.copy()
            mobile_height = height

        mobile_path = src.with_name(f'{src.stem}-960.webp')
        mobile.save(mobile_path, 'WEBP', quality=87, method=6, exact=True)

        png_bytes = src.stat().st_size
        webp_bytes = full.stat().st_size
        mobile_bytes = mobile_path.stat().st_size
        report.append({
            'source': rel,
            'sourceBytes': png_bytes,
            'width': width,
            'height': height,
            'mode': mode,
            'webp': str(full),
            'webpBytes': webp_bytes,
            'mobileWebp': str(mobile_path),
            'mobileWidth': mobile_width,
            'mobileHeight': mobile_height,
            'mobileBytes': mobile_bytes,
            'webpSavingPercent': round((1 - webp_bytes / png_bytes) * 100, 1),
            'mobileSavingPercent': round((1 - mobile_bytes / png_bytes) * 100, 1),
        })

    Path('data/image-optimization.json').write_text(
        json.dumps({'quality': {'desktop': 89, 'mobile': 87}, 'assets': report}, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8'
    )

    total_png = sum(item['sourceBytes'] for item in report)
    total_webp = sum(item['webpBytes'] for item in report)
    total_mobile = sum(item['mobileBytes'] for item in report)
    print(f'PNG selecionados: {total_png / 1024 / 1024:.2f} MB')
    print(f'WebP desktop: {total_webp / 1024 / 1024:.2f} MB')
    print(f'WebP mobile: {total_mobile / 1024 / 1024:.2f} MB')
    print(f'Economia desktop: {(1 - total_webp / total_png) * 100:.1f}%')
    print(f'Economia mobile: {(1 - total_mobile / total_png) * 100:.1f}%')


if __name__ == '__main__':
    main()
