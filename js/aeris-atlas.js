/**
 * AERIS — Live Interactive Dark World Atlas
 * Vector world map with geographic graticules, smooth camera focal tracking,
 * and live destination condition telemetry.
 */

class AerisWorldAtlas {
  constructor() {
    this.container = null;
    this.svg = null;
    this.card = null;
    this.activeDestId = null;
    this.defaultViewBox = { x: 0, y: 0, w: 1000, h: 500 };
    this.currentViewBox = { ...this.defaultViewBox };
    this.isZoomed = false;
  }

  init() {
    this.container = document.getElementById('aeris-atlas-wrapper');
    this.svg = document.getElementById('aeris-atlas-svg');
    this.card = document.getElementById('atlas-telemetry-card');
    this.resetBtn = document.getElementById('atlas-reset-btn');

    if (!this.container || !this.svg) return;

    this.renderMarkers();
    this.bindEvents();
    this.selectDestination(AERIS_DESTINATIONS[0].id, false);
  }

  renderMarkers() {
    const markersGroup = document.getElementById('atlas-markers-group');
    if (!markersGroup) return;

    markersGroup.innerHTML = AERIS_DESTINATIONS.map(d => {
      // Map percentage coords to 1000x500 viewBox
      const cx = (d.mapCoords.x / 100) * 1000;
      const cy = (d.mapCoords.y / 100) * 500;

      return `
        <g class="atlas-marker-node" data-id="${d.id}" transform="translate(${cx}, ${cy})">
          <circle class="marker-pulse-ring" r="16" />
          <circle class="marker-beacon-glow" r="7" />
          <circle class="marker-core-dot" r="3" />
          <text class="marker-label-text" x="12" y="4">${d.name.toUpperCase()}</text>
        </g>
      `;
    }).join('');
  }

  bindEvents() {
    // Marker click
    const markers = this.svg.querySelectorAll('.atlas-marker-node');
    markers.forEach(node => {
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = node.getAttribute('data-id');
        this.selectDestination(id, true);
        if (window.aerisAudio) aerisAudio.playUiTone('click');
      });
    });

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        this.resetCamera();
        if (window.aerisAudio) aerisAudio.playUiTone('click');
      });
    }

    // Backdrop click to reset zoom
    this.svg.addEventListener('click', (e) => {
      if (e.target.tagName === 'svg' || e.target.classList.contains('atlas-sea-bg')) {
        this.resetCamera();
      }
    });
  }

  selectDestination(destId, animateCamera = true) {
    const dest = AERIS_DESTINATIONS.find(d => d.id === destId);
    if (!dest) return;

    this.activeDestId = destId;

    // Highlight active marker
    this.svg.querySelectorAll('.atlas-marker-node').forEach(node => {
      node.classList.toggle('active', node.getAttribute('data-id') === destId);
    });

    // Update Telemetry Card
    this.updateTelemetryCard(dest);

    // Smoothly pan camera to destination coordinates
    if (animateCamera) {
      const targetCenterX = (dest.mapCoords.x / 100) * 1000;
      const targetCenterY = (dest.mapCoords.y / 100) * 500;
      const zoomW = 480;
      const zoomH = 240;
      const targetX = Math.max(0, Math.min(1000 - zoomW, targetCenterX - zoomW / 2));
      const targetY = Math.max(0, Math.min(500 - zoomH, targetCenterY - zoomH / 2));

      this.animateViewBox(targetX, targetY, zoomW, zoomH);
      this.isZoomed = true;
      if (this.resetBtn) this.resetBtn.style.opacity = '1';
    }
  }

  resetCamera() {
    this.animateViewBox(this.defaultViewBox.x, this.defaultViewBox.y, this.defaultViewBox.w, this.defaultViewBox.h);
    this.isZoomed = false;
    if (this.resetBtn) this.resetBtn.style.opacity = '0';
  }

  animateViewBox(targetX, targetY, targetW, targetH) {
    const startX = this.currentViewBox.x;
    const startY = this.currentViewBox.y;
    const startW = this.currentViewBox.w;
    const startH = this.currentViewBox.h;

    const startTime = performance.now();
    const duration = 750; // ms

    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = easeOutCubic(progress);

      this.currentViewBox.x = startX + (targetX - startX) * ease;
      this.currentViewBox.y = startY + (targetY - startY) * ease;
      this.currentViewBox.w = startW + (targetW - startW) * ease;
      this.currentViewBox.h = startH + (targetH - startH) * ease;

      this.svg.setAttribute('viewBox', `${this.currentViewBox.x} ${this.currentViewBox.y} ${this.currentViewBox.w} ${this.currentViewBox.h}`);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }

  updateTelemetryCard(dest) {
    if (!this.card) return;

    // Calculate live local time
    const nowUtc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
    const destDate = new Date(nowUtc + (3600000 * dest.timezoneOffset));
    const hours = String(destDate.getHours()).padStart(2, '0');
    const minutes = String(destDate.getMinutes()).padStart(2, '0');
    const localTimeStr = `${hours}:${minutes}`;

    this.card.innerHTML = `
      <div class="telemetry-header">
        <div>
          <span class="telemetry-idx">${dest.index} // ${dest.coordinates}</span>
          <h4 class="telemetry-title">${dest.name.toUpperCase()}</h4>
          <span class="telemetry-country">${dest.country} • ${dest.region}</span>
        </div>
        <div class="telemetry-thumb-crop">
          <img src="${dest.portraitImage}" alt="${dest.name}" />
        </div>
      </div>

      <div class="telemetry-stats-grid">
        <div class="telemetry-stat">
          <span class="stat-lbl">LOCAL TIME</span>
          <span class="stat-val live-time-val">${localTimeStr}</span>
        </div>
        <div class="telemetry-stat">
          <span class="stat-lbl">CONDITIONS</span>
          <span class="stat-val">${dest.weather.icon} ${dest.weather.temp}</span>
        </div>
        <div class="telemetry-stat">
          <span class="stat-lbl">ADVENTURE</span>
          <span class="stat-val">${dest.adventureScore} <span style="font-size:0.6em;color:var(--aeris-gold);">/100</span></span>
        </div>
        <div class="telemetry-stat">
          <span class="stat-lbl">DAILY FROM</span>
          <span class="stat-val">$${dest.dailyBudgetUSD}</span>
        </div>
      </div>

      <div class="telemetry-footer-bar">
        <span class="telemetry-season">Best Season: ${dest.bestSeason}</span>
        <button class="telemetry-jump-btn" onclick="document.getElementById('dest-${dest.id}').scrollIntoView({behavior:'smooth'})">
          View Story ↓
        </button>
      </div>
    `;
  }
}

const aerisAtlas = new AerisWorldAtlas();
