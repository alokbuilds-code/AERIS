/**
 * AERIS — Full-Screen Editorial Photographic Lightbox
 * Minimal, image-led photographic view: "01 / 06 | KYOTO, JAPAN | ← →"
 * Zero bulky modals, keyboard navigation, smooth crossfade transitions.
 */

class AerisLightbox {
  constructor() {
    this.modal = null;
    this.imgElement = null;
    this.counterEl = null;
    this.titleEl = null;
    this.currentImages = [];
    this.currentIndex = 0;
    this.currentTitle = "";
    this.isOpen = false;
  }

  init() {
    this.modal = document.getElementById('aeris-lightbox');
    this.imgElement = document.getElementById('lightbox-cinema-img');
    this.counterEl = document.getElementById('lightbox-cinema-counter');
    this.titleEl = document.getElementById('lightbox-cinema-title');
    this.closeBtn = document.getElementById('lightbox-cinema-close');
    this.prevBtn = document.getElementById('lightbox-cinema-prev');
    this.nextBtn = document.getElementById('lightbox-cinema-next');

    if (!this.modal) return;

    this.closeBtn.addEventListener('click', () => this.close());
    this.prevBtn.addEventListener('click', () => this.prev());
    this.nextBtn.addEventListener('click', () => this.next());

    // Backdrop click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal || e.target.classList.contains('lightbox-backdrop-dismiss')) {
        this.close();
      }
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });
  }

  open(images, startIndex = 0, title = "EXPEDITION") {
    if (!images || images.length === 0) return;
    this.currentImages = images;
    this.currentIndex = startIndex;
    this.currentTitle = title;
    this.isOpen = true;

    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    this.render();
    if (window.aerisAudio) aerisAudio.playUiTone('reveal');
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    if (window.aerisAudio) aerisAudio.playUiTone('click');
  }

  next() {
    if (this.currentImages.length <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % this.currentImages.length;
    this.render();
    if (window.aerisAudio) aerisAudio.playUiTone('click');
  }

  prev() {
    if (this.currentImages.length <= 1) return;
    this.currentIndex = (this.currentIndex - 1 + this.currentImages.length) % this.currentImages.length;
    this.render();
    if (window.aerisAudio) aerisAudio.playUiTone('click');
  }

  render() {
    const src = this.currentImages[this.currentIndex];
    const paddedIdx = String(this.currentIndex + 1).padStart(2, '0');
    const paddedTotal = String(this.currentImages.length).padStart(2, '0');

    // Smooth editorial crossfade
    this.imgElement.style.opacity = '0';
    this.imgElement.style.transform = 'scale(0.985)';

    setTimeout(() => {
      this.imgElement.src = src;
      this.imgElement.onload = () => {
        this.imgElement.style.opacity = '1';
        this.imgElement.style.transform = 'scale(1)';
      };
    }, 120);

    if (this.counterEl) this.counterEl.textContent = `${paddedIdx} / ${paddedTotal}`;
    if (this.titleEl) this.titleEl.textContent = this.currentTitle.toUpperCase();
  }
}

const aerisLightbox = new AerisLightbox();
