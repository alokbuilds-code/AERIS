/**
 * AERIS — Main Controller & Cinematic Orchestrator (Elite Edition)
 * First 5-second cinematic entry sequence, custom editorial cursor physics,
 * hero opening destination switcher, mouse depth parallax, and live clocks.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Submodules
  if (typeof aerisLightbox !== 'undefined') aerisLightbox.init();
  if (typeof aerisAtlas !== 'undefined') aerisAtlas.init();
  if (typeof aerisExpedition !== 'undefined') aerisExpedition.init();
  if (typeof aerisPostcard !== 'undefined') aerisPostcard.init();
  if (typeof aerisVibe !== 'undefined') aerisVibe.init();

  // Render Editorial Destination Chapters
  renderEditorialDestinations();

  // Initialize Custom Cursor
  initEditorialCursor();

  // Run the 5-Second Atmospheric Entry Sequence
  initCinematicEntrySequence();

  // Hero Opening Destination Selector
  initHeroDestinationSelector();

  // Hero Subtle Depth Parallax
  initHeroDepthParallax();

  // Live Clocks Ticker
  startLiveClocks();

  // Nav Scroll Behavior
  initNavScrollWatcher();

  // Atmospheric Theme Switcher
  initAtmosphereThemes();

  // Soundscape UI & Waveform Canvas
  initSoundscapeControls();
});

/* ===================================================================
   02 — THE FIRST 5 SECONDS (CINEMATIC ENTRY SEQUENCE)
   =================================================================== */
function initCinematicEntrySequence() {
  const curtain = document.getElementById('aeris-entry-curtain');
  const faintLine = document.getElementById('entry-audio-faint-line');
  const portal = document.getElementById('entry-emerging-portal');
  const centerText = document.getElementById('entry-center-typography');
  const shiftingCoords = document.getElementById('entry-shifting-coords');
  const pillarsText = document.getElementById('entry-meta-pillars');
  const navHeader = document.getElementById('aeris-main-nav');

  if (!curtain) return;

  // Accessibility override
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    curtain.classList.add('revealed');
    if (navHeader) navHeader.classList.add('active-visible');
    return;
  }

  // 0.5s: Faint sound line ripples in center
  setTimeout(() => {
    if (faintLine) faintLine.style.width = '200px';
  }, 500);

  // 1.0s: Coordinates appear (Kyoto)
  setTimeout(() => {
    if (shiftingCoords) {
      shiftingCoords.textContent = '35.0116° N // 135.7681° E';
      shiftingCoords.style.opacity = '1';
    }
  }, 1000);

  // 1.3s: AERIS Logo and Tagline fade in
  setTimeout(() => {
    if (centerText) {
      centerText.style.opacity = '1';
      centerText.style.transform = 'translateY(0)';
    }
  }, 1300);

  // 2.2s: Coordinates shift (Banff)
  setTimeout(() => {
    if (shiftingCoords) {
      shiftingCoords.style.opacity = '0';
      setTimeout(() => {
        shiftingCoords.textContent = '51.1784° N // 115.5708° W';
        shiftingCoords.style.opacity = '1';
      }, 250);
    }
  }, 2200);

  // 3.0s: Background begins revealing destination photograph
  setTimeout(() => {
    if (portal) {
      portal.style.opacity = '0.9';
      portal.style.width = '380px';
      portal.style.height = '140px';
    }
  }, 3000);

  // 3.6s: Portal expands to fill full viewport
  setTimeout(() => {
    if (portal) {
      portal.style.width = '100vw';
      portal.style.height = '100vh';
    }
  }, 3600);

  // 4.2s: Typography layers separate upward
  setTimeout(() => {
    if (centerText) {
      centerText.style.transform = 'translateY(-28px)';
    }
  }, 4200);

  // 4.6s: Metadata pillars appear ("SCROLL TO ENTER")
  setTimeout(() => {
    if (pillarsText) {
      pillarsText.style.opacity = '1';
    }
  }, 4600);

  // Transition into actual experience on scroll or at 5.4s
  const enterExperience = () => {
    curtain.classList.add('revealed');
    if (navHeader) navHeader.classList.add('active-visible');
    window.removeEventListener('wheel', enterExperience);
    window.removeEventListener('keydown', enterExperience);
    window.removeEventListener('touchstart', enterExperience);
  };

  setTimeout(() => {
    window.addEventListener('wheel', enterExperience, { passive: true });
    window.addEventListener('keydown', enterExperience);
    window.addEventListener('touchstart', enterExperience, { passive: true });
  }, 4700);

  setTimeout(enterExperience, 5800);
}

/* ===================================================================
   17 — CUSTOM EDITORIAL CURSOR (LERP PHYSICS)
   =================================================================== */
function initEditorialCursor() {
  const dot = document.querySelector('.aeris-cursor-dot');
  const ring = document.querySelector('.aeris-cursor-ring');
  const ringSpan = ring ? ring.querySelector('span') : null;

  if (!dot || !ring) return;

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
  });

  // Smooth lerp frame loop
  function renderCursor() {
    ringX += (mouseX - ringX) * 0.16;
    ringY += (mouseY - ringY) * 0.16;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(renderCursor);
  }
  renderCursor();

  // Hover reactive bindings
  const addHover = (selector, className, label = '') => {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('mouseenter', () => {
        ring.classList.add(className);
        if (ringSpan) ringSpan.textContent = label;
      });
      el.addEventListener('mouseleave', () => {
        ring.classList.remove(className);
        if (ringSpan) ringSpan.textContent = '';
      });
    });
  };

  addHover('button, a, input, select, textarea, .stamp-option-btn', 'hover-interactive');
  addHover('.dest-chapter-hero, .diptych-media-frame, .vibe-photo-choice', 'hover-view', 'VIEW');
  addHover('.dest-chapter-title, .dest-chapter-index', 'hover-view', 'EXPLORE');
}

/* ===================================================================
   06 — HERO OPENING DESTINATION SELECTOR
   =================================================================== */
function initHeroDestinationSelector() {
  const buttons = document.querySelectorAll('.hero-opening-btn');
  const heroImg = document.querySelector('.hero-cinematic-photo');
  const heroClock = document.getElementById('hero-live-clock');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const destId = btn.getAttribute('data-hero-dest');
      const dest = AERIS_DESTINATIONS.find(d => d.id === destId);
      if (!dest || !heroImg) return;

      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Crossfade hero photo
      heroImg.style.opacity = '0.4';
      setTimeout(() => {
        heroImg.src = dest.heroImage;
        heroImg.onload = () => {
          heroImg.style.opacity = '1';
        };
      }, 150);

      // Update telemetry bar
      if (heroClock) {
        const nowUtc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
        const destDate = new Date(nowUtc + (3600000 * dest.timezoneOffset));
        heroClock.textContent = `${String(destDate.getHours()).padStart(2, '0')}:${String(destDate.getMinutes()).padStart(2, '0')} UTC${dest.timezoneOffset >= 0 ? '+' : ''}${dest.timezoneOffset}`;
      }

      if (window.aerisAudio) aerisAudio.playUiTone('click');
    });
  });
}

/* ===================================================================
   06 — SUBTLE MOUSE DEPTH PARALLAX
   =================================================================== */
function initHeroDepthParallax() {
  const hero = document.querySelector('.aeris-hero-viewport');
  const photo = document.querySelector('.hero-cinematic-photo');
  const centerText = document.querySelector('.hero-editorial-center');

  if (!hero || !photo || !centerText) return;

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width - 0.5;
    const yRatio = (e.clientY - rect.top) / rect.height - 0.5;

    // Extremely small, sophisticated depth shift (no wobble)
    photo.style.transform = `scale(1.05) translate(${xRatio * -12}px, ${yRatio * -10}px)`;
    centerText.style.transform = `translate(${xRatio * 8}px, ${yRatio * 6}px)`;
  });

  hero.addEventListener('mouseleave', () => {
    photo.style.transform = 'scale(1.04) translate(0, 0)';
    centerText.style.transform = 'translate(0, 0)';
  });
}

/* ===================================================================
   08 & 23 — RENDER 09 EDITORIAL DESTINATION CHAPTERS
   =================================================================== */
function renderEditorialDestinations() {
  const container = document.getElementById('aeris-destinations-flow');
  if (!container) return;

  container.innerHTML = AERIS_DESTINATIONS.map(d => {
    const isSaved = aerisExpedition.has(d.id);
    return `
      <article id="dest-${d.id}" class="dest-chapter-section" data-dest-id="${d.id}">
        <!-- 1. Large Heroic Opening Screen -->
        <div class="dest-chapter-hero">
          <img src="${d.heroImage}" alt="${d.name}, ${d.country}" class="dest-chapter-hero-img" loading="lazy" />
          <div class="dest-chapter-hero-overlay">
            <span class="dest-chapter-index">${d.index}</span>
            <h2 class="dest-chapter-title">${d.name}</h2>
            <span class="dest-chapter-subhead">${d.country} • ${d.vibeCategory}</span>
          </div>
        </div>

        <!-- 2. Extreme Whitespace & Monocle Stark Prose -->
        <div class="dest-meditation-strip">
          <span class="dest-essence-badge">ESSENCE // ${d.essenceWord || 'ATMOSPHERE'}</span>
          <p class="dest-philosophical-quote">“${d.tagline}”</p>
          <p class="dest-narrative-prose">${d.narrative}</p>
        </div>

        <!-- 3. Architectural Diptych Grid -->
        <div class="dest-diptych-grid">
          <!-- Photographic Media Column -->
          <div class="diptych-media">
            <div class="diptych-media-frame">
              <img src="${d.portraitImage}" alt="${d.name} Perspective" loading="lazy" />
              <div class="diptych-caption-bar">
                <span>PLATE ${d.index}.B // ${d.coordinates}</span>
                <button class="btn-open-gallery-action" onclick="aerisLightbox.open(AERIS_DESTINATIONS.find(x=>x.id==='${d.id}').gallery, 0, '${d.name}, ${d.country}')">
                  PHOTOGRAPHIC PORTFOLIO (${d.gallery.length}) →
                </button>
              </div>
            </div>
          </div>

          <!-- Live Telemetry & Landmarks Column -->
          <div class="diptych-data-column">
            <span class="chapter-telemetry-heading">DESTINATION TELEMETRY & CONDITIONS</span>
            
            <div class="chapter-live-data-matrix">
              <div class="data-matrix-node">
                <span class="matrix-label">LOCAL TIME</span>
                <span class="matrix-value live-dest-clock" data-offset="${d.timezoneOffset}">--:--</span>
              </div>
              <div class="data-matrix-node">
                <span class="matrix-label">CONDITIONS</span>
                <span class="matrix-value">${d.weather.icon} ${d.weather.temp}</span>
              </div>
              <div class="data-matrix-node">
                <span class="matrix-label">ADVENTURE INDEX</span>
                <span class="matrix-value">${d.adventureScore} <span style="font-size:0.65em;color:var(--aeris-gold)">/100</span></span>
              </div>
              <div class="data-matrix-node">
                <span class="matrix-label">BENCHMARK INVEST</span>
                <span class="matrix-value">$${d.dailyBudgetUSD} <span style="font-size:0.65em;color:var(--aeris-ivory-subtle)">/DAY</span></span>
              </div>
            </div>

            <!-- Landmarks -->
            <div class="chapter-landmarks-list">
              ${d.landmarks.map(l => `<div class="chapter-landmark-entry">${l}</div>`).join('')}
            </div>

            <!-- Action Suite -->
            <div class="chapter-actions-suite">
              <button class="btn-aeris-bookmark ${isSaved ? 'saved' : ''}" data-id="${d.id}" onclick="aerisExpedition.toggle('${d.id}')">
                <span>${isSaved ? '✓ IN EXPEDITION' : '+ SAVE TO EXPEDITION'}</span>
              </button>
              <button class="btn-aeris-postcard-trigger" onclick="aerisPostcard.selectedDest = AERIS_DESTINATIONS.find(x=>x.id==='${d.id}'); aerisPostcard.updatePreview(); document.getElementById('postcard-studio').scrollIntoView({behavior:'smooth'});">
                ✉️ Craft Postcard
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/* ===================================================================
   11 — LIVE TIME TELEMETRY CALCULATOR
   =================================================================== */
function startLiveClocks() {
  function tick() {
    const nowUtc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
    document.querySelectorAll('.live-dest-clock').forEach(el => {
      const offset = parseFloat(el.getAttribute('data-offset')) || 0;
      const destDate = new Date(nowUtc + (3600000 * offset));
      const hours = String(destDate.getHours()).padStart(2, '0');
      const mins = String(destDate.getMinutes()).padStart(2, '0');
      el.textContent = `${hours}:${mins}`;
    });

    const heroClock = document.getElementById('hero-live-clock');
    if (heroClock) {
      const kyotoDate = new Date(nowUtc + (3600000 * 9));
      heroClock.textContent = `${String(kyotoDate.getHours()).padStart(2, '0')}:${String(kyotoDate.getMinutes()).padStart(2, '0')} JST`;
    }
  }

  tick();
  setInterval(tick, 30000);
}

/* ===================================================================
   04 — NAVIGATION SCROLL WATCHER
   =================================================================== */
function initNavScrollWatcher() {
  const nav = document.getElementById('aeris-main-nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });
}

/* ===================================================================
   18 — ATMOSPHERIC THEMES (1-SECOND ENVIRONMENTAL CROSS-FADE)
   =================================================================== */
function initAtmosphereThemes() {
  const buttons = document.querySelectorAll('.atmosphere-btn');
  const saved = localStorage.getItem('aeris_theme') || 'atmosphere-midnight';

  applyTheme(saved);

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme');
      applyTheme(theme);
      if (window.aerisAudio) aerisAudio.playUiTone('click');
    });
  });

  function applyTheme(theme) {
    document.body.classList.remove('atmosphere-midnight', 'atmosphere-golden', 'atmosphere-emerald');
    if (theme !== 'atmosphere-midnight') {
      document.body.classList.add(theme);
    }
    localStorage.setItem('aeris_theme', theme);

    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
    });
  }
}

/* ===================================================================
   12 — SOUNDSCAPE CONTROLS & WAVEFORM CANVAS
   =================================================================== */
function initSoundscapeControls() {
  const trackBtns = document.querySelectorAll('.aeris-track-btn');
  const volumeSlider = document.getElementById('sound-volume-slider');
  const canvas = document.getElementById('sound-waveform-canvas');
  let ctx = canvas ? canvas.getContext('2d') : null;

  trackBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const track = btn.getAttribute('data-track');
      const isNowPlaying = aerisAudio.playTrack(track);

      trackBtns.forEach(b => b.classList.remove('active'));
      if (isNowPlaying) {
        btn.classList.add('active');
        drawWaveform();
      }
    });
  });

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      aerisAudio.setVolume(parseFloat(e.target.value));
    });
  }

  function drawWaveform() {
    if (!canvas || !ctx || !aerisAudio.analyzer) return;
    const bufferLength = aerisAudio.analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function frame() {
      if (!aerisAudio.isPlaying) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      requestAnimationFrame(frame);
      aerisAudio.analyzer.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.4;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = 'rgba(197, 160, 89, 0.75)';
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    }
    frame();
  }
}
