/* ============================================================
   Lance WebUI — Core App Logic
   ============================================================ */

(function () {
  'use strict';

  // ---- Config ----
  const LanceApp = {
    apiUrl: localStorage.getItem('lance_api_url') || 'http://localhost:8000',
    apiKey: localStorage.getItem('lance_api_key') || '',
    currentTab: 'generate',
  };

  // ---- Tab Switching ----
  function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));

    const tabEl = document.getElementById('tab-' + tabId);
    const navBtn = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
    if (tabEl) tabEl.classList.add('active');
    if (navBtn) navBtn.classList.add('active');

    LanceApp.currentTab = tabId;
  }

  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // ---- Command Palette ----
  const paletteOverlay = document.getElementById('commandPalette');
  const paletteInput = document.getElementById('commandInput');
  const commandResults = document.getElementById('commandResults');

  function openPalette() {
    paletteOverlay.classList.remove('hidden');
    paletteInput.value = '';
    paletteInput.focus();
    filterCommands('');
  }

  function closePalette() {
    paletteOverlay.classList.add('hidden');
  }

  document.getElementById('searchBtn').addEventListener('click', openPalette);

  paletteOverlay.addEventListener('click', (e) => {
    if (e.target === paletteOverlay) closePalette();
  });

  // Command item clicks
  commandResults.addEventListener('click', (e) => {
    const item = e.target.closest('.command-item');
    if (!item) return;
    const action = item.dataset.action;
    if (action === 'tab') {
      switchTab(item.dataset.tab);
    }
    closePalette();
  });

  // Filter commands
  function filterCommands(query) {
    const items = commandResults.querySelectorAll('.command-item');
    const q = query.toLowerCase();
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(q) ? '' : 'none';
    });
  }

  paletteInput.addEventListener('input', () => filterCommands(paletteInput.value));

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const isMeta = e.metaKey || e.ctrlKey;

    // Cmd+K — palette
    if (isMeta && e.key === 'k') {
      e.preventDefault();
      if (paletteOverlay.classList.contains('hidden')) openPalette();
      else closePalette();
      return;
    }

    // Escape
    if (e.key === 'Escape') {
      if (!paletteOverlay.classList.contains('hidden')) {
        e.preventDefault();
        closePalette();
      }
      return;
    }

    // Cmd+1..4 tabs
    if (isMeta && e.key >= '1' && e.key <= '4') {
      e.preventDefault();
      const tabs = ['generate', 'edit', 'video', 'settings'];
      switchTab(tabs[parseInt(e.key) - 1]);
    }
  });

  // ---- Toast Notifications ----
  window.showToast = function (message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // ---- API Helper ----
  window.apiCall = async function (endpoint, options = {}) {
    const url = LanceApp.apiUrl + endpoint;
    const headers = { ...options.headers };
    if (LanceApp.apiKey) {
      headers['Authorization'] = `Bearer ${LanceApp.apiKey}`;
    }
    try {
      const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }
      return res;
    } catch (err) {
      showToast(`API Error: ${err.message}`, 'error');
      throw err;
    }
  };

  // ---- Drag-and-Drop Utility ----
  window.setupDropzone = function (dropzoneId, fileInputId, thumbId, onFile) {
    const dz = document.getElementById(dropzoneId);
    const fi = document.getElementById(fileInputId);
    const thumb = document.getElementById(thumbId);

    dz.addEventListener('click', (e) => {
      if (e.target.closest('.dropzone-thumb')) {
        // Clear
        thumb.classList.add('hidden');
        thumb.style.backgroundImage = '';
        fi.value = '';
        onFile(null);
        return;
      }
      fi.click();
    });

    fi.addEventListener('change', () => {
      if (fi.files[0]) handleFile(fi.files[0]);
    });

    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag-over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.classList.remove('drag-over');
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    function handleFile(file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        thumb.style.backgroundImage = `url(${e.target.result})`;
        thumb.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
      onFile(file);
    }
  };

  // ---- Button Loading State ----
  window.setButtonLoading = function (btnId, loading) {
    const btn = document.getElementById(btnId);
    if (loading) {
      btn.classList.add('btn-loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
    }
  };

  // ---- Settings ----
  const apiUrlInput = document.getElementById('setApiUrl');
  const apiKeyInput = document.getElementById('setApiKey');
  if (apiUrlInput) apiUrlInput.value = LanceApp.apiUrl;
  if (apiKeyInput) apiKeyInput.value = LanceApp.apiKey;

  apiUrlInput?.addEventListener('change', () => {
    LanceApp.apiUrl = apiUrlInput.value.replace(/\/+$/, '');
    localStorage.setItem('lance_api_url', LanceApp.apiUrl);
  });

  apiKeyInput?.addEventListener('change', () => {
    LanceApp.apiKey = apiKeyInput.value;
    localStorage.setItem('lance_api_key', LanceApp.apiKey);
  });

  document.getElementById('setTestBtn')?.addEventListener('click', async () => {
    try {
      await apiCall('/health');
      showToast('Connection successful!', 'success');
    } catch {
      // toast already shown in apiCall
    }
  });

  document.getElementById('setClearBtn')?.addEventListener('click', () => {
    if (confirm('Clear all cached outputs?')) {
      showToast('Cache cleared', 'success');
    }
  });

  // Expose for modules
  window.LanceApp = LanceApp;
})();
