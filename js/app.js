let cameraCount = 0;
let protocolId = null;

// Debounce-timer för autosparning
let _saveTimer = null;
const SAVE_DELAY = 500; // ms

// Max bildstorlek (bredd eller höjd) vid nedskalning
const MAX_IMAGE_DIMENSION = 1200;
const IMAGE_QUALITY = 0.75; // JPEG-kvalitet 0-1

// Antal kontrollpunkter per kamera
const CHECKBOX_COUNT = 10;

// =============================================
// Initiering
// =============================================

window.onload = async () => {
    // Hämta protokoll-ID från URL
    const params = new URLSearchParams(window.location.search);
    protocolId = params.get('id');

    if (!protocolId) {
        window.location.href = 'index.html';
        return;
    }

    // Ladda sparad data
    await loadFromDB();

    // Lyssna på ändringar i projektinfo (sida 1)
    setupProjectAutoSave();

    // Ctrl+S sparar manuellt
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            forceSaveAll();
        }
    });
};

/**
 * Sparar allt direkt (används av Ctrl+S).
 */
function forceSaveAll() {
    clearTimeout(_saveTimer);
    const projectData = collectProjectData();
    saveProtocolInfo(protocolId, projectData);

    const cameras = document.querySelectorAll('#cameras-container .a4-wrapper');
    cameras.forEach(cam => saveCameraFromDOM(cam));

    showSaveIndicator('saved');
}

/**
 * Laddar allt från IndexedDB.
 */
async function loadFromDB() {
    // 1) Ladda projektinfo
    const projectData = await loadProtocolInfo(protocolId);
    if (projectData) {
        restoreProjectFields(projectData);
    }

    // 2) Ladda kameror
    const cameraNumbers = await getSavedCameraNumbers(protocolId);

    if (cameraNumbers.length === 0) {
        // Inga sparade kameror – skapa en tom
        addCamera();
        setTimeout(() => {
            const today = new Date().toISOString().split('T')[0];
            const dateInputs = document.querySelectorAll('input[data-field="date"]');
            if (dateInputs.length > 0) dateInputs[0].value = today;
        }, 100);
    } else {
        for (const num of cameraNumbers) {
            const data = await loadCameraData(protocolId, num);
            addCamera(data, num);
        }
    }
}

// =============================================
// Projektinfo (sida 1)
// =============================================

const PROJECT_FIELDS = ['projectName', 'facilityName', 'address', 'postalCity', 'installer', 'comments'];

function collectProjectData() {
    const data = {};
    for (const field of PROJECT_FIELDS) {
        const el = document.querySelector(`[data-field="${field}"]`);
        if (el) data[field] = el.value;
    }
    return data;
}

function restoreProjectFields(data) {
    for (const field of PROJECT_FIELDS) {
        const el = document.querySelector(`[data-field="${field}"]`);
        if (el && data[field] !== undefined) el.value = data[field];
    }
}

function setupProjectAutoSave() {
    const page1 = document.querySelector('.print-page.a4-wrapper');
    if (!page1) return;

    page1.addEventListener('input', () => {
        scheduleSave(() => {
            const data = collectProjectData();
            saveProtocolInfo(protocolId, data);
        });
    });
}

// =============================================
// Kameror
// =============================================

const CAMERA_FIELDS = ['cameraLabel', 'placement', 'model', 'ip', 'mac', 'rack', 'panel', 'panelPort', 'switchName', 'switchPort', 'notes', 'date', 'signature'];

function addCamera(savedData = null, forcedNumber = null) {
    if (forcedNumber) {
        cameraCount = Math.max(cameraCount, forcedNumber);
    } else {
        cameraCount++;
    }

    const camNumber = forcedNumber || cameraCount;
    const container = document.getElementById('cameras-container');
    const template = document.getElementById('camera-template');

    const clone = template.content.cloneNode(true);
    const cameraDiv = clone.querySelector('.a4-wrapper');
    const camId = `K${camNumber.toString().padStart(2, '0')}`;

    cameraDiv.dataset.cameraNumber = camNumber;

    const labelInput = clone.querySelector('.camera-title');
    if (!savedData || !savedData.cameraLabel) {
        labelInput.value = camId;
    }
    clone.querySelector('.camera-footer-id').textContent = `Kamera: ${labelInput.value || camId}`;
    clone.querySelector('.page-num').textContent = (camNumber + 1).toString();

    // Live-uppdatera footer-texten när beteckningen ändras
    labelInput.addEventListener('input', () => {
        cameraDiv.querySelector('.camera-footer-id').textContent = `Kamera: ${labelInput.value || camId}`;
        scheduleSave(() => saveCameraFromDOM(cameraDiv));
    });

    // Ta bort
    clone.querySelector('.remove-btn').addEventListener('click', () => {
        if (confirm(`Är du säker på att du vill ta bort kamera ${camId}?`)) {
            cameraDiv.remove();
            deleteCameraData(protocolId, camNumber);
        }
    });

    // Kopiera
    clone.querySelector('.copy-btn').addEventListener('click', () => {
        const copyData = collectCameraDataFromDOM(cameraDiv);
        copyData.image = '';
        addCamera(copyData);
        const allCameras = document.querySelectorAll('#cameras-container .a4-wrapper');
        const newest = allCameras[allCameras.length - 1];
        if (newest) newest.scrollIntoView({ behavior: 'smooth', block: 'start' });

        const btn = cameraDiv.querySelector('.copy-btn');
        const original = btn.innerHTML;
        btn.innerHTML = '✓ Kopierad!';
        btn.classList.add('text-green-600');
        btn.classList.remove('text-blue-600');
        setTimeout(() => {
            btn.innerHTML = original;
            btn.classList.remove('text-green-600');
            btn.classList.add('text-blue-600');
        }, 1500);
    });

    // Checkboxes med progress-uppdatering
    const checkboxes = clone.querySelectorAll('.custom-checkbox');
    checkboxes.forEach((cb) => {
        cb.parentElement.addEventListener('click', (e) => {
            e.preventDefault();
            cb.classList.toggle('checked');
            updateProgressBadge(cameraDiv);
            scheduleSave(() => saveCameraFromDOM(cameraDiv));
        });
    });

    // Bildhantering
    setupImageHandling(clone.querySelector('.image-dropzone'), cameraDiv);

    // Fokusrektangel
    setupFocusRect(clone.querySelector('.image-dropzone'), cameraDiv);

    // Fyll i sparade data
    if (savedData) {
        restoreCameraFields(clone, savedData);
    }

    // Autosparning vid input
    clone.querySelectorAll('input[data-field], textarea[data-field]').forEach(el => {
        el.addEventListener('input', () => {
            scheduleSave(() => saveCameraFromDOM(cameraDiv));
        });
    });

    container.appendChild(clone);

    // Uppdatera badge med korrekt antal efter att DOM:en är färdig
    updateProgressBadge(cameraDiv);
}

function updateProgressBadge(cameraDiv) {
    const badge = cameraDiv.querySelector('.progress-badge');
    if (!badge) return;
    const checkboxes = cameraDiv.querySelectorAll('.custom-checkbox');
    const checked = Array.from(checkboxes).filter(cb => cb.classList.contains('checked')).length;
    const total = checkboxes.length;
    badge.textContent = `${checked}/${total}`;
    if (checked === total && total > 0) {
        badge.classList.add('complete');
    } else {
        badge.classList.remove('complete');
    }
}

function collectCameraDataFromDOM(cameraDiv) {
    const data = {};
    for (const field of CAMERA_FIELDS) {
        const el = cameraDiv.querySelector(`[data-field="${field}"]`);
        if (el) data[field] = el.value;
    }
    const checkboxes = cameraDiv.querySelectorAll('.custom-checkbox');
    data.checkboxes = Array.from(checkboxes).map(cb => cb.classList.contains('checked'));
    return data;
}

function saveCameraFromDOM(cameraDiv) {
    const num = parseInt(cameraDiv.dataset.cameraNumber, 10);
    const data = {};

    for (const field of CAMERA_FIELDS) {
        const el = cameraDiv.querySelector(`[data-field="${field}"]`);
        if (el) data[field] = el.value;
    }

    const checkboxes = cameraDiv.querySelectorAll('.custom-checkbox');
    data.checkboxes = Array.from(checkboxes).map(cb => cb.classList.contains('checked'));

    const labelInput = cameraDiv.querySelector('.camera-title');
    if (labelInput) {
        cameraDiv.querySelector('.camera-footer-id').textContent = `Kamera: ${labelInput.value}`;
    }

    const img = cameraDiv.querySelector('.preview-img');
    data.image = (img && !img.classList.contains('hidden') && img.src) ? img.src : '';

    // Fokusrektangel
    data.focusRect = cameraDiv.dataset.focusRect ? JSON.parse(cameraDiv.dataset.focusRect) : null;

    return saveCameraData(protocolId, num, data);
}

function restoreCameraFields(clone, data) {
    for (const field of CAMERA_FIELDS) {
        const el = clone.querySelector(`[data-field="${field}"]`);
        if (el && data[field] !== undefined) el.value = data[field];
    }

    if (data.checkboxes) {
        const checkboxes = clone.querySelectorAll('.custom-checkbox');
        data.checkboxes.forEach((checked, i) => {
            if (checked && checkboxes[i]) checkboxes[i].classList.add('checked');
        });
    }

    const labelInput = clone.querySelector('.camera-title');
    if (labelInput && data.cameraLabel) {
        const footerId = clone.querySelector('.camera-footer-id');
        if (footerId) footerId.textContent = `Kamera: ${data.cameraLabel}`;
    }

    if (data.image) {
        const dropzone = clone.querySelector('.image-dropzone');
        const previewImg = dropzone.querySelector('.preview-img');
        const placeholderContent = dropzone.querySelector('.placeholder-content');
        const removeBtn = dropzone.querySelector('.remove-image-btn');
        const fileInput = dropzone.querySelector('.file-input');

        previewImg.src = data.image;
        previewImg.classList.remove('hidden');
        placeholderContent.classList.add('hidden');
        removeBtn.classList.remove('hidden');
        dropzone.classList.remove('border-dashed');
        fileInput.classList.add('hidden');

        // Visa SVG-overlay (möjliggör ritning och visar ev. sparad rektangel)
        const focusSvg = dropzone.querySelector('.focus-overlay');
        if (focusSvg) focusSvg.classList.remove('hidden');
    }

    // Återställ fokusrektangel om en finns sparad
    if (data.focusRect && data.focusRect.w > 0 && data.focusRect.h > 0) {
        const fr = data.focusRect;
        const dropzone = clone.querySelector('.image-dropzone');
        const focusSvg = dropzone.querySelector('.focus-overlay');
        const focusRect = dropzone.querySelector('.focus-rect');
        const clearBtn = dropzone.querySelector('.clear-focus-btn');
        const camDiv = clone.querySelector('.a4-wrapper');

        if (focusRect) {
            focusRect.setAttribute('x', fr.x + '%');
            focusRect.setAttribute('y', fr.y + '%');
            focusRect.setAttribute('width', fr.w + '%');
            focusRect.setAttribute('height', fr.h + '%');
        }
        if (focusSvg) focusSvg.classList.remove('hidden');
        if (clearBtn) clearBtn.classList.remove('hidden');
        if (camDiv) camDiv.dataset.focusRect = JSON.stringify(fr);
    }
}

// =============================================
// Bildhantering med nedskalning
// =============================================

function resizeImage(dataURL) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;

            if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
                const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY));
        };
        img.src = dataURL;
    });
}

function setupImageHandling(dropzone, cameraDiv) {
    const fileInput = dropzone.querySelector('.file-input');
    const previewImg = dropzone.querySelector('.preview-img');
    const placeholderContent = dropzone.querySelector('.placeholder-content');
    const removeBtn = dropzone.querySelector('.remove-image-btn');

    const setImage = async (src) => {
        const resized = await resizeImage(src);

        previewImg.src = resized;
        previewImg.classList.remove('hidden');
        placeholderContent.classList.add('hidden');
        removeBtn.classList.remove('hidden');
        dropzone.classList.remove('border-dashed');
        fileInput.classList.add('hidden');

        // Visa SVG-overlay för fokusrektangel
        const focusSvg = dropzone.querySelector('.focus-overlay');
        if (focusSvg) focusSvg.classList.remove('hidden');

        scheduleSave(() => saveCameraFromDOM(cameraDiv));
    };

    const clearImage = (e) => {
        e.stopPropagation();
        previewImg.src = '';
        previewImg.classList.add('hidden');
        placeholderContent.classList.remove('hidden');
        removeBtn.classList.add('hidden');
        dropzone.classList.add('border-dashed');
        fileInput.value = '';
        fileInput.classList.remove('hidden');

        // Dölj och rensa fokusrektangeln
        const focusSvg = dropzone.querySelector('.focus-overlay');
        if (focusSvg) {
            focusSvg.classList.add('hidden');
            const fr = focusSvg.querySelector('.focus-rect');
            if (fr) { fr.setAttribute('x','0%'); fr.setAttribute('y','0%'); fr.setAttribute('width','0%'); fr.setAttribute('height','0%'); }
        }
        const clearBtn = dropzone.querySelector('.clear-focus-btn');
        if (clearBtn) clearBtn.classList.add('hidden');
        delete cameraDiv.dataset.focusRect;

        scheduleSave(() => saveCameraFromDOM(cameraDiv));
    };

    // Välj fil
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => setImage(event.target.result);
            reader.readAsDataURL(file);
        }
    });

    // Ta bort bild
    removeBtn.addEventListener('click', clearImage);

    // Klistra in (Ctrl+V)
    dropzone.addEventListener('paste', (e) => {
        e.preventDefault();
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let index in items) {
            const item = items[index];
            if (item.kind === 'file') {
                const blob = item.getAsFile();
                if (blob && blob.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => setImage(event.target.result);
                    reader.readAsDataURL(blob);
                    return;
                }
            }
        }
    });

    // Drag-and-drop
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
    });

    dropzone.addEventListener('dragleave', (e) => {
        // Kontrollera att musen faktiskt lämnar dropzone (inte ett barn-element)
        if (!dropzone.contains(e.relatedTarget)) {
            dropzone.classList.remove('drag-over');
        }
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => setImage(event.target.result);
            reader.readAsDataURL(file);
        }
    });
}

// =============================================
// Fokusrektangel
// =============================================

function setupFocusRect(dropzone, cameraDiv) {
    const svg = dropzone.querySelector('.focus-overlay');
    const rectEl = dropzone.querySelector('.focus-rect');
    const clearBtn = dropzone.querySelector('.clear-focus-btn');

    if (!svg || !rectEl) return;

    let isDrawing = false;
    let startX = 0, startY = 0;

    // Konverterar musposition till procent av SVG:s storlek (0–100)
    function getSVGPct(e) {
        const box = svg.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - box.left) / box.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - box.top) / box.height) * 100));
        return { x, y };
    }

    function applyRect(x, y, w, h) {
        rectEl.setAttribute('x', x + '%');
        rectEl.setAttribute('y', y + '%');
        rectEl.setAttribute('width', w + '%');
        rectEl.setAttribute('height', h + '%');
    }

    function saveRect(x, y, w, h) {
        cameraDiv.dataset.focusRect = JSON.stringify({ x, y, w, h });
    }

    function clearRect() {
        applyRect(0, 0, 0, 0);
        delete cameraDiv.dataset.focusRect;
        clearBtn.classList.add('hidden');
        scheduleSave(() => saveCameraFromDOM(cameraDiv));
    }

    svg.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isDrawing = true;
        const p = getSVGPct(e);
        startX = p.x;
        startY = p.y;
        applyRect(startX, startY, 0, 0);
        clearBtn.classList.add('hidden');

        // Lyssna på mouseup globalt ifall musen lyfts utanför SVG
        window.addEventListener('mouseup', onWindowMouseUp, { once: true });
    });

    svg.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const p = getSVGPct(e);
        const x = Math.min(startX, p.x);
        const y = Math.min(startY, p.y);
        const w = Math.abs(p.x - startX);
        const h = Math.abs(p.y - startY);
        applyRect(x, y, w, h);
    });

    function onWindowMouseUp(e) {
        if (!isDrawing) return;
        isDrawing = false;

        // Hämta aktuell rektangel från DOM
        const x = parseFloat(rectEl.getAttribute('x') || 0);
        const y = parseFloat(rectEl.getAttribute('y') || 0);
        const w = parseFloat(rectEl.getAttribute('width') || 0);
        const h = parseFloat(rectEl.getAttribute('height') || 0);

        // Ignorera om rektangeln är för liten (ett av misstag)
        if (w < 2 || h < 2) {
            applyRect(0, 0, 0, 0);
            return;
        }

        saveRect(x, y, w, h);
        clearBtn.classList.remove('hidden');
        scheduleSave(() => saveCameraFromDOM(cameraDiv));
    }

    clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearRect();
    });
}

// =============================================
// Spara-indikator
// =============================================

let _saveIndicatorTimer = null;

function showSaveIndicator(state) {
    const indicator = document.getElementById('save-indicator');
    const spinner = document.getElementById('save-spinner');
    const check = document.getElementById('save-check');
    const label = document.getElementById('save-label');
    if (!indicator) return;

    indicator.classList.remove('hidden');

    if (state === 'saving') {
        spinner.classList.remove('hidden');
        check.classList.add('hidden');
        label.textContent = 'Sparar…';
        indicator.style.opacity = '1';
    } else {
        spinner.classList.add('hidden');
        check.classList.remove('hidden');
        label.textContent = 'Sparad';
        indicator.style.opacity = '1';

        clearTimeout(_saveIndicatorTimer);
        _saveIndicatorTimer = setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => indicator.classList.add('hidden'), 400);
        }, 2500);
    }
}

// =============================================
// Toast-notiser
// =============================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');

    const isSuccess = type === 'success';
    const colors = isSuccess ? 'bg-gray-900 text-white' : 'bg-red-600 text-white';
    const iconSvg = isSuccess
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

    toast.className = `toast pointer-events-auto ${colors} px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2.5 text-sm font-medium max-w-xs`;
    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 250);
    }, 3000);
}

// =============================================
// Hjälpfunktioner
// =============================================

function scheduleSave(saveFn) {
    showSaveIndicator('saving');
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(async () => {
        await saveFn();
        showSaveIndicator('saved');
    }, SAVE_DELAY);
}
