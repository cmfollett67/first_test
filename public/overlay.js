// Shared video overlay player
(function() {
  // Create overlay DOM
  const overlay = document.createElement('div');
  overlay.id = 'video-overlay';
  overlay.className = 'video-overlay hidden';
  overlay.innerHTML = `
    <div class="overlay-backdrop"></div>
    <div class="overlay-content">
      <button type="button" class="overlay-close" aria-label="Close">&times;</button>
      <video id="overlay-video" controls autoplay></video>
    </div>
  `;

  function close() {
    const video = overlay.querySelector('#overlay-video');
    video.pause();
    video.src = '';
    overlay.classList.add('hidden');
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(overlay);

    const backdrop = overlay.querySelector('.overlay-backdrop');
    const closeBtn = overlay.querySelector('.overlay-close');

    backdrop.addEventListener('click', close);
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      close();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
      close();
    }
  });

  window.openVideoOverlay = function(src) {
    const video = overlay.querySelector('#overlay-video');
    video.src = src;
    overlay.classList.remove('hidden');
  };

  window.closeVideoOverlay = close;
})();
