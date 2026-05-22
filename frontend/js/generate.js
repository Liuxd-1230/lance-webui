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

    const seedVal = parseInt(document.getElementById('genSeed').value);
    const payload = {
      prompt,
      negative_prompt: document.getElementById('genNegative').value.trim(),
      width: parseInt(document.getElementById('genWidth').value),
      height: parseInt(document.getElementById('genHeight').value),
      num_inference_steps: parseInt(document.getElementById('genSteps').value),
      guidance_scale: parseFloat(document.getElementById('genCfg').value),
      seed: isNaN(seedVal) || seedVal < 0 ? null : seedVal,
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

      if (data.images && data.images.length > 0) {
        const src = `data:image/png;base64,${data.images[0]}`;

        preview.innerHTML = `<img src="${src}" alt="Generated image">`;

        meta.classList.remove('hidden');
        const elapsed = data.processing_time ? `${data.processing_time.toFixed(1)}s` : '—';
        meta.innerHTML = `
          <span>Seed: ${data.seed ?? '—'}</span>
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
          const img = data.images ? data.images[0] : data.image_base64;
          const src = `data:image/png;base64,${img}`;
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
