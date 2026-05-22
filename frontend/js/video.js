/* ============================================================
   Lance WebUI — Video Generation
   ============================================================ */

(function () {
  'use strict';

  const btn = document.getElementById('videoBtn');
  const preview = document.getElementById('videoPreview');
  const meta = document.getElementById('videoMeta');

  if (!btn) return;

  let sourceFile = null;

  // Setup dropzone
  setupDropzone('videoDropzone', 'videoFileInput', 'videoThumb', (file) => {
    sourceFile = file;
  });

  btn.addEventListener('click', generateVideo);

  async function generateVideo() {
    const prompt = document.getElementById('videoPrompt').value.trim();
    if (!prompt) {
      showToast('Please enter a prompt', 'error');
      return;
    }

    const frames = parseInt(document.getElementById('videoFrames').value);
    const fps = parseInt(document.getElementById('videoFps').value);
    const steps = parseInt(document.getElementById('videoSteps').value);

    setButtonLoading('videoBtn', true);
    showSkeleton();

    try {
      let res;

      if (sourceFile) {
        // Image-to-video
        const form = new FormData();
        form.append('image', sourceFile);
        form.append('prompt', prompt);
        form.append('frames', frames);
        form.append('fps', fps);
        form.append('steps', steps);

        res = await apiCall('/api/video', {
          method: 'POST',
          body: form,
        });
      } else {
        // Text-to-video
        res = await apiCall('/api/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, frames, fps, steps }),
        });
      }

      const data = await res.json();

      if (data.video_url || data.video_base64) {
        const src = data.video_url
          ? LanceApp.apiUrl + data.video_url
          : `data:video/mp4;base64,${data.video_base64}`;

        preview.innerHTML = `<video src="${src}" controls autoplay loop style="max-width:100%;max-height:480px;border-radius:var(--radius-sm);"></video>`;

        meta.classList.remove('hidden');
        const elapsed = data.elapsed ? `${data.elapsed.toFixed(1)}s` : '—';
        meta.innerHTML = `
          <span>Frames: ${frames}</span>
          <span>FPS: ${fps}</span>
          <span>Duration: ${(frames / fps).toFixed(1)}s</span>
          <span>Time: ${elapsed}</span>
        `;
        showToast('Video generated!', 'success');
      } else if (data.task_id) {
        await pollTask(data.task_id, frames, fps);
      } else {
        showToast('Unexpected response', 'error');
        resetPreview();
      }
    } catch {
      resetPreview();
    } finally {
      setButtonLoading('videoBtn', false);
    }
  }

  async function pollTask(taskId, frames, fps) {
    const maxAttempts = 300; // video can take longer
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const res = await apiCall(`/api/tasks/${taskId}`);
        const data = await res.json();

        if (data.status === 'completed' || data.status === 'done') {
          const src = data.video_url
            ? LanceApp.apiUrl + data.video_url
            : `data:video/mp4;base64,${data.video_base64}`;

          preview.innerHTML = `<video src="${src}" controls autoplay loop style="max-width:100%;max-height:480px;border-radius:var(--radius-sm);"></video>`;

          meta.classList.remove('hidden');
          meta.innerHTML = `
            <span>Frames: ${frames}</span>
            <span>FPS: ${fps}</span>
            <span>Duration: ${(frames / fps).toFixed(1)}s</span>
            <span>Task: ${taskId}</span>
          `;
          showToast('Video generated!', 'success');
          return;
        }

        if (data.status === 'failed') {
          showToast(`Video failed: ${data.error || 'unknown'}`, 'error');
          resetPreview();
          return;
        }
      } catch { /* retry */ }
    }
    showToast('Video generation timed out', 'error');
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
      <div class="preview-placeholder-icon">🎬</div>
      <p>Your video will appear here</p>
    </div>`;
    meta.classList.add('hidden');
  }
})();
