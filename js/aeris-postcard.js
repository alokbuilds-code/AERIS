/**
 * AERIS — Interactive 3D Tactile Postcard Studio
 * Physical postcard simulation, 3D flip card, stamp selection,
 * typography note, vintage postmark lines, and print/save functionality.
 */

class AerisPostcardStudio {
  constructor() {
    this.selectedDest = AERIS_DESTINATIONS[0];
    this.selectedPhotoIdx = 0;
    this.selectedStamp = "🌸";
    this.isFlipped = false;
  }

  init() {
    this.destSelect = document.getElementById('postcard-select-dest');
    this.stampGroup = document.querySelectorAll('.stamp-option-btn');
    this.photoThumbStrip = document.getElementById('postcard-photo-strip');
    this.toInput = document.getElementById('postcard-input-to');
    this.msgInput = document.getElementById('postcard-input-msg');
    this.fromInput = document.getElementById('postcard-input-from');
    this.cardInner = document.getElementById('postcard-3d-object');
    this.flipTrigger = document.getElementById('postcard-flip-action');

    // Postcard Face Elements
    this.frontImage = document.getElementById('card-front-photo');
    this.frontTitle = document.getElementById('card-front-title');
    this.frontCoords = document.getElementById('card-front-coords');
    this.backTo = document.getElementById('card-back-to-text');
    this.backMsg = document.getElementById('card-back-msg-text');
    this.backFrom = document.getElementById('card-back-from-text');
    this.backStamp = document.getElementById('card-back-stamp-glyph');

    this.populateDestinations();
    this.bindEvents();
    this.updatePreview();
  }

  populateDestinations() {
    if (!this.destSelect) return;
    this.destSelect.innerHTML = AERIS_DESTINATIONS.map(d => `
      <option value="${d.id}">${d.index} // ${d.name.toUpperCase()} (${d.country})</option>
    `).join('');
  }

  bindEvents() {
    if (this.destSelect) {
      this.destSelect.addEventListener('change', (e) => {
        const found = AERIS_DESTINATIONS.find(d => d.id === e.target.value);
        if (found) {
          this.selectedDest = found;
          this.selectedPhotoIdx = 0;
          this.renderPhotoThumbnails();
          this.updatePreview();
        }
      });
    }

    this.stampGroup.forEach(btn => {
      btn.addEventListener('click', () => {
        this.stampGroup.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedStamp = btn.getAttribute('data-stamp');
        if (this.backStamp) this.backStamp.textContent = this.selectedStamp;
        if (window.aerisAudio) aerisAudio.playUiTone('click');
      });
    });

    if (this.toInput) {
      this.toInput.addEventListener('input', (e) => {
        if (this.backTo) this.backTo.textContent = e.target.value.trim() || 'Dear Explorer,';
      });
    }

    if (this.msgInput) {
      this.msgInput.addEventListener('input', (e) => {
        if (this.backMsg) this.backMsg.textContent = e.target.value.trim() || 'The light here falls upon ancient stone in ways that defy memory. Wish you were standing beside me.';
      });
    }

    if (this.fromInput) {
      this.fromInput.addEventListener('input', (e) => {
        if (this.backFrom) this.backFrom.textContent = `— ${e.target.value.trim() || 'A Wanderer'}`;
      });
    }

    if (this.cardInner) {
      this.cardInner.addEventListener('click', () => this.toggleFlip());
    }

    if (this.flipTrigger) {
      this.flipTrigger.addEventListener('click', () => this.toggleFlip());
    }

    const printBtn = document.getElementById('postcard-print-action');
    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }

    this.renderPhotoThumbnails();
  }

  renderPhotoThumbnails() {
    if (!this.photoThumbStrip) return;
    this.photoThumbStrip.innerHTML = this.selectedDest.gallery.map((img, idx) => `
      <img src="${img}" class="postcard-thumb ${idx === this.selectedPhotoIdx ? 'active' : ''}" 
           data-idx="${idx}" alt="Perspective ${idx + 1}" />
    `).join('');

    this.photoThumbStrip.querySelectorAll('.postcard-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        this.photoThumbStrip.querySelectorAll('.postcard-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        this.selectedPhotoIdx = parseInt(thumb.getAttribute('data-idx'));
        this.updatePreview();
        if (window.aerisAudio) aerisAudio.playUiTone('click');
      });
    });
  }

  toggleFlip() {
    this.isFlipped = !this.isFlipped;
    if (this.cardInner) {
      this.cardInner.classList.toggle('flipped', this.isFlipped);
    }
    if (window.aerisAudio) aerisAudio.playUiTone('click');
  }

  updatePreview() {
    const photoUrl = this.selectedDest.gallery[this.selectedPhotoIdx] || this.selectedDest.heroImage;
    if (this.frontImage) this.frontImage.src = photoUrl;
    if (this.frontTitle) this.frontTitle.textContent = this.selectedDest.name.toUpperCase();
    if (this.frontCoords) this.frontCoords.textContent = `${this.selectedDest.coordinates} • ${this.selectedDest.country.toUpperCase()}`;
    if (this.backStamp) this.backStamp.textContent = this.selectedStamp;
  }
}

const aerisPostcard = new AerisPostcardStudio();
