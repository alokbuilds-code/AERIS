/**
 * AERIS — Luxury Travel Dossier & Dynamic Expedition Estimator
 * Renders the route as an editorial itinerary:
 * KYOTO 04 DAYS ↓ ZERMATT 05 DAYS ↓ AMALFI 04 DAYS
 * Numerical tweening, tier modifiers, and formatted dossier export.
 */

class AerisExpedition {
  constructor() {
    this.savedIds = ['kyoto', 'banff', 'zermatt']; // Curated initial trio
    this.travelers = 2;
    this.days = 7;
    this.tierMultiplier = 1.0; // 0.65 Backpacker, 1.0 Comfort, 2.35 Ultra-Luxe
    this.currentDisplayedCost = 0;
    this.storageKey = 'aeris_dossier_state';
  }

  init() {
    this.loadState();
    this.bindEvents();
    this.updateUI();
  }

  loadState() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed.savedIds)) this.savedIds = parsed.savedIds;
        if (parsed.travelers) this.travelers = parsed.travelers;
        if (parsed.days) this.days = parsed.days;
        if (parsed.tierMultiplier) this.tierMultiplier = parsed.tierMultiplier;
      }
    } catch (e) {}
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        savedIds: this.savedIds,
        travelers: this.travelers,
        days: this.days,
        tierMultiplier: this.tierMultiplier
      }));
    } catch (e) {}
  }

  toggle(destId) {
    const exists = this.savedIds.includes(destId);
    if (exists) {
      this.savedIds = this.savedIds.filter(id => id !== destId);
      this.showToast('Removed from Expedition Dossier');
    } else {
      this.savedIds.push(destId);
      this.showToast('Added to Expedition Dossier');
      if (window.aerisAudio) aerisAudio.playUiTone('reveal');
    }
    this.saveState();
    this.updateUI();
  }

  has(destId) {
    return this.savedIds.includes(destId);
  }

  bindEvents() {
    const openBtn = document.getElementById('aeris-bag-trigger');
    const closeBtn = document.getElementById('aeris-drawer-close');
    const overlay = document.getElementById('aeris-drawer-overlay');
    const travelersInput = document.getElementById('aeris-calc-travelers');
    const daysInput = document.getElementById('aeris-calc-days');
    const tierRadios = document.querySelectorAll('input[name="aeris-calc-tier"]');
    const exportBtn = document.getElementById('aeris-export-itinerary-btn');

    if (openBtn) openBtn.addEventListener('click', () => this.openDrawer());
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeDrawer());
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeDrawer();
      });
    }

    if (travelersInput) {
      travelersInput.value = this.travelers;
      travelersInput.addEventListener('input', (e) => {
        this.travelers = parseInt(e.target.value) || 1;
        document.getElementById('aeris-travelers-display').textContent = `${this.travelers} ${this.travelers === 1 ? 'Explorer' : 'Explorers'}`;
        this.recalculateCost(true);
        this.saveState();
      });
    }

    if (daysInput) {
      daysInput.value = this.days;
      daysInput.addEventListener('input', (e) => {
        this.days = parseInt(e.target.value) || 1;
        document.getElementById('aeris-days-display').textContent = `${this.days} Days`;
        this.recalculateCost(true);
        this.saveState();
      });
    }

    tierRadios.forEach(radio => {
      if (parseFloat(radio.value) === this.tierMultiplier) radio.checked = true;
      radio.addEventListener('change', (e) => {
        this.tierMultiplier = parseFloat(e.target.value);
        this.recalculateCost(true);
        this.saveState();
        if (window.aerisAudio) aerisAudio.playUiTone('click');
      });
    });

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportItinerary());
    }
  }

  openDrawer() {
    const drawer = document.getElementById('aeris-drawer-overlay');
    if (drawer) {
      drawer.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (window.aerisAudio) aerisAudio.playUiTone('reveal');
    }
  }

  closeDrawer() {
    const drawer = document.getElementById('aeris-drawer-overlay');
    if (drawer) {
      drawer.classList.remove('active');
      document.body.style.overflow = '';
      if (window.aerisAudio) aerisAudio.playUiTone('click');
    }
  }

  updateUI() {
    const badge = document.getElementById('aeris-bag-count');
    if (badge) {
      badge.textContent = String(this.savedIds.length).padStart(2, '0');
    }

    // Toggle button state in all sections
    document.querySelectorAll('.btn-aeris-bookmark').forEach(btn => {
      const id = btn.getAttribute('data-id');
      const isSaved = this.has(id);
      btn.classList.toggle('saved', isSaved);
      btn.innerHTML = isSaved ? '<span>✓ IN EXPEDITION</span>' : '<span>+ SAVE TO EXPEDITION</span>';
    });

    // Render Itinerary Dossier
    const listContainer = document.getElementById('aeris-drawer-items-list');
    if (!listContainer) return;

    if (this.savedIds.length === 0) {
      listContainer.innerHTML = `
        <div class="aeris-drawer-empty">
          <span class="empty-glyph">✧</span>
          <p class="empty-title">YOUR DOSSIER IS VACANT</p>
          <p class="empty-sub">Explore the 09 curated sanctuaries and add chapters to sculpt your journey.</p>
        </div>
      `;
    } else {
      const items = AERIS_DESTINATIONS.filter(d => this.savedIds.includes(d.id));
      const htmlArray = [];

      items.forEach((d, i) => {
        htmlArray.push(`
          <div class="aeris-dossier-entry">
            <img src="${d.portraitImage}" alt="${d.name}" class="dossier-thumb" />
            <div class="dossier-info">
              <span class="dossier-coords">${d.index} // ${d.coordinates}</span>
              <h5 class="dossier-name">${d.name.toUpperCase()}</h5>
              <span class="dossier-tagline">${d.recommendedDays || 4} DAYS • ${d.country}</span>
            </div>
            <button class="dossier-remove-btn" onclick="aerisExpedition.toggle('${d.id}')" title="Remove">✕</button>
          </div>
        `);

        // Add editorial connector glyph between destinations
        if (i < items.length - 1) {
          htmlArray.push(`<div class="dossier-connector-glyph">↓</div>`);
        }
      });

      listContainer.innerHTML = htmlArray.join('');
    }

    this.recalculateCost(false);
  }

  recalculateCost(animate = true) {
    const totalEl = document.getElementById('aeris-calc-total');
    const breakdownEl = document.getElementById('aeris-calc-breakdown');
    if (!totalEl) return;

    const items = AERIS_DESTINATIONS.filter(d => this.savedIds.includes(d.id));
    if (items.length === 0) {
      this.animateNumberCounter(totalEl, 0);
      if (breakdownEl) breakdownEl.textContent = 'Add sanctuaries to compute itinerary investment';
      return;
    }

    const avgDailyBase = items.reduce((sum, d) => sum + d.dailyBudgetUSD, 0) / items.length;
    const finalTotal = Math.round(avgDailyBase * this.tierMultiplier * this.travelers * this.days);
    const perPerson = Math.round(finalTotal / this.travelers);

    if (animate) {
      this.animateNumberCounter(totalEl, finalTotal);
    } else {
      totalEl.textContent = `$${finalTotal.toLocaleString()}`;
      this.currentDisplayedCost = finalTotal;
    }

    if (breakdownEl) {
      breakdownEl.textContent = `~$${perPerson.toLocaleString()} per explorer • ${this.days} days in ${items.length} destination${items.length > 1 ? 's' : ''}`;
    }
  }

  animateNumberCounter(targetEl, targetNum) {
    const startNum = this.currentDisplayedCost;
    const startTime = performance.now();
    const duration = 450;

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(startNum + (targetNum - startNum) * ease);

      targetEl.textContent = `$${val.toLocaleString()}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.currentDisplayedCost = targetNum;
      }
    };
    requestAnimationFrame(step);
  }

  exportItinerary() {
    const items = AERIS_DESTINATIONS.filter(d => this.savedIds.includes(d.id));
    if (items.length === 0) {
      alert("Please add at least one destination to your expedition before exporting.");
      return;
    }

    const tierName = this.tierMultiplier === 0.65 ? 'Backpacker' : this.tierMultiplier === 1.0 ? 'Comfort' : 'Ultra-Luxe';
    const totalEstimate = document.getElementById('aeris-calc-total')?.textContent || '$0';

    const text = `
╔═══════════════════════════════════════════════════════════╗
   AERIS — BESPOKE EXPEDITION ITINERARY
   GO SOMEWHERE. FEEL EVERYTHING.
╚═══════════════════════════════════════════════════════════╝

EXPEDITION PARAMETERS:
• Explorers: ${this.travelers}
• Duration: ${this.days} Days
• Style: ${tierName} Tier
• Total Projected Investment: ${totalEstimate}

CURATED ROUTE (${items.length} SANCTUARIES):
${items.map((d, i) => `
[${d.index}] ${d.name.toUpperCase()}, ${d.country.toUpperCase()}
Coordinates: ${d.coordinates}
Vibe: ${d.vibeCategory}
Suggested Stay: ${d.recommendedDays || 4} Days
Key Landmarks: ${d.landmarks.join(', ')}
Prime Season: ${d.bestSeason}
Est. Daily Benchmark: $${d.dailyBudgetUSD}/day
`).join('\n↓\n')}

═════════════════════════════════════════════════════════════
AERIS LUXURY TRAVEL JOURNAL — CRAFTED FOR THE INTENTIONAL VOYAGER.
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Itinerary copied to clipboard!');
      if (window.aerisAudio) aerisAudio.playUiTone('reveal');
    }).catch(() => {
      prompt("Copy your itinerary text below:", text);
    });
  }

  showToast(msg) {
    let toast = document.getElementById('aeris-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'aeris-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }
}

const aerisExpedition = new AerisExpedition();
