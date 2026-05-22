/* ============================================================
   Lance WebUI — Image Editing
   ============================================================ */

(function () {
  'use strict';

  const btn = document.getElementById('editBtn');
  const preview = document.getElementById('editPreview');
  const meta = document.getElementById('editMeta');
  const strengthSlider = document.getElementById('editStrength');
  const strengthVal = document.getElementById('editStrengthVal');

  if (!btn) return;

  let sourceFile = null;

  // Setup dropzone
  setupDropzone('editDropzone', 'editFileInput', 'editThumb', (file) => {
    sourceFile = file;
    btn.disabled = !file;
  });

  // Range display
  strengthSlider?.addEventListener('input', () => {
    strengthVal.textContent = strengthSlider.value;
  });

  btn.addEventListener('click', editImage);

  async function editImage() {
    const prompt = document.getElementById('editPrompt').value.trim();
    if (!sourceFile) {
      showToast('Please upload a source image', 'error');
      return;
    }
    if (!prompt) {
      showToast('Please enter an edit instruction', 'error');
      return;
    }

    setButtonLoading('editBtn', true);
    showSkeleton();

    try {
      const form = new FormData();
      form.append('image', sourceFile);
      form.append('prompt', prompt);
      form.append('strength', strengthSlider.value);
      form.append('steps', document.getElementById('editSteps').value);

      const res = await apiCall('/api/edit', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();

      if (data.image_url || data.image_base64) {
        const src = data.image_url
          ? LanceApp.apiUrl + data.image_url
          : `data:image/png;base64,${data.image_base64}`;

        preview.innerHTML = `<img src="${src}" alt="Edited image">`;

        meta.classList.remove('hidden');
        const elapsed = data.elapsed ? `${data.elapsed.toFixed(1)}s` : '—';
        meta.innerHTML = `
          <span>Strength: ${strengthSlider.value}</span>
          <span>Time: ${elapsed}</span>
        `;
        showToast('Image edited!', 'success');
      } else if (data.task_id) {
        await pollTask(data.task_id);
      } else {
        showToast('Unexpected response', 'error');
        resetPreview();
      }
    } catch {
      resetPreview();
    } finally {
      setButtonLoading('editBtn', false);
    }
  }

  async function pollTask(taskId) {
    const maxAttempts = 120;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const res = await apiCall(`/api/tasks/${taskId}`);
        const data = await res.json();
        if (data.status === 'completed' || data.status === 'done') {
          const src = data.image_url
            ? LanceApp.apiUrl + data.image_url
            : `data:image/png;base64,${data.image_base64}`;
          preview.innerHTML = `<img src="${src}" alt="Edited image">`;
          meta.classList.remove('hidden');
          meta.innerHTML = `<span>Task: ${taskId}</span>`;
          showToast('Image edited!', 'success');
          return;
        }
        if (data.status === 'failed') {
          showToast(`Edit failed: ${data.error || 'unknown'}`, 'error');
          resetPreview();
          return;
        }
      } catch { /* retry */ }
    }
    showToast('Edit timed out', 'error');
    resetPreview();
  }

  function showSkeleton() {
    preview.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
      <div class="spinner" style="width:32px;height:32px;border-width:3px;"></div>
    </div>`;
    meta.classList.add('hidden');
  }

  function resetPreview() {
    preview.innerHTML = `<div class="preview-placeholder">
      <div class="preview-placeholder-icon">🖌️</div>
      <p>Edited result will appear here</p>
    </div>`;
    meta.classList.add('hidden');
  }
})();
