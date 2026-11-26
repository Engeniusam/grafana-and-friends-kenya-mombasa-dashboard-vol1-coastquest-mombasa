const STORAGE_SAVED_KEY = 'coastquest_saved_ids_v1';
const STORAGE_ITINERARY_KEY = 'coastquest_itinerary_ids_v1';

const state = {
  allAttractions: [],
  filteredAttractions: [],
  selectedCategory: 'All',
  searchQuery: '',
  sortBy: 'popular',
  activeTab: 'discover',
  savedIds: new Set(loadStoredIds(STORAGE_SAVED_KEY, ['fort-jesus', 'nyali-beach'])),
  itineraryIds: loadStoredIds(STORAGE_ITINERARY_KEY, ['fort-jesus']),
  activeModalAttraction: null,
  modalImageIndex: 0,
  selectedMapId: 'fort-jesus',
};

function loadStoredIds(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveStoredIds(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Ignore storage quota issues
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPriceKes(amount) {
  if (!amount) return 'FREE';
  return `KES ${Number(amount).toLocaleString('en-KE')}`;
}

// DOM References
const els = {
  searchInput: document.getElementById('search-input'),
  clearSearchBtn: document.getElementById('clear-search-btn'),
  categoryPills: document.querySelectorAll('.category-pill'),
  collectionBtns: document.querySelectorAll('.collection-btn'),
  foodDelightBtns: document.querySelectorAll('.food-delight-btn'),
  mustTryFoodBtn: document.getElementById('must-try-food-btn'),
  sortSelect: document.getElementById('sort-select'),
  resetFiltersBtn: document.getElementById('reset-filters-btn'),
  emptyResetBtn: document.getElementById('empty-reset-btn'),
  retryLoadBtn: document.getElementById('retry-load-btn'),
  resultsSubtitle: document.getElementById('results-subtitle'),
  heroSpotsCount: document.getElementById('hero-spots-count'),
  attractionsGrid: document.getElementById('attractions-grid'),
  attractionsLoading: document.getElementById('attractions-loading'),
  attractionsError: document.getElementById('attractions-error'),
  attractionsEmpty: document.getElementById('attractions-empty'),
  savedCountBadge: document.getElementById('saved-count-badge'),
  itineraryCountBadge: document.getElementById('itinerary-count-badge'),
  savedHeaderBtn: document.getElementById('saved-header-btn'),
  itineraryHeaderBtn: document.getElementById('itinerary-header-btn'),
  brandHomeBtn: document.getElementById('brand-home-btn'),
  heroExploreBtn: document.getElementById('hero-explore-btn'),
  heroItineraryBtn: document.getElementById('hero-itinerary-btn'),
  navTabs: document.querySelectorAll('.nav-tab'),
  views: {
    discover: document.getElementById('view-discover'),
    planner: document.getElementById('view-planner'),
    map: document.getElementById('view-map'),
    saved: document.getElementById('view-saved'),
  },
  // Planner elements
  plannerStopsTotal: document.getElementById('planner-stops-total'),
  plannerBudgetTotal: document.getElementById('planner-budget-total'),
  plannerHoursTotal: document.getElementById('planner-hours-total'),
  plannerList: document.getElementById('planner-list'),
  plannerEmpty: document.getElementById('planner-empty'),
  plannerClearBtn: document.getElementById('planner-clear-btn'),
  plannerBrowseBtn: document.getElementById('planner-browse-btn'),
  // Saved elements
  savedGrid: document.getElementById('saved-grid'),
  savedEmpty: document.getElementById('saved-empty'),
  savedBrowseBtn: document.getElementById('saved-browse-btn'),
  // Map elements
  mapPinsLayer: document.getElementById('map-pins-layer'),
  mapPreviewCard: document.getElementById('map-preview-card'),
  // Modal elements
  modal: document.getElementById('attraction-modal'),
  closeModalBtn: document.getElementById('close-modal-btn'),
  modalImage: document.getElementById('modal-image'),
  modalBadgeText: document.getElementById('modal-badge-text'),
  modalPrevImg: document.getElementById('modal-prev-img'),
  modalNextImg: document.getElementById('modal-next-img'),
  modalGalleryDots: document.getElementById('modal-gallery-dots'),
  modalRating: document.getElementById('modal-rating'),
  modalReviews: document.getElementById('modal-reviews'),
  modalTitle: document.getElementById('modal-title'),
  modalPrice: document.getElementById('modal-price'),
  modalPriceUnit: document.getElementById('modal-price-unit'),
  modalLocation: document.getElementById('modal-location'),
  modalWeather: document.getElementById('modal-weather'),
  modalDescription: document.getElementById('modal-description'),
  modalHours: document.getElementById('modal-hours'),
  modalHoursNote: document.getElementById('modal-hours-note'),
  modalTierPrimary: document.getElementById('modal-tier-primary'),
  modalTierSecondary: document.getElementById('modal-tier-secondary'),
  modalTips: document.getElementById('modal-tips'),
  modalNearby: document.getElementById('modal-nearby'),
  modalDirectionsLink: document.getElementById('modal-directions-link'),
  modalItineraryBtn: document.getElementById('modal-itinerary-btn'),
};

function getBadgeClasses(style) {
  if (style === 'ocean') return 'bg-secondary text-on-secondary';
  if (style === 'teal') return 'bg-secondary-container text-on-secondary-container';
  return 'bg-primary-container/85 backdrop-blur-md text-on-primary';
}

function getBadgeIconClasses(style) {
  if (style === 'dark') return 'text-tertiary-fixed';
  return '';
}

function createAttractionCard(item) {
  const isSaved = state.savedIds.has(item.id);
  const priceTextClass = item.isFree ? 'text-on-tertiary-container' : 'text-on-surface';
  const ctaClass = item.ctaHighlight
    ? 'bg-primary text-on-primary'
    : 'bg-surface-container-high text-on-surface hover:bg-surface-variant';

  const article = document.createElement('article');
  article.className =
    'bg-surface-container-lowest rounded-2xl overflow-hidden shadow-md transition-shadow hover:shadow-lg flex flex-col';

  article.innerHTML = `
    <div class="relative w-full h-44 bg-gradient-to-br from-primary-container via-secondary to-primary-container overflow-hidden">
      <img
        src="${escapeHtml(item.image)}"
        alt="${escapeHtml(item.imageAlt || item.name)}"
        referrerpolicy="no-referrer"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
      />
      <div class="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full ${getBadgeClasses(item.badgeStyle)} font-label-sm text-label-sm">
        <span class="material-symbols-outlined text-[13px] ${getBadgeIconClasses(item.badgeStyle)}">${escapeHtml(item.badgeIcon)}</span>
        <span>${escapeHtml(item.badgeLabel)}</span>
      </div>
      <button
        type="button"
        data-bookmark-id="${escapeHtml(item.id)}"
        aria-label="${isSaved ? 'Remove from saved' : 'Bookmark attraction'}"
        class="bookmark-btn absolute top-3 right-3 w-10 h-10 rounded-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center text-on-surface shadow-sm hover:scale-105 transition-transform"
      >
        <span
          class="material-symbols-outlined text-[18px] ${isSaved ? 'text-secondary' : ''}"
          style="font-variation-settings: 'FILL' ${isSaved ? 1 : 0};"
        >${isSaved ? 'bookmark' : 'bookmark_border'}</span>
      </button>
      <div class="absolute bottom-2.5 left-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface font-label-sm text-label-sm">
        <span class="material-symbols-outlined text-[14px] text-secondary">near_me</span>
        <span>${escapeHtml(item.distanceLabel)}</span>
      </div>
    </div>
    <div class="p-4 space-y-3 flex-1 flex flex-col justify-between">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <h3 class="font-headline-sm text-headline-sm text-on-surface truncate">${escapeHtml(item.shortName || item.name)}</h3>
          <p class="font-body-sm text-body-sm text-outline">${escapeHtml(item.bestTime)}</p>
        </div>
        <div class="text-right flex-shrink-0">
          <span class="font-headline-sm text-headline-sm ${priceTextClass} font-bold tabular-nums">${escapeHtml(item.priceDisplay)}</span>
          <p class="font-label-sm text-label-sm text-outline">${escapeHtml(item.priceUnit)}</p>
        </div>
      </div>
      <div class="flex items-center justify-between pt-1">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px] text-secondary" style="font-variation-settings: 'FILL' 1;">star</span>
            <span class="font-label-md text-label-md text-on-surface tabular-nums">${escapeHtml(item.rating.toFixed(1))}</span>
            <span class="font-label-sm text-label-sm text-outline tabular-nums">(${escapeHtml(item.reviewsLabel)})</span>
          </div>
          <span class="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
            <span class="material-symbols-outlined text-[14px]">timer</span>
            <span>${escapeHtml(item.durationLabel)}</span>
          </span>
        </div>
        <button
          type="button"
          data-details-id="${escapeHtml(item.id)}"
          class="open-modal-trigger px-4 py-2 min-h-[40px] rounded-xl ${ctaClass} font-label-md text-label-md flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform whitespace-nowrap"
        >
          <span>View Details</span>
          <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  `;

  // Image graceful fallback if external image cannot load
  const img = article.querySelector('img');
  if (img) {
    img.addEventListener('error', () => {
      img.classList.add('hidden');
    });
  }

  return article;
}

function updateHeaderCounts() {
  if (els.savedCountBadge) {
    els.savedCountBadge.textContent = String(state.savedIds.size);
  }
  if (els.itineraryCountBadge) {
    els.itineraryCountBadge.textContent = String(state.itineraryIds.length);
  }
}

function updateCategoryPillsUI() {
  els.categoryPills.forEach((pill) => {
    const cat = pill.getAttribute('data-category');
    const isActive = cat === state.selectedCategory;
    pill.className = isActive
      ? 'category-pill flex-shrink-0 px-4 py-1.5 min-h-[36px] rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-sm transition-colors whitespace-nowrap'
      : 'category-pill flex-shrink-0 px-4 py-1.5 min-h-[36px] rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high transition-colors whitespace-nowrap';
  });

  els.collectionBtns.forEach((btn) => {
    const ring = btn.querySelector('.collection-ring');
    if (!ring) return;
    const isActive = btn.getAttribute('data-collection-category') === state.selectedCategory;
    ring.className = isActive
      ? 'collection-ring relative w-18 h-18 p-1 rounded-full bg-gradient-to-tr from-secondary to-tertiary-fixed shadow-md group-hover:scale-105 transition-transform'
      : 'collection-ring relative w-18 h-18 p-1 rounded-full bg-surface-container-high group-hover:scale-105 transition-transform';
  });
}

function applyFiltersAndRender() {
  const query = state.searchQuery.trim().toLowerCase();
  const cat = state.selectedCategory;

  let results = state.allAttractions.filter((item) => {
    const matchesCategory =
      cat === 'All' ||
      item.primaryCategory === cat ||
      (Array.isArray(item.categories) && item.categories.includes(cat));

    if (!matchesCategory) return false;
    if (!query) return true;

    const haystack = [
      item.name,
      item.shortName,
      item.neighborhood,
      item.address,
      item.primaryCategory,
      ...(item.categories || []),
      item.bestTime,
      item.description,
      ...(item.tips || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });

  if (state.sortBy === 'price-asc') {
    results = [...results].sort((a, b) => a.priceKes - b.priceKes);
  } else if (state.sortBy === 'rating-desc') {
    results = [...results].sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
  } else if (state.sortBy === 'nearest') {
    results = [...results].sort((a, b) => a.distanceKm - b.distanceKm);
  } else {
    results = [...results].sort((a, b) => b.popularityScore - a.popularityScore);
  }

  state.filteredAttractions = results;

  const isFiltered = cat !== 'All' || query.length > 0 || state.sortBy !== 'popular';
  els.resetFiltersBtn.classList.toggle('hidden', !isFiltered);
  els.clearSearchBtn.classList.toggle('hidden', query.length === 0);

  if (results.length === state.allAttractions.length && cat === 'All' && !query) {
    els.resultsSubtitle.textContent = 'Ranked by real visitor verification & proximity';
  } else {
    els.resultsSubtitle.textContent = `Showing ${results.length} of ${state.allAttractions.length} Mombasa spots${
      cat !== 'All' ? ` in ${cat}` : ''
    }${query ? ` matching "${state.searchQuery.trim()}"` : ''}`;
  }

  els.attractionsGrid.innerHTML = '';
  if (results.length === 0) {
    els.attractionsEmpty.classList.remove('hidden');
  } else {
    els.attractionsEmpty.classList.add('hidden');
    const frag = document.createDocumentFragment();
    results.forEach((item) => frag.appendChild(createAttractionCard(item)));
    els.attractionsGrid.appendChild(frag);
  }
}

async function fetchAttractions() {
  els.attractionsLoading.classList.remove('hidden');
  els.attractionsError.classList.add('hidden');
  els.attractionsEmpty.classList.add('hidden');
  els.attractionsGrid.innerHTML = '';

  try {
    const response = await fetch('/api/attractions');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    state.allAttractions = Array.isArray(payload.attractions) ? payload.attractions : [];

    if (els.heroSpotsCount) {
      els.heroSpotsCount.textContent = `${state.allAttractions.length} Spots`;
    }

    els.attractionsLoading.classList.add('hidden');
    applyFiltersAndRender();
    renderSavedView();
    renderPlannerView();
    renderMapView();
  } catch (err) {
    console.error('Failed to load attractions:', err);
    els.attractionsLoading.classList.add('hidden');
    els.attractionsError.classList.remove('hidden');
    els.resultsSubtitle.textContent = 'Could not load Mombasa attractions';
  }
}

function toggleBookmark(id) {
  if (state.savedIds.has(id)) {
    state.savedIds.delete(id);
  } else {
    state.savedIds.add(id);
  }
  saveStoredIds(STORAGE_SAVED_KEY, Array.from(state.savedIds));
  updateHeaderCounts();
  applyFiltersAndRender();
  renderSavedView();
}

function toggleItinerary(id) {
  const index = state.itineraryIds.indexOf(id);
  if (index >= 0) {
    state.itineraryIds.splice(index, 1);
  } else {
    state.itineraryIds.push(id);
  }
  saveStoredIds(STORAGE_ITINERARY_KEY, state.itineraryIds);
  updateHeaderCounts();
  updateModalItineraryButton();
  renderPlannerView();
}

function updateModalItineraryButton() {
  if (!state.activeModalAttraction || !els.modalItineraryBtn) return;
  const isAdded = state.itineraryIds.includes(state.activeModalAttraction.id);
  if (isAdded) {
    els.modalItineraryBtn.className =
      'h-12 px-5 rounded-xl bg-on-tertiary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all whitespace-nowrap';
    els.modalItineraryBtn.innerHTML =
      '<span class="material-symbols-outlined text-[20px]">check_circle</span><span>In Itinerary</span>';
  } else {
    els.modalItineraryBtn.className =
      'h-12 px-5 rounded-xl bg-secondary text-on-secondary font-label-lg text-label-lg flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all whitespace-nowrap';
    els.modalItineraryBtn.innerHTML =
      '<span class="material-symbols-outlined text-[20px]">add</span><span>Add to Itinerary</span>';
  }
}

function renderModalGallery(attraction) {
  const gallery =
    Array.isArray(attraction.gallery) && attraction.gallery.length > 0
      ? attraction.gallery
      : [attraction.image];

  const safeIndex = ((state.modalImageIndex % gallery.length) + gallery.length) % gallery.length;
  state.modalImageIndex = safeIndex;

  els.modalImage.src = gallery[safeIndex];
  els.modalImage.alt = attraction.imageAlt || attraction.name;
  els.modalImage.classList.remove('hidden');

  const hasMultiple = gallery.length > 1;
  els.modalPrevImg.classList.toggle('hidden', !hasMultiple);
  els.modalNextImg.classList.toggle('hidden', !hasMultiple);

  els.modalGalleryDots.innerHTML = '';
  if (hasMultiple) {
    gallery.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.ariaLabel = `Photo ${idx + 1}`;
      dot.className =
        idx === safeIndex
          ? 'w-5 h-1.5 rounded-full bg-surface-container-lowest transition-all'
          : 'w-1.5 h-1.5 rounded-full bg-surface-container-lowest/60 hover:bg-surface-container-lowest transition-all';
      dot.addEventListener('click', () => {
        state.modalImageIndex = idx;
        renderModalGallery(attraction);
      });
      els.modalGalleryDots.appendChild(dot);
    });
  }
}

function openModalById(id) {
  const attraction = state.allAttractions.find((item) => item.id === id);
  if (!attraction) return;

  state.activeModalAttraction = attraction;
  state.modalImageIndex = 0;

  renderModalGallery(attraction);

  els.modalBadgeText.textContent = attraction.modalBadge || attraction.primaryCategory;
  els.modalRating.textContent = attraction.rating.toFixed(1);
  els.modalReviews.textContent = `(${Number(attraction.reviewsCount).toLocaleString('en-US')} reviews)`;
  els.modalTitle.textContent = attraction.name;
  els.modalPrice.textContent = attraction.priceDisplay;
  els.modalPriceUnit.textContent = attraction.modalPriceUnit || attraction.priceUnit;
  els.modalLocation.textContent = `${attraction.address} • ${attraction.distanceKm} km away`;
  els.modalWeather.textContent = attraction.weatherNote || '28°C Coastal Breeze';
  els.modalDescription.textContent = attraction.description;

  els.modalHours.textContent = attraction.openingHours?.hours || '8:00 AM – 6:00 PM';
  els.modalHoursNote.textContent = attraction.openingHours?.note || 'Daily';
  els.modalTierPrimary.textContent = attraction.admissionTiers?.primary || attraction.priceDisplay;
  els.modalTierSecondary.textContent = attraction.admissionTiers?.secondary || attraction.priceUnit;

  // Populate Curated Tips
  els.modalTips.innerHTML = '';
  (attraction.tips || []).forEach((tip) => {
    const li = document.createElement('li');
    li.className = 'flex items-start gap-2';
    li.innerHTML = `
      <span class="material-symbols-outlined text-[16px] text-secondary mt-0.5 flex-shrink-0">check_circle</span>
      <span>${escapeHtml(tip)}</span>
    `;
    els.modalTips.appendChild(li);
  });

  // Populate Nearby Recommendations
  els.modalNearby.innerHTML = '';
  (attraction.nearby || []).forEach((spot) => {
    const card = document.createElement('div');
    card.className = 'flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container-low';
    card.innerHTML = `
      <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary flex-shrink-0">
        <span class="material-symbols-outlined text-[20px]">${escapeHtml(spot.icon || 'place')}</span>
      </div>
      <div class="min-w-0">
        <p class="font-label-md text-label-md text-on-surface truncate">${escapeHtml(spot.name)}</p>
        <p class="font-label-sm text-label-sm text-outline truncate">${escapeHtml(spot.detail)}</p>
      </div>
    `;
    els.modalNearby.appendChild(card);
  });

  // Directions Link
  const { lat, lng } = attraction.coordinates || { lat: -4.0435, lng: 39.6682 };
  els.modalDirectionsLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${lat},${lng}`
  )}`;

  updateModalItineraryButton();

  els.modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  els.closeModalBtn.focus();
}

function closeModal() {
  els.modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
  state.activeModalAttraction = null;
}

function switchTab(tabName) {
  state.activeTab = tabName;

  Object.entries(els.views).forEach(([key, viewEl]) => {
    if (!viewEl) return;
    viewEl.classList.toggle('hidden', key !== tabName);
  });

  els.navTabs.forEach((tabBtn) => {
    const isCurrent = tabBtn.getAttribute('data-tab') === tabName;
    tabBtn.className = isCurrent
      ? 'nav-tab flex flex-col items-center justify-center min-h-[44px] text-secondary font-label-md transition-colors'
      : 'nav-tab flex flex-col items-center justify-center min-h-[44px] text-on-surface-variant hover:text-on-surface transition-colors';
  });

  if (tabName === 'planner') renderPlannerView();
  if (tabName === 'saved') renderSavedView();
  if (tabName === 'map') renderMapView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderSavedView() {
  const savedItems = state.allAttractions.filter((item) => state.savedIds.has(item.id));
  els.savedGrid.innerHTML = '';

  if (savedItems.length === 0) {
    els.savedEmpty.classList.remove('hidden');
  } else {
    els.savedEmpty.classList.add('hidden');
    const frag = document.createDocumentFragment();
    savedItems.forEach((item) => frag.appendChild(createAttractionCard(item)));
    els.savedGrid.appendChild(frag);
  }
}

function renderPlannerView() {
  const plannedItems = state.itineraryIds
    .map((id) => state.allAttractions.find((item) => item.id === id))
    .filter(Boolean);

  const totalBudget = plannedItems.reduce((sum, item) => sum + (item.priceKes || 0), 0);
  const totalHours = plannedItems.reduce((sum, item) => sum + (item.durationHours || 2), 0);

  els.plannerStopsTotal.textContent = String(plannedItems.length);
  els.plannerBudgetTotal.textContent = formatPriceKes(totalBudget);
  els.plannerHoursTotal.textContent = `${totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)} hrs`;

  els.plannerClearBtn.classList.toggle('hidden', plannedItems.length === 0);
  els.plannerEmpty.classList.toggle('hidden', plannedItems.length > 0);
  els.plannerList.innerHTML = '';

  plannedItems.forEach((item, index) => {
    const row = document.createElement('div');
    row.className =
      'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface-container-lowest shadow-sm';
    row.innerHTML = `
      <div class="flex items-center gap-3.5 min-w-0">
        <span class="w-8 h-8 rounded-full bg-primary-container text-on-primary font-label-md text-label-md flex items-center justify-center flex-shrink-0 tabular-nums">${index + 1}</span>
        <img
          src="${escapeHtml(item.image)}"
          alt="${escapeHtml(item.name)}"
          referrerpolicy="no-referrer"
          class="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-surface-container"
        />
        <div class="min-w-0">
          <h3 class="font-headline-sm text-headline-sm text-on-surface truncate">${escapeHtml(item.name)}</h3>
          <p class="font-body-sm text-body-sm text-outline truncate">${escapeHtml(item.neighborhood)} • ${escapeHtml(item.durationLabel)} • ${escapeHtml(item.priceDisplay)}</p>
        </div>
      </div>
      <div class="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
        <button
          type="button"
          data-details-id="${escapeHtml(item.id)}"
          class="open-modal-trigger px-3.5 py-2 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors"
        >
          View Details
        </button>
        <button
          type="button"
          data-remove-itinerary="${escapeHtml(item.id)}"
          aria-label="Remove from itinerary"
          class="w-10 h-10 rounded-xl bg-error-container/60 text-on-error-container hover:bg-error-container flex items-center justify-center transition-colors"
        >
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    `;
    els.plannerList.appendChild(row);
  });
}

function renderMapView() {
  if (!els.mapPinsLayer || state.allAttractions.length === 0) return;

  // Map geographic bounds for Mombasa Island -> Bamburi
  const minLat = -4.085;
  const maxLat = -3.955;
  const minLng = 39.65;
  const maxLng = 39.755;

  els.mapPinsLayer.innerHTML = '';

  state.allAttractions.forEach((item) => {
    const lat = item.coordinates?.lat ?? -4.0435;
    const lng = item.coordinates?.lng ?? 39.6682;

    const xPct = Math.min(90, Math.max(10, ((lng - minLng) / (maxLng - minLng)) * 100));
    const yPct = Math.min(90, Math.max(10, (1 - (lat - minLat) / (maxLat - minLat)) * 100));
    const isSelected = item.id === state.selectedMapId;

    const pinBtn = document.createElement('button');
    pinBtn.type = 'button';
    pinBtn.style.left = `${xPct}%`;
    pinBtn.style.top = `${yPct}%`;
    pinBtn.className = isSelected
      ? 'absolute -translate-x-1/2 -translate-y-1/2 z-20 px-3 py-1.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm shadow-lg ring-4 ring-tertiary-fixed/70 flex items-center gap-1 whitespace-nowrap transition-transform scale-105'
      : 'absolute -translate-x-1/2 -translate-y-1/2 z-10 px-2.5 py-1 rounded-full bg-surface-container-lowest text-on-surface font-label-sm text-label-sm shadow-md hover:scale-105 hover:z-20 flex items-center gap-1 whitespace-nowrap transition-transform';

    pinBtn.innerHTML = `
      <span class="material-symbols-outlined text-[14px] ${isSelected ? 'text-tertiary-fixed' : 'text-secondary'}">${escapeHtml(item.badgeIcon)}</span>
      <span>${escapeHtml(item.shortName || item.name)}</span>
    `;
    pinBtn.addEventListener('click', () => {
      state.selectedMapId = item.id;
      renderMapView();
    });

    els.mapPinsLayer.appendChild(pinBtn);
  });

  const selected =
    state.allAttractions.find((a) => a.id === state.selectedMapId) || state.allAttractions[0];

  if (selected && els.mapPreviewCard) {
    els.mapPreviewCard.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="font-label-sm text-label-sm text-secondary uppercase tracking-wider">${escapeHtml(selected.primaryCategory)}</span>
          <span class="font-label-sm text-label-sm text-outline tabular-nums">${escapeHtml(selected.coordinates.lat.toFixed(4))}° S, ${escapeHtml(selected.coordinates.lng.toFixed(4))}° E</span>
        </div>
        <img
          src="${escapeHtml(selected.image)}"
          alt="${escapeHtml(selected.name)}"
          referrerpolicy="no-referrer"
          class="w-full h-44 rounded-xl object-cover bg-surface-container"
        />
        <div>
          <h2 class="font-headline-sm text-headline-sm text-on-surface">${escapeHtml(selected.name)}</h2>
          <p class="font-body-sm text-body-sm text-outline mt-0.5">${escapeHtml(selected.address)} • ${escapeHtml(selected.distanceLabel)}</p>
        </div>
        <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-3">${escapeHtml(selected.description)}</p>
        <div class="flex items-center justify-between pt-1">
          <span class="font-headline-sm text-headline-sm font-bold text-secondary tabular-nums">${escapeHtml(selected.priceDisplay)}</span>
          <span class="font-label-md text-label-md text-on-surface flex items-center gap-1 tabular-nums">
            <span class="material-symbols-outlined text-[16px] text-secondary" style="font-variation-settings: 'FILL' 1;">star</span>
            ${escapeHtml(selected.rating.toFixed(1))}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2 pt-2">
        <button
          type="button"
          data-details-id="${escapeHtml(selected.id)}"
          class="open-modal-trigger flex-1 h-11 rounded-xl bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center gap-1.5"
        >
          <span>View Details</span>
          <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    `;
  }
}

function resetAllFilters() {
  state.selectedCategory = 'All';
  state.searchQuery = '';
  state.sortBy = 'popular';
  els.searchInput.value = '';
  els.sortSelect.value = 'popular';
  updateCategoryPillsUI();
  applyFiltersAndRender();
}

function bindEvents() {
  // Search with lightweight debounce
  let debounceTimer;
  els.searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.searchQuery = e.target.value;
      if (state.activeTab !== 'discover') switchTab('discover');
      applyFiltersAndRender();
    }, 120);
  });

  els.clearSearchBtn.addEventListener('click', () => {
    els.searchInput.value = '';
    state.searchQuery = '';
    applyFiltersAndRender();
    els.searchInput.focus();
  });

  // Category filter pills
  els.categoryPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      state.selectedCategory = pill.getAttribute('data-category') || 'All';
      if (state.activeTab !== 'discover') switchTab('discover');
      updateCategoryPillsUI();
      applyFiltersAndRender();
    });
  });

  // Curated collection buttons
  els.collectionBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetCat = btn.getAttribute('data-collection-category') || 'All';
      state.selectedCategory = state.selectedCategory === targetCat ? 'All' : targetCat;
      updateCategoryPillsUI();
      applyFiltersAndRender();
      document.getElementById('attractions-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Street delights quick filter
  els.mustTryFoodBtn?.addEventListener('click', () => {
    state.selectedCategory = 'Food & Nightlife';
    updateCategoryPillsUI();
    applyFiltersAndRender();
    document.getElementById('attractions-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  els.foodDelightBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const foodTerm = btn.getAttribute('data-food-query') || '';
      state.selectedCategory = 'Food & Nightlife';
      state.searchQuery = foodTerm;
      els.searchInput.value = foodTerm;
      updateCategoryPillsUI();
      applyFiltersAndRender();
      document.getElementById('attractions-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Sort selector
  els.sortSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    applyFiltersAndRender();
  });

  // Reset triggers
  els.resetFiltersBtn.addEventListener('click', resetAllFilters);
  els.emptyResetBtn.addEventListener('click', resetAllFilters);
  els.retryLoadBtn.addEventListener('click', fetchAttractions);

  // Header & Hero navigation shortcuts
  els.brandHomeBtn.addEventListener('click', () => {
    switchTab('discover');
    resetAllFilters();
  });
  els.savedHeaderBtn.addEventListener('click', () => switchTab('saved'));
  els.itineraryHeaderBtn.addEventListener('click', () => switchTab('planner'));
  els.heroExploreBtn.addEventListener('click', () => {
    document.getElementById('attractions-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  els.heroItineraryBtn.addEventListener('click', () => switchTab('planner'));
  els.plannerBrowseBtn.addEventListener('click', () => switchTab('discover'));
  els.savedBrowseBtn.addEventListener('click', () => switchTab('discover'));

  els.plannerClearBtn.addEventListener('click', () => {
    state.itineraryIds = [];
    saveStoredIds(STORAGE_ITINERARY_KEY, state.itineraryIds);
    updateHeaderCounts();
    renderPlannerView();
  });

  // Bottom navigation tabs
  els.navTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      if (targetTab) switchTab(targetTab);
    });
  });

  // Delegated click handlers for dynamic cards, bookmarks, modal triggers, and planner removals
  document.addEventListener('click', (e) => {
    const bookmarkBtn = e.target.closest('.bookmark-btn');
    if (bookmarkBtn) {
      e.stopPropagation();
      const id = bookmarkBtn.getAttribute('data-bookmark-id');
      if (id) toggleBookmark(id);
      return;
    }

    const detailsBtn = e.target.closest('.open-modal-trigger');
    if (detailsBtn) {
      const id = detailsBtn.getAttribute('data-details-id');
      if (id) openModalById(id);
      return;
    }

    const removeItineraryBtn = e.target.closest('[data-remove-itinerary]');
    if (removeItineraryBtn) {
      const id = removeItineraryBtn.getAttribute('data-remove-itinerary');
      if (id) toggleItinerary(id);
    }
  });

  // Modal controls
  els.closeModalBtn.addEventListener('click', closeModal);
  els.modal.addEventListener('click', (e) => {
    if (e.target === els.modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  els.modalPrevImg.addEventListener('click', () => {
    if (!state.activeModalAttraction) return;
    state.modalImageIndex -= 1;
    renderModalGallery(state.activeModalAttraction);
  });

  els.modalNextImg.addEventListener('click', () => {
    if (!state.activeModalAttraction) return;
    state.modalImageIndex += 1;
    renderModalGallery(state.activeModalAttraction);
  });

  els.modalItineraryBtn.addEventListener('click', () => {
    if (!state.activeModalAttraction) return;
    toggleItinerary(state.activeModalAttraction.id);
  });

  // Graceful fallback on modal hero image error
  els.modalImage.addEventListener('error', () => {
    els.modalImage.classList.add('hidden');
  });
}

// Initialize app
updateHeaderCounts();
updateCategoryPillsUI();
bindEvents();
fetchAttractions();
