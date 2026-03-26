/* ============================================
   PositronPharma — Documentos Flipbook
   ============================================ */

if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const pdfInput = document.getElementById('pdfInput');
const uploadZone = document.getElementById('uploadZone');
const heroUpload = document.getElementById('heroUpload');
const flipbookViewer = document.getElementById('flipbookViewer');
const flipbookStage = document.getElementById('flipbookStage');
const fbPrev = document.getElementById('fbPrev');
const fbNext = document.getElementById('fbNext');
const fbFullscreen = document.getElementById('fbFullscreen');
const fbNewFile = document.getElementById('fbNewFile');
const fbClose = document.getElementById('fbClose');
const fbPageInfo = document.getElementById('fbPageInfo');

let pageImages = [];
let totalPages = 0;
let flipBook = null;
let isProcessing = false;

// ===== Header scroll =====
const header = document.getElementById('header');
window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 20), { passive: true });

// ===== Mobile menu =====
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');
const overlay = document.getElementById('navOverlay');
const closeMenu = () => { hamburger.classList.remove('active'); nav.classList.remove('open'); overlay.classList.remove('active'); document.body.style.overflow = ''; };
hamburger.addEventListener('click', () => nav.classList.contains('open') ? closeMenu() : (hamburger.classList.add('active'), nav.classList.add('open'), overlay.classList.add('active'), document.body.style.overflow = 'hidden'));
overlay.addEventListener('click', closeMenu);
nav.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', closeMenu));

// ===== Upload Zone =====
if (uploadZone) {
    uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', e => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') handlePDFFile(file);
        else showNotification('Por favor, sube un archivo PDF.');
    });
    uploadZone.addEventListener('click', e => {
        if (e.target !== pdfInput && !e.target.closest('.upload-btn')) pdfInput.click();
    });
}

if (pdfInput) {
    pdfInput.addEventListener('click', function() { this.value = null; });
    pdfInput.addEventListener('change', function() {
        if (this.files && this.files[0]) handlePDFFile(this.files[0]);
    });
}

// ===== Handle PDF =====
async function handlePDFFile(file) {
    if (isProcessing) return;
    isProcessing = true;
    showProgress(0, 'Leyendo archivo...');

    try {
        const ab = await file.arrayBuffer();
        showProgress(5, 'Procesando PDF...');

        const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
        totalPages = pdf.numPages;
        pageImages = [];

        for (let i = 1; i <= totalPages; i++) {
            const pct = Math.round(5 + (i / totalPages) * 90);
            showProgress(pct, `Renderizando página ${i} de ${totalPages}...`);

            const page = await pdf.getPage(i);
            const scale = 2;
            const vp = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = vp.width;
            canvas.height = vp.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
            pageImages.push(canvas.toDataURL('image/jpeg', 0.90));
        }

        showProgress(98, 'Preparando revista...');
        pdf.destroy();
        hideProgress();
        openFlipbook();
    } catch (err) {
        hideProgress();
        console.error('Error loading PDF:', err);
        showNotification('Error al cargar el PDF. Verifica que sea un archivo válido.');
    }
    isProcessing = false;
}

// ===== Open Flipbook =====
function openFlipbook() {
    heroUpload.classList.add('hidden');
    heroUpload.style.display = 'none';
    flipbookViewer.classList.add('active');
    document.getElementById('flipbook').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => initPageFlip(), 600);
}

// ===== Init PageFlip =====
function initPageFlip() {
    destroyFlipbook();
    const stage = document.getElementById('flipbookStage');
    stage.innerHTML = '<div id="flipbookContainer"></div>';
    const rect = flipbookStage.getBoundingClientRect();
    if (rect.width < 100 || rect.height < 100) { setTimeout(() => initPageFlip(), 300); return; }
    if (!pageImages.length) return;

    const testImg = new Image();
    testImg.src = pageImages[0];
    testImg.onload = function() {
        const pageRatio = testImg.naturalHeight / testImg.naturalWidth;
        const availW = rect.width - 60;
        const availH = rect.height - 60;
        let pageW = Math.min(availW / 2, 480);
        let pageH = pageW * pageRatio;
        if (pageH > availH) { pageH = availH; pageW = pageH / pageRatio; }
        pageW = Math.max(Math.floor(pageW), 150);
        pageH = Math.max(Math.floor(pageH), 200);
        const pagesNeeded = totalPages % 2 !== 0 ? totalPages + 1 : totalPages;
        const container = document.getElementById('flipbookContainer');

        for (let i = 0; i < pagesNeeded; i++) {
            const div = document.createElement('div');
            div.className = 'flip-page';
            div.setAttribute('data-density', 'soft');
            div.style.width = pageW + 'px';
            div.style.height = pageH + 'px';
            if (i < totalPages && pageImages[i]) {
                const img = document.createElement('img');
                img.src = pageImages[i];
                img.style.cssText = 'width:100%;height:100%;display:block;object-fit:fill;pointer-events:none';
                div.appendChild(img);
            } else { div.classList.add('flip-page-blank'); }
            container.appendChild(div);
        }

        try {
            flipBook = new St.PageFlip(container, {
                width: pageW, height: pageH, size: 'stretch',
                minWidth: 150, maxWidth: 900, minHeight: 200, maxHeight: 1200,
                showCover: false, mobileScrollSupport: false,
                maxShadowOpacity: 0.5, drawShadow: true, flippingTime: 700,
                usePortrait: true, startZIndex: 0, autoSize: true, startPage: 0,
                clickEventForward: true, useMouseEvents: true, swipeDistance: 30, showPageCorners: true,
            });
            flipBook.loadFromHTML(container.querySelectorAll('.flip-page'));
            flipBook.on('flip', e => updatePageInfo(e.data));
            updatePageInfo(0);
        } catch (err) {
            console.error('PageFlip init error:', err);
            showNotification('Error al crear la revista. Intenta de nuevo.');
        }
    };
    testImg.onerror = () => showNotification('Error al procesar las páginas.');
}

function destroyFlipbook() {
    if (flipBook) { try { flipBook.destroy(); } catch(e) {} flipBook = null; }
}

function updatePageInfo(currentPage) {
    if (!flipBook) return;
    const c = typeof currentPage === 'number' ? currentPage : flipBook.getCurrentPageIndex();
    try {
        const o = flipBook.getOrientation();
        if (o === 'landscape') {
            const l = c + 1, r = Math.min(c + 2, totalPages);
            fbPageInfo.textContent = (l >= totalPages || l === r)
                ? `Página ${Math.min(l, totalPages)} de ${totalPages}`
                : `Páginas ${l}-${r} de ${totalPages}`;
        } else { fbPageInfo.textContent = `Página ${Math.min(c + 1, totalPages)} de ${totalPages}`; }
    } catch(e) { fbPageInfo.textContent = `Página ${c + 1} de ${totalPages}`; }
}

// ===== Navigation =====
if (fbPrev) fbPrev.addEventListener('click', () => { if (flipBook) flipBook.flipPrev(); });
if (fbNext) fbNext.addEventListener('click', () => { if (flipBook) flipBook.flipNext(); });

document.addEventListener('keydown', e => {
    if (!flipBook || !flipbookViewer.classList.contains('active')) return;
    if (e.key === 'ArrowLeft') flipBook.flipPrev();
    else if (e.key === 'ArrowRight') flipBook.flipNext();
    else if (e.key === 'Escape') {
        if (flipbookViewer.classList.contains('fullscreen')) toggleFullscreen();
        else closeFlipbook();
    }
});

// ===== Fullscreen =====
function toggleFullscreen() {
    const isGoingFull = !flipbookViewer.classList.contains('fullscreen');
    flipbookViewer.classList.toggle('fullscreen');
    document.body.style.overflow = isGoingFull ? 'hidden' : '';
    if (pageImages.length) setTimeout(() => initPageFlip(), 400);
}
if (fbFullscreen) fbFullscreen.addEventListener('click', toggleFullscreen);

// ===== Close =====
function closeFlipbook() {
    if (flipBook) { try { flipBook.destroy(); } catch(e) {} flipBook = null; }
    const stage = document.getElementById('flipbookStage');
    if (stage) stage.innerHTML = '<div id="flipbookContainer"></div>';
    flipbookViewer.classList.remove('active', 'fullscreen');
    heroUpload.classList.remove('hidden');
    heroUpload.style.display = '';
    document.body.style.overflow = '';
    pageImages = [];
    totalPages = 0;
    setTimeout(() => document.getElementById('flipbook').scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}
if (fbNewFile) fbNewFile.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); closeFlipbook(); });
if (fbClose) fbClose.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); closeFlipbook(); });

// ===== Resize =====
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (flipBook && flipbookViewer.classList.contains('active') && pageImages.length) initPageFlip();
    }, 300);
});

// ===== Progress =====
function showProgress(pct, text) {
    const circumference = 339.292;
    const offset = circumference - (pct / 100) * circumference;
    let ov = document.getElementById('progressOverlay');
    if (!ov) {
        ov = document.createElement('div');
        ov.id = 'progressOverlay';
        ov.innerHTML = `<div class="progress-box"><div class="progress-ring-wrap"><svg class="progress-ring" viewBox="0 0 120 120"><circle class="progress-ring-bg" cx="60" cy="60" r="54"/><circle class="progress-ring-fill" id="progressRing" cx="60" cy="60" r="54" style="stroke-dashoffset:${offset}"/></svg><div class="progress-ring-pct" id="progressPct">${pct}%</div></div><div class="progress-text" id="progressText">${text}</div><div class="progress-dots"><span></span><span></span><span></span></div></div>`;
        document.body.appendChild(ov);
    } else {
        const ring = document.getElementById('progressRing');
        const pctEl = document.getElementById('progressPct');
        const textEl = document.getElementById('progressText');
        if (ring) ring.style.strokeDashoffset = offset;
        if (pctEl) pctEl.textContent = pct + '%';
        if (textEl) textEl.textContent = text;
    }
}
function hideProgress() {
    const ov = document.getElementById('progressOverlay');
    if (ov) { ov.style.opacity = '0'; ov.style.transition = 'opacity .3s'; setTimeout(() => ov.remove(), 300); }
}

// ===== Notification =====
function showNotification(msg) {
    const n = document.createElement('div');
    n.className = 'doc-notification';
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => { n.style.opacity = '0'; n.style.transition = 'opacity .3s'; setTimeout(() => n.remove(), 300); }, 3000);
}

// ===== Smooth scroll =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const t = document.querySelector(a.getAttribute('href'));
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
    });
});
