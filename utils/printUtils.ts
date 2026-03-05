/**
 * printUtils.ts — Impressão confiável de PDFs e imagens no browser.
 *
 * PROBLEMA RAIZ (documentado para futuros mantenedores):
 * ──────────────────────────────────────────────────────
 * 1. cross-window `win.print()` — Chrome bloqueia chamadas de print entre janelas distintas.
 * 2. iframe invisível (`visibility:hidden`, 1x1px) — o plugin PDF do Chrome NÃO renderiza
 *    conteúdo em elementos ocultos; chamadas de print resultam em página em branco.
 * 3. HTML wrapper com iframe → `window.print()` — captura apenas "100vh" do iframe,
 *    cortando PDFs com mais de uma tela de altura.
 *
 * SOLUÇÃO CORRETA:
 * ────────────────
 * • Criar um overlay VISÍVEL e FULL-SCREEN com `<iframe>` no próprio documento.
 * • Chamar `iframe.contentWindow.print()` (mesmo-origin, dentro do contexto do Chrome PDF viewer).
 * • O Chrome PDF viewer intercepta esse print() e imprime TODAS as páginas corretamente.
 * • Após o print, o overlay é removido via evento `afterprint`.
 */

const OVERLAY_ID = '__pdf-print-overlay';
const STYLE_ID = '__pdf-print-style';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Injeta uma regra @media print que oculta tudo exceto o overlay de impressão. */
function injectPrintStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @media print {
      body > *:not(#${OVERLAY_ID}) { display: none !important; visibility: hidden !important; }
      #${OVERLAY_ID} {
        display: block !important;
        visibility: visible !important;
        position: fixed !important;
        inset: 0;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 2147483647 !important;
        background: white !important;
      }
      #${OVERLAY_ID} iframe {
        width: 100% !important;
        height: 100% !important;
        border: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

/** Remove o overlay de impressão do DOM. */
function removeOverlay(): void {
  document.getElementById(OVERLAY_ID)?.remove();
}

/** Converte um data URL base64 em um Blob URL. */
function dataUrlToBlobUrl(dataUrl: string): string {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'application/pdf';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

// ─── Core: PDF printing via visible overlay iframe ───────────────────────────

/**
 * Abre um overlay full-screen com o PDF e chama iframe.contentWindow.print().
 * O Chrome PDF viewer intercepta esse print() e gera a impressão completa de todas as páginas.
 */
function printPDFSrc(src: string): void {
  injectPrintStyle();
  removeOverlay();

  // ── Overlay ──────────────────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'width:100%',
    'height:100%',
    'z-index:2147483647',
    'background:rgba(82,86,89,0.95)',
    'display:flex',
    'align-items:center',
    'justify-content:center',
  ].join(';');

  // ── Spinner de carregamento ───────────────────────────────────────────────
  const spinner = document.createElement('div');
  spinner.style.cssText = [
    'position:absolute',
    'top:50%',
    'left:50%',
    'transform:translate(-50%,-50%)',
    'color:white',
    'font-family:sans-serif',
    'font-size:14px',
    'letter-spacing:.05em',
    'text-align:center',
  ].join(';');
  spinner.innerHTML = `
    <svg style="display:block;margin:0 auto 12px" width="40" height="40" viewBox="0 0 50 50">
      <circle cx="25" cy="25" r="20" fill="none" stroke="white" stroke-width="4"
        stroke-dasharray="31.4 94.2" stroke-linecap="round">
        <animateTransform attributeName="transform" type="rotate" dur="1s" repeatCount="indefinite" from="0 25 25" to="360 25 25"/>
      </circle>
    </svg>
    Preparando impressão…
  `;
  overlay.appendChild(spinner);

  // ── Botão fechar ──────────────────────────────────────────────────────────
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.title = 'Fechar';
  closeBtn.style.cssText = [
    'position:absolute',
    'top:12px',
    'right:16px',
    'background:rgba(255,255,255,.15)',
    'color:white',
    'border:none',
    'border-radius:50%',
    'width:36px',
    'height:36px',
    'font-size:16px',
    'cursor:pointer',
    'z-index:1',
  ].join(';');
  closeBtn.onclick = removeOverlay;
  overlay.appendChild(closeBtn);

  // ── iframe ────────────────────────────────────────────────────────────────
  const iframe = document.createElement('iframe');
  // iframe deve ser VISÍVEL com dimensões REAIS para o Chrome PDF viewer renderizar
  iframe.style.cssText = [
    'position:absolute',
    'inset:0',
    'width:100%',
    'height:100%',
    'border:none',
    'opacity:0',               // começa invisível; fica visível após o load
    'transition:opacity .3s',
  ].join(';');
  iframe.src = src;
  overlay.appendChild(iframe);

  document.body.appendChild(overlay);

  // ── Lógica de disparo de impressão ────────────────────────────────────────
  let fired = false;

  const triggerPrint = () => {
    if (fired) return;
    fired = true;

    // Mostra o PDF antes de imprimir (boa UX)
    iframe.style.opacity = '1';
    spinner.style.display = 'none';

    setTimeout(() => {
      try {
        // ✅ Mesmo-origin → Chrome PDF viewer intercepta e imprime todas as páginas
        iframe.contentWindow?.print();
      } catch {
        // Fallback: imprime a página atual (mostra só o overlay via @media print CSS)
        window.print();
      }
    }, 600);
  };

  // Tenta disparar após onload do iframe
  iframe.addEventListener('load', () => setTimeout(triggerPrint, 500));

  // Fallback: dispara após 4 s mesmo que onload não dispare (comum no PDF plugin)
  setTimeout(triggerPrint, 4000);

  // Remove overlay após a impressão
  window.addEventListener('afterprint', removeOverlay, { once: true });

  // Segurança: remove após 60 s
  setTimeout(removeOverlay, 60_000);
}

// ─── Image printing ──────────────────────────────────────────────────────────

function printImageSrc(src: string): void {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Popup bloqueado! Permita popups para este site.');
    return;
  }
  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>Impressão</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{display:flex;justify-content:center;background:white}
  img{max-width:100%;height:auto;display:block}
  @media print{body{margin:0}img{max-width:100%;page-break-inside:avoid}}
</style></head>
<body>
  <img src="${src}"
    onload="setTimeout(function(){window.print()},400)"
    onerror="document.body.innerHTML='<p style=padding:2rem>Erro ao carregar.</p>'"
  />
</body></html>`);
  win.document.close();
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Imprime um arquivo PDF ou imagem.
 * Aceita data URLs (base64) e URLs normais.
 */
export function printFile(url: string): void {
  if (!url) return;

  const isImage =
    url.startsWith('data:image/') ||
    /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);

  if (isImage) {
    printImageSrc(url);
    return;
  }

  // PDF ou binário desconhecido
  let blobUrl: string | null = null;
  try {
    if (url.startsWith('data:')) {
      blobUrl = dataUrlToBlobUrl(url);
      printPDFSrc(blobUrl);
      // Revoga após 60 s (tempo suficiente para o print dialog abrir)
      setTimeout(() => URL.revokeObjectURL(blobUrl as string), 60_000);
    } else {
      printPDFSrc(url);
    }
  } catch (err) {
    console.error('[printFile]', err);
    window.open(url, '_blank'); // último fallback
  }
}
