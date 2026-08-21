# Açaí do Dudu

Site institucional e comercial do Açaí do Dudu, no bairro São Marcos, em Valinhos/SP.

## Produção

- Site oficial: https://acaidodudu.com.br/
- Publicação: GitHub Pages
- Branch de produção: `main`
- Domínio customizado: definido em `CNAME`

## Dados principais

- Nome: Açaí do Dudu
- Assinatura: Açaí e Sorvetes
- WhatsApp: (19) 99128-8849
- Endereço: Rua Claudemires dos Santos, nº 86 — São Marcos, Valinhos/SP
- CEP: 13272-821
- Instagram: https://www.instagram.com/acaisaomarcos
- Facebook: https://www.facebook.com/profile.php?id=61574657775118

## Estrutura principal

```txt
.
├── index.html
├── privacidade.html
├── data/
│   └── products.json
├── assets/
│   ├── css/
│   │   ├── site-v2.css
│   │   ├── mobile-fixes.css
│   │   └── sergel-premium.css
│   ├── js/
│   │   ├── site-v2.js
│   │   ├── mobile-fixes.js
│   │   └── analytics-consent.js
│   ├── img/
│   └── video/
├── tools/
│   ├── check-media-paths.mjs
│   ├── check-interactions.mjs
│   ├── check-social-preview.mjs
│   └── check-browser-navigation.mjs
├── robots.txt
├── sitemap.xml
└── CNAME
```

## Responsividade e compatibilidade

O front-end possui regras específicas para desktop/notebook e dispositivos touch, incluindo:

- breakpoints responsivos para cards, navegação, modal e galeria;
- `100dvh` e safe areas para Safari/iOS;
- tratamento de `pointer: coarse`, `hover: none` e touch;
- CTAs flutuantes compactos em Android/iOS;
- fallback de imagens e vídeos;
- redução de movimento quando o sistema solicita `prefers-reduced-motion`;
- smoke test automatizado em Chromium desktop, perfil Android Chrome e WebKit com perfil iOS.

## Segurança e privacidade

O projeto é estático e não possui backend, login, banco de dados ou processamento de pagamentos. A superfície de ataque é reduzida, mas o repositório mantém hardening adicional:

- CodeQL para JavaScript em push, pull request e execução agendada;
- Dependabot para GitHub Actions;
- `.gitignore` bloqueando arquivos comuns de segredos e chaves;
- validação de links externos com `rel="noopener"`;
- conteúdo dinâmico do catálogo escapado antes de inserção em HTML;
- proteção contra modal invisível interceptando cliques;
- Google Analytics 4 carregado somente após consentimento;
- sinais de publicidade e personalização do GA4 desativados;
- Política de Privacidade pública em `/privacidade.html`.

## Analytics

Google Analytics 4: `G-EET73MQB7L`.

A medição só é ativada após consentimento. Eventos comerciais do site incluem abertura de produto, seleção de categoria e cliques em CTAs/WhatsApp.

## Validações de entrega

O workflow `.github/workflows/media-paths.yml` executa:

1. verificação de sintaxe dos JavaScripts;
2. auditoria de caminhos de mídia e integridade do catálogo;
3. auditoria de links, interações, preços comerciais e regras básicas de segurança;
4. validação da capa de compartilhamento;
5. smoke test real em Chromium desktop, Android Chrome e iOS Safari/WebKit via Playwright.

O workflow `.github/workflows/codeql.yml` executa a análise de segurança JavaScript/TypeScript.

## Publicação no GitHub Pages

Em `Settings > Pages`:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

O arquivo `CNAME` deve permanecer com `acaidodudu.com.br`.

## Regra comercial

Preços e disponibilidade exibidos no site devem refletir a informação mais recente aprovada pelo cliente. Sabores, linhas e estoque podem variar e devem ser confirmados na loja ou pelo WhatsApp.
