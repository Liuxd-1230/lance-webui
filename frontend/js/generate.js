/* ============================================================
   Lance WebUI — Image Generation
   ============================================================ */

(function () {
  'use strict';

  const btn = document.getElementById('genBtn');
  const preview = document.getElementById('genPreview');
  const meta = document.getElementById('genMeta');

  if (!btn) return;

  btn.addEventListener('click', generate);

  async function generate() {
    const prompt = document.getElementById('genPrompt').value.trim();
    if (!prompt) {
      showToast('Please enter a prompt', 'error');
      return;
    }

    const payload = {
      prompt,
      negative_prompt: document.getElementById('genNegative').value.trim(),
      width: parseInt(document.getElementById('genWidth').value),
      height: parseInt(document.getElementById('genHeight').value),
      steps: parseInt(document.getElementById('genSteps').value),
      cfg_scale: parseFloat(document.getElementById('genCfg').value),
      seed: parseInt(document.getElementById('genSeed').value),
    };

    setButtonLoading('genBtn', true);
    showSkeleton();

    try {
      const res = await apiCall('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.image_url || data.image_base64) {
        const src = data.image_url
          ? LanceApp.apiUrl + data.image_url
          : `data:image/png;base64,${data.image_base64}`;

        preview.innerHTML = `<img src="${src}" alt="Generated image">`;

        meta.classList.remove('hidden');
        const elapsed = data.elapsed ? `${data.elapsed.toFixed(1)}s` : '—';
        const seed = data.seed ?? payload.seed;
        meta.innerHTML = `
          <span>Seed: ${seed}</span>
          <span>Time: ${elapsed}</span>
          <span>Size: ${payload.width}×${payload.height}</span>
        `;
        showToast('Image generated!', 'success');
      } else if (data.task_id) {
        // Async — poll for result
        await pollTask(data.task_id);
      } else {
        showToast('Unexpected response format', 'error');
        resetPreview();
      }
    } catch {
      resetPreview();
    } finally {
      setButtonLoading('genBtn', false);
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
          preview.innerHTML = `<img src="${src}" alt="Generated image">`;
          meta.classList.remove('hidden');
          meta.innerHTML = `<span>Seed: ${data.seed ?? '—'}</span><span>Task: ${taskId}</span>`;
          showToast('Image generated!', 'success');
          return;
        }
        if (data.status === 'failed') {
          showToast(`Generation failed: ${data.error || 'unknown error'}`, 'error');
          resetPreview();
          return;
        }
      } catch { /* retry */ }
    }
    showToast('Generation timed out', 'error');
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
      <div class="preview-placeholder-icon">🖼️</div>
      <p>Your generated image will appear here</p>
    </div>`;
    meta.classList.add('hidden');
  }
})();
