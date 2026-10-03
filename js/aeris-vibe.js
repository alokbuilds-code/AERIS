/**
 * AERIS — Cinematic Photographic Vibe Matcher
 * An immersive two-question photographic decision experience.
 * Large visual panels that crossfade seamlessly into a full-screen personalized revelation.
 */

class AerisVibeMatcher {
  constructor() {
    this.selectedMood = null;
    this.selectedClimate = null;
    this.matchedDest = null;
  }

  init() {
    this.container = document.getElementById('aeris-vibe-section');
    this.step1El = document.getElementById('vibe-step-1');
    this.step2El = document.getElementById('vibe-step-2');
    this.resultEl = document.getElementById('vibe-step-result');
    this.resetBtn = document.getElementById('vibe-reset-trigger');

    this.bindEvents();
  }

  bindEvents() {
    // Step 1: Mood options
    document.querySelectorAll('.vibe-photo-choice[data-mood]').forEach(card => {
      card.addEventListener('click', () => {
        this.selectedMood = card.getAttribute('data-mood');
        if (window.aerisAudio) aerisAudio.playUiTone('reveal');
        this.transitionStep(1, 2);
      });
    });

    // Step 2: Climate options
    document.querySelectorAll('.vibe-photo-choice[data-climate]').forEach(card => {
      card.addEventListener('click', () => {
        this.selectedClimate = card.getAttribute('data-climate');
        if (window.aerisAudio) aerisAudio.playUiTone('reveal');
        this.calculateAndShowResult();
      });
    });

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        this.resetQuiz();
        if (window.aerisAudio) aerisAudio.playUiTone('click');
      });
    }
  }

  transitionStep(fromStep, toStep) {
    if (fromStep === 1 && toStep === 2) {
      this.step1El.style.opacity = '0';
      this.step1El.style.pointerEvents = 'none';
      setTimeout(() => {
        this.step1El.style.display = 'none';
        this.step2El.style.display = 'block';
        setTimeout(() => {
          this.step2El.style.opacity = '1';
          this.step2El.style.pointerEvents = 'all';
        }, 50);
      }, 400);
    }
  }

  calculateAndShowResult() {
    // Find closest destination match based on mood or climate
    let match = AERIS_DESTINATIONS.find(d => d.vibeTag === this.selectedMood && d.climateTag === this.selectedClimate);

    if (!match) {
      match = AERIS_DESTINATIONS.find(d => d.vibeTag === this.selectedMood) ||
              AERIS_DESTINATIONS.find(d => d.climateTag === this.selectedClimate) ||
              AERIS_DESTINATIONS[0];
    }

    this.matchedDest = match;

    // Transition Step 2 to Result
    this.step2El.style.opacity = '0';
    this.step2El.style.pointerEvents = 'none';

    setTimeout(() => {
      this.step2El.style.display = 'none';
      this.renderResult(match);
      this.resultEl.style.display = 'block';
      setTimeout(() => {
        this.resultEl.style.opacity = '1';
        this.resultEl.style.pointerEvents = 'all';
      }, 50);
    }, 400);
  }

  renderResult(dest) {
    const bgImg = document.getElementById('vibe-result-bg');
    const categoryEl = document.getElementById('vibe-result-category');
    const titleEl = document.getElementById('vibe-result-title');
    const countryEl = document.getElementById('vibe-result-country');
    const quoteEl = document.getElementById('vibe-result-quote');
    const actionBtn = document.getElementById('vibe-result-explore-btn');

    if (bgImg) bgImg.src = dest.heroImage;
    if (categoryEl) categoryEl.textContent = `YOUR VIBE: ${dest.vibeCategory} // ${dest.climateCategory} CLIMATE`;
    if (titleEl) titleEl.textContent = dest.name.toUpperCase();
    if (countryEl) countryEl.textContent = `${dest.country} • ${dest.coordinates}`;
    if (quoteEl) quoteEl.textContent = `"${dest.tagline}"`;

    if (actionBtn) {
      actionBtn.onclick = () => {
        document.getElementById(`dest-${dest.id}`)?.scrollIntoView({ behavior: 'smooth' });
      };
    }
  }

  resetQuiz() {
    this.selectedMood = null;
    this.selectedClimate = null;
    this.resultEl.style.opacity = '0';
    this.resultEl.style.pointerEvents = 'none';

    setTimeout(() => {
      this.resultEl.style.display = 'none';
      this.step2El.style.display = 'none';
      this.step1El.style.display = 'block';
      setTimeout(() => {
        this.step1El.style.opacity = '1';
        this.step1El.style.pointerEvents = 'all';
      }, 50);
    }, 350);
  }
}

const aerisVibe = new AerisVibeMatcher();
