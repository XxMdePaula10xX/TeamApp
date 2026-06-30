# Ícones do app

Coloque a arte-fonte aqui e gere os tamanhos com uma ferramenta — você
**não** precisa redimensionar à mão.

## 1. Salve a arte-fonte
- **`assets/icon.png`** — 1024×1024, quadrado, **fundo sólido** (sem transparência).
  É a imagem que o Matheus gerou (bola + energia verde + seta de crescimento).
- *(opcional)* **`assets/splash.png`** — 2732×2732, logo centralizado em fundo
  sólido (para a tela de abertura no app nativo).

## 2. Gerar os ícones nativos (Android/iOS)
Depois de ter os projetos nativos (`npx cap add android` / `npx cap add ios`):

```bash
npx @capacitor/assets@latest generate
```
Isso preenche os ícones e splash de Android e iOS automaticamente.

## 3. Gerar os ícones da WEB / PWA (o que aparece na aba do navegador)
O `index.html` e o `public/manifest.webmanifest` já esperam estes arquivos em
`public/`:

- `public/icon-192.png` (192×192)
- `public/icon-512.png` (512×512)
- `public/icon-512-maskable.png` (512×512, com ~20% de margem ao redor)
- `public/apple-touch-icon.png` (180×180)
- *(opcional)* `public/favicon.ico`

Duas formas fáceis de produzi-los a partir do `icon.png` 1024:

- **Opção A — site:** suba o `icon.png` em https://favicon.io ou
  https://realfavicongenerator.net, baixe o pacote e copie os arquivos para
  `public/` com os nomes acima.
- **Opção B — Capacitor assets (PWA):**
  ```bash
  npx @capacitor/assets@latest generate --pwaManifestPath public/manifest.webmanifest
  ```
  e ajuste os nomes em `public/` para os esperados acima, se necessário.

> Enquanto esses PNG não existirem, o app usa o `public/favicon.svg` como
> fallback — nada quebra.
