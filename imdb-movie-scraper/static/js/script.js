/**
 * IMDb Movie Rating Scraper - Frontend Application Logic
 * Handles real-time scraping controls, AJAX polling, table sorting, filtering,
 * pagination, Chart.js visualizations, and modal dialogues.
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // State
  // =========================================================================
  const state = {
    movies: [],
    filteredMovies: [],
    currentPage: 1,
    pageSize: 25,
    sortField: 'rank',
    sortOrder: 'asc',
    activeFilter: 'all',
    searchQuery: '',
    isScraping: false,
    pollTimer: null,
    headless: true,
    charts: {
      ratingDist: null,
      decade: null,
      topMovies: null,
    }
  };

  // =========================================================================
  // DOM Elements
  // =========================================================================
  const elements = {
    // Buttons & Controls
    startScrapeBtn: document.getElementById('startScrapeBtn'),
    stopScrapeBtn: document.getElementById('stopScrapeBtn'),
    refreshDataBtn: document.getElementById('refreshDataBtn'),
    downloadCsvBtn: document.getElementById('downloadCsvBtn'),
    downloadCsvBtnSecondary: document.getElementById('downloadCsvBtnSecondary'),
    headlessToggle: document.getElementById('headlessToggle'),
    headlessStateBadge: document.getElementById('headlessStateBadge'),

    // Global Status
    globalStatusPill: document.getElementById('globalStatusPill'),
    globalStatusDot: document.getElementById('globalStatusDot'),
    globalStatusText: document.getElementById('globalStatusText'),
    lastUpdatedText: document.getElementById('lastUpdatedText'),
    cachedCountText: document.getElementById('cachedCountText'),

    // Progress
    progressSection: document.getElementById('progressSection'),
    progressSpinner: document.getElementById('progressSpinner'),
    progressMessage: document.getElementById('progressMessage'),
    progressFraction: document.getElementById('progressFraction'),
    progressPercent: document.getElementById('progressPercent'),
    progressBarFill: document.getElementById('progressBarFill'),

    // Alert
    alertBox: document.getElementById('alertBox'),
    alertIcon: document.getElementById('alertIcon'),
    alertMessage: document.getElementById('alertMessage'),
    alertCloseBtn: document.getElementById('alertCloseBtn'),

    // Stats Cards
    statTotalMovies: document.getElementById('statTotalMovies'),
    statAvgRating: document.getElementById('statAvgRating'),
    statHighestRated: document.getElementById('statHighestRated'),
    statHighestRatingSub: document.getElementById('statHighestRatingSub'),
    statLowestRated: document.getElementById('statLowestRated'),
    statLowestRatingSub: document.getElementById('statLowestRatingSub'),
    statLatestYear: document.getElementById('statLatestYear'),
    statYearRangeSub: document.getElementById('statYearRangeSub'),

    // Table & Filters
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    sortSelect: document.getElementById('sortSelect'),
    pageSizeSelect: document.getElementById('pageSizeSelect'),
    filterChips: document.querySelectorAll('.filter-chips .chip'),
    filteredCountBadge: document.getElementById('filteredCountBadge'),
    movieTableBody: document.getElementById('movieTableBody'),
    paginationInfo: document.getElementById('paginationInfo'),
    paginationControls: document.getElementById('paginationControls'),

    // Modal
    movieModalBackdrop: document.getElementById('movieModalBackdrop'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    modalDismissBtn: document.getElementById('modalDismissBtn'),
    modalPoster: document.getElementById('modalPoster'),
    modalRank: document.getElementById('modalRank'),
    modalCert: document.getElementById('modalCert'),
    modalYear: document.getElementById('modalYear'),
    modalTitle: document.getElementById('modalTitle'),
    modalRating: document.getElementById('modalRating'),
    modalVotes: document.getElementById('modalVotes'),
    modalDuration: document.getElementById('modalDuration'),
    modalDesc: document.getElementById('modalDesc'),
    modalImdbLink: document.getElementById('modalImdbLink'),

    // Toast
    toastNotification: document.getElementById('toastNotification'),
    toastMessage: document.getElementById('toastMessage'),
  };

  // =========================================================================
  // Initialize
  // =========================================================================
  initEventListeners();
  loadMoviesData();
  checkInitialScrapeStatus();

  // =========================================================================
  // Event Listeners
  // =========================================================================
  function initEventListeners() {
    // Scraper Controls
    elements.startScrapeBtn.addEventListener('click', onStartScraping);
    elements.stopScrapeBtn.addEventListener('click', onStopScraping);
    elements.refreshDataBtn.addEventListener('click', () => {
      loadMoviesData(true);
      showToast('Data reloaded from server cache.');
    });

    // Download CSV
    elements.downloadCsvBtn.addEventListener('click', triggerCsvDownload);
    elements.downloadCsvBtnSecondary.addEventListener('click', triggerCsvDownload);

    // Headless Toggle
    elements.headlessToggle.addEventListener('change', (e) => {
      state.headless = e.target.checked;
      elements.headlessStateBadge.textContent = state.headless ? 'ON' : 'OFF';
      elements.headlessStateBadge.style.color = state.headless ? 'var(--imdb-gold)' : 'var(--text-secondary)';
      showToast(`Headless mode set to ${state.headless ? 'ON (Background)' : 'OFF (Visible Window)'}`);
    });

    // Alert Close
    elements.alertCloseBtn.addEventListener('click', () => {
      elements.alertBox.style.display = 'none';
    });

    // Search Input
    elements.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      elements.clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
      state.currentPage = 1;
      applyFiltersAndSort();
    });

    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      elements.clearSearchBtn.style.display = 'none';
      state.currentPage = 1;
      applyFiltersAndSort();
    });

    // Quick Filter Chips
    elements.filterChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        elements.filterChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        state.activeFilter = chip.getAttribute('data-filter');
        state.currentPage = 1;
        applyFiltersAndSort();
      });
    });

    // Sort Select
    elements.sortSelect.addEventListener('change', (e) => {
      const [field, order] = e.target.value.split('-');
      state.sortField = field;
      state.sortOrder = order;
      applyFiltersAndSort();
    });

    // Table Header Sortable Clicks
    document.querySelectorAll('.movie-table th.sortable').forEach((th) => {
      th.addEventListener('click', () => {
        const field = th.getAttribute('data-sort');
        if (state.sortField === field) {
          state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortField = field;
          state.sortOrder = field === 'rating' ? 'desc' : 'asc';
        }
        elements.sortSelect.value = `${state.sortField}-${state.sortOrder}`;
        applyFiltersAndSort();
      });
    });

    // Page Size Select
    elements.pageSizeSelect.addEventListener('change', (e) => {
      state.pageSize = parseInt(e.target.value, 10);
      state.currentPage = 1;
      renderTable();
      renderPagination();
    });

    // Modal Dismissal
    elements.modalCloseBtn.addEventListener('click', closeModal);
    elements.modalDismissBtn.addEventListener('click', closeModal);
    elements.movieModalBackdrop.addEventListener('click', (e) => {
      if (e.target === elements.movieModalBackdrop) {
        closeModal();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elements.movieModalBackdrop.classList.contains('open')) {
        closeModal();
      }
    });
  }

  // =========================================================================
  // API Calls & Data Loading
  // =========================================================================
  async function loadMoviesData(silent = false) {
    try {
      const res = await fetch('/api/movies');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      state.movies = data.movies || [];
      elements.lastUpdatedText.textContent = data.last_updated || 'Never';
      elements.cachedCountText.textContent = data.count || state.movies.length;

      updateStats(data.stats || {});
      applyFiltersAndSort();
      renderCharts(state.movies);
    } catch (err) {
      console.error('Failed to load movies data:', err);
      if (!silent) {
        showAlert('error', `Failed to load cached movie data: ${err.message}`);
      }
    }
  }

  async function checkInitialScrapeStatus() {
    try {
      const res = await fetch('/api/scrape/status');
      const data = await res.json();
      if (data.is_running) {
        setScrapingUI(true);
        startPolling();
      }
    } catch (e) {
      console.warn('Status check failed:', e);
    }
  }

  async function onStartScraping() {
    try {
      showAlert('info', 'Connecting to IMDb and initializing Selenium engine...');
      setScrapingUI(true);

      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headless: state.headless })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Scraper failed to start');
      }

      showToast('Scraper started in background.');
      startPolling();
    } catch (err) {
      setScrapingUI(false);
      showAlert('error', `Could not initiate scraper: ${err.message}`);
    }
  }

  async function onStopScraping() {
    try {
      elements.stopScrapeBtn.disabled = true;
      elements.progressMessage.textContent = 'Stopping scraper...';
      const res = await fetch('/api/scrape/stop', { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'Stop signal sent.');
    } catch (err) {
      console.error('Error stopping scraper:', err);
    }
  }

  function startPolling() {
    if (state.pollTimer) clearInterval(state.pollTimer);
    state.pollTimer = setInterval(pollScrapeStatus, 1200);
  }

  function stopPolling() {
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
      state.pollTimer = null;
    }
  }

  async function pollScrapeStatus() {
    try {
      const res = await fetch('/api/scrape/status');
      if (!res.ok) return;
      const data = await res.json();

      updateProgressUI(data);

      if (!data.is_running) {
        stopPolling();
        setScrapingUI(false);

        if (data.error) {
          showAlert('error', `Scraping error: ${data.error}`);
        } else {
          showAlert('success', data.status_message || 'Scraping successfully finished!');
          showToast('Scraping finished! Dashboard updated.');
        }

        // Refresh movies list and charts
        loadMoviesData(true);
      }
    } catch (err) {
      console.warn('Polling error:', err);
    }
  }

  function triggerCsvDownload() {
    if (!state.movies.length) {
      showAlert('info', 'No movie data available to download. Please scrape first!');
      return;
    }
    showToast('Downloading IMDb Top 250 CSV...');
    window.location.href = '/api/download';
  }

  // =========================================================================
  // UI & Progress Updates
  // =========================================================================
  function setScrapingUI(running) {
    state.isScraping = running;
    elements.startScrapeBtn.disabled = running;
    elements.stopScrapeBtn.disabled = !running;

    if (running) {
      elements.globalStatusDot.className = 'status-dot running';
      elements.globalStatusText.textContent = 'Scraping...';
      elements.progressSpinner.style.display = 'inline-block';
    } else {
      elements.globalStatusDot.className = 'status-dot idle';
      elements.globalStatusText.textContent = 'Ready';
      elements.progressSpinner.style.display = 'none';
    }
  }

  function updateProgressUI(data) {
    const progress = data.progress || 0;
    const total = data.total || 250;
    const percent = data.percent || 0;
    const msg = data.status_message || 'Processing...';

    elements.progressFraction.textContent = `${progress} / ${total}`;
    elements.progressPercent.textContent = `${percent}%`;
    elements.progressBarFill.style.width = `${percent}%`;
    elements.progressMessage.textContent = msg;
  }

  function showAlert(type, message) {
    elements.alertBox.className = `alert-box ${type}`;
    elements.alertMessage.textContent = message;

    if (type === 'error') {
      elements.alertIcon.className = 'fa-solid fa-triangle-exclamation alert-icon';
    } else if (type === 'success') {
      elements.alertIcon.className = 'fa-solid fa-circle-check alert-icon';
    } else {
      elements.alertIcon.className = 'fa-solid fa-circle-info alert-icon';
    }

    elements.alertBox.style.display = 'flex';
  }

  function showToast(message) {
    elements.toastMessage.textContent = message;
    elements.toastNotification.classList.add('show');
    setTimeout(() => {
      elements.toastNotification.classList.remove('show');
    }, 3200);
  }

  function updateStats(stats) {
    elements.statTotalMovies.textContent = stats.total_movies || 0;
    elements.statAvgRating.textContent = stats.avg_rating ? stats.avg_rating.toFixed(2) : '0.00';
    elements.statHighestRated.textContent = stats.highest_rated || 'N/A';
    elements.statHighestRated.title = stats.highest_rated || '';
    elements.statHighestRatingSub.textContent = stats.highest_rating ? `Rating: ${stats.highest_rating}` : 'Rating: -';
    elements.statLowestRated.textContent = stats.lowest_rated || 'N/A';
    elements.statLowestRated.title = stats.lowest_rated || '';
    elements.statLowestRatingSub.textContent = stats.lowest_rating ? `Rating: ${stats.lowest_rating}` : 'Rating: -';
    elements.statLatestYear.textContent = stats.latest_year || 'N/A';
    elements.statYearRangeSub.textContent = stats.oldest_year ? `Oldest: ${stats.oldest_year}` : 'Oldest: -';
  }

  // =========================================================================
  // Filtering & Sorting
  // =========================================================================
  function applyFiltersAndSort() {
    let result = [...state.movies];

    // 1. Text Search (title, year)
    if (state.searchQuery) {
      result = result.filter((m) => {
        const title = (m.title || '').toLowerCase();
        const year = String(m.year || '');
        return title.includes(state.searchQuery) || year.includes(state.searchQuery);
      });
    }

    // 2. Filter Chips
    if (state.activeFilter === 'rating-9') {
      result = result.filter((m) => m.rating >= 9.0);
    } else if (state.activeFilter === 'recent-2000') {
      result = result.filter((m) => {
        const y = parseInt(m.year, 10);
        return !isNaN(y) && y >= 2000;
      });
    } else if (state.activeFilter === 'classics') {
      result = result.filter((m) => {
        const y = parseInt(m.year, 10);
        return !isNaN(y) && y < 1980;
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      let valA = a[state.sortField];
      let valB = b[state.sortField];

      if (state.sortField === 'title') {
        valA = (valA || '').toLowerCase();
        valB = (valB || '').toLowerCase();
        return state.sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      if (state.sortField === 'rank' || state.sortField === 'year' || state.sortField === 'rating') {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
        return state.sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      return 0;
    });

    state.filteredMovies = result;
    elements.filteredCountBadge.textContent = `Showing ${result.length} of ${state.movies.length} movies`;

    renderTable();
    renderPagination();
  }

  // =========================================================================
  // Table Rendering
  // =========================================================================
  function renderTable() {
    const tbody = elements.movieTableBody;
    tbody.innerHTML = '';

    if (!state.filteredMovies.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-table-cell">
            <div class="empty-state">
              <i class="fa-solid fa-magnifying-glass empty-icon"></i>
              <p>No movies matched your search or filter criteria.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const startIndex = (state.currentPage - 1) * state.pageSize;
    const endIndex = Math.min(startIndex + state.pageSize, state.filteredMovies.length);
    const pageItems = state.filteredMovies.slice(startIndex, endIndex);

    const fallbackPoster = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2245%22 height=%2265%22 viewBox=%220 0 45 65%22><rect width=%2245%22 height=%2265%22 fill=%22%2321262d%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%238b949e%22 font-size=%228%22>No Poster</text></svg>";

    pageItems.forEach((movie) => {
      const tr = document.createElement('tr');
      const isTop3 = movie.rank <= 3;
      const posterSrc = movie.poster_url || fallbackPoster;

      tr.innerHTML = `
        <td class="col-rank">
          <span class="rank-badge ${isTop3 ? 'top-3' : ''}">#${movie.rank}</span>
        </td>
        <td class="col-poster">
          <img src="${posterSrc}" alt="${escapeHtml(movie.title)}" class="table-poster-img" loading="lazy" onerror="this.src='${fallbackPoster}'">
        </td>
        <td class="col-title">
          <div class="movie-title-cell">
            <a href="javascript:void(0)" class="movie-title-link" data-rank="${movie.rank}">${escapeHtml(movie.title)}</a>
          </div>
        </td>
        <td class="col-year">
          <span class="year-text">${escapeHtml(movie.year || 'N/A')}</span>
        </td>
        <td class="col-meta">
          <div class="meta-badges-cell">
            <span class="runtime-text">${escapeHtml(movie.duration || 'N/A')}</span>
            ${movie.certificate && movie.certificate !== 'Not Rated' ? `<span class="cert-pill">${escapeHtml(movie.certificate)}</span>` : ''}
          </div>
        </td>
        <td class="col-rating">
          <span class="rating-badge">
            <i class="fa-solid fa-star"></i> ${movie.rating ? movie.rating.toFixed(1) : '0.0'}
          </span>
        </td>
        <td class="col-votes">
          <span class="votes-text">${escapeHtml(movie.votes || '-')}</span>
        </td>
        <td class="col-action">
          <button class="btn btn-sm btn-outline view-details-btn" data-rank="${movie.rank}" title="View movie details">
            <i class="fa-solid fa-circle-info"></i>
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Attach click events to modal triggers
    tbody.querySelectorAll('.movie-title-link, .view-details-btn').forEach((elem) => {
      elem.addEventListener('click', () => {
        const rank = parseInt(elem.getAttribute('data-rank'), 10);
        const movie = state.movies.find((m) => m.rank === rank);
        if (movie) openModal(movie);
      });
    });
  }

  // =========================================================================
  // Pagination
  // =========================================================================
  function renderPagination() {
    const totalItems = state.filteredMovies.length;
    const totalPages = Math.ceil(totalItems / state.pageSize) || 1;

    if (state.currentPage > totalPages) state.currentPage = totalPages;

    const start = totalItems === 0 ? 0 : (state.currentPage - 1) * state.pageSize + 1;
    const end = Math.min(state.currentPage * state.pageSize, totalItems);

    elements.paginationInfo.innerHTML = `Showing <strong>${start}</strong> to <strong>${end}</strong> of <strong>${totalItems}</strong> movies`;

    const container = elements.paginationControls;
    container.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prevBtn.disabled = state.currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (state.currentPage > 1) {
        state.currentPage--;
        renderTable();
        renderPagination();
        scrollToTable();
      }
    });
    container.appendChild(prevBtn);

    // Dynamic page numbers with ellipses
    const pages = getPaginationPageNumbers(state.currentPage, totalPages);
    pages.forEach((p) => {
      if (p === '...') {
        const dots = document.createElement('span');
        dots.className = 'page-btn';
        dots.textContent = '...';
        dots.style.border = 'none';
        dots.style.background = 'transparent';
        container.appendChild(dots);
      } else {
        const btn = document.createElement('button');
        btn.className = `page-btn ${p === state.currentPage ? 'active' : ''}`;
        btn.textContent = p;
        btn.addEventListener('click', () => {
          state.currentPage = p;
          renderTable();
          renderPagination();
          scrollToTable();
        });
        container.appendChild(btn);
      }
    });

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    nextBtn.disabled = state.currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (state.currentPage < totalPages) {
        state.currentPage++;
        renderTable();
        renderPagination();
        scrollToTable();
      }
    });
    container.appendChild(nextBtn);
  }

  function getPaginationPageNumbers(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  }

  function scrollToTable() {
    const tableEl = document.getElementById('tableSection');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // =========================================================================
  // Visualizations (Chart.js)
  // =========================================================================
  function renderCharts(movies) {
    if (!movies || !movies.length) return;

    renderRatingDistributionChart(movies);
    renderDecadeChart(movies);
    renderTopMoviesChart(movies);
  }

  function renderRatingDistributionChart(movies) {
    const ctx = document.getElementById('ratingDistChart').getContext('2d');
    if (state.charts.ratingDist) state.charts.ratingDist.destroy();

    // Group ratings into buckets: 8.0, 8.1, ..., 9.3
    const bins = {};
    for (let r = 8.0; r <= 9.4; r = +(r + 0.1).toFixed(1)) {
      bins[r.toFixed(1)] = 0;
    }

    movies.forEach((m) => {
      if (m.rating) {
        const key = m.rating.toFixed(1);
        if (bins[key] !== undefined) bins[key]++;
      }
    });

    const labels = Object.keys(bins).sort();
    const data = labels.map((k) => bins[k]);

    state.charts.ratingDist = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Movies',
          data: data,
          backgroundColor: 'rgba(245, 197, 24, 0.75)',
          borderColor: '#f5c518',
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: '#ffd738'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#171d28',
            titleColor: '#f3f4f6',
            bodyColor: '#f5c518',
            borderColor: '#273042',
            borderWidth: 1,
            callbacks: {
              label: (item) => ` ${item.raw} movies rated ${item.label}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#9ca3af', font: { size: 11 } },
            title: { display: true, text: 'IMDb Rating', color: '#6b7280', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#9ca3af', font: { size: 11 }, stepSize: 10 },
            title: { display: true, text: 'Count', color: '#6b7280', font: { size: 11 } }
          }
        }
      }
    });
  }

  function renderDecadeChart(movies) {
    const ctx = document.getElementById('decadeChart').getContext('2d');
    if (state.charts.decade) state.charts.decade.destroy();

    const decades = {};
    movies.forEach((m) => {
      const y = parseInt(m.year, 10);
      if (!isNaN(y) && y >= 1920) {
        const dec = Math.floor(y / 10) * 10;
        const decKey = `${dec}s`;
        decades[decKey] = (decades[decKey] || 0) + 1;
      }
    });

    const labels = Object.keys(decades).sort();
    const data = labels.map((k) => decades[k]);

    state.charts.decade = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Movies Produced',
          data: data,
          borderColor: '#f5c518',
          backgroundColor: 'rgba(245, 197, 24, 0.15)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#f5c518',
          pointBorderColor: '#121721',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#171d28',
            titleColor: '#f3f4f6',
            bodyColor: '#f5c518',
            borderColor: '#273042',
            borderWidth: 1,
            callbacks: {
              label: (item) => ` ${item.raw} movies from the ${item.label}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#9ca3af', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#9ca3af', font: { size: 11 } },
            title: { display: true, text: 'Movies Count', color: '#6b7280', font: { size: 11 } }
          }
        }
      }
    });
  }

  function renderTopMoviesChart(movies) {
    const ctx = document.getElementById('topMoviesChart').getContext('2d');
    if (state.charts.topMovies) state.charts.topMovies.destroy();

    const top10 = movies.slice(0, 10);
    const labels = top10.map((m) => `#${m.rank} ${truncate(m.title, 26)}`);
    const data = top10.map((m) => m.rating);

    state.charts.topMovies = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          axis: 'y',
          label: 'Rating',
          data: data,
          backgroundColor: 'rgba(245, 197, 24, 0.8)',
          borderColor: '#f5c518',
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: '#ffd738'
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#171d28',
            titleColor: '#f3f4f6',
            bodyColor: '#f5c518',
            borderColor: '#273042',
            borderWidth: 1,
            callbacks: {
              label: (item) => ` IMDb Rating: ${item.raw} / 10`
            }
          }
        },
        scales: {
          x: {
            min: 8.5,
            max: 9.5,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#9ca3af', stepSize: 0.2, font: { size: 11 } },
            title: { display: true, text: 'IMDb Rating', color: '#6b7280', font: { size: 11 } }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#f3f4f6', font: { size: 11 } }
          }
        }
      }
    });
  }

  // =========================================================================
  // Modal Handling
  // =========================================================================
  function openModal(movie) {
    const fallback = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22140%22 height=%22207%22 viewBox=%220 0 140 207%22><rect width=%22140%22 height=%22207%22 fill=%22%2321262d%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%238b949e%22 font-size=%2214%22>No Poster</text></svg>";

    elements.modalPoster.src = movie.poster_url || fallback;
    elements.modalRank.textContent = `#${movie.rank}`;
    elements.modalCert.textContent = movie.certificate || 'Not Rated';
    elements.modalYear.textContent = movie.year || 'N/A';
    elements.modalTitle.textContent = movie.title || 'Untitled';
    elements.modalRating.textContent = movie.rating ? movie.rating.toFixed(1) : '0.0';
    elements.modalVotes.textContent = movie.votes ? `${movie.votes} votes` : 'Votes N/A';
    elements.modalDuration.textContent = movie.duration || 'Runtime N/A';

    elements.modalDesc.textContent = `Ranked #${movie.rank} in the IMDb Top 250 with an IMDb score of ${movie.rating}/10 based on ${movie.votes || 'global'} ratings. Released in ${movie.year || 'N/A'} with runtime ${movie.duration || 'N/A'}.`;

    if (movie.imdb_url) {
      elements.modalImdbLink.href = movie.imdb_url;
      elements.modalImdbLink.style.display = 'inline-flex';
    } else {
      elements.modalImdbLink.style.display = 'none';
    }

    elements.movieModalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    elements.movieModalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  // =========================================================================
  // Helpers
  // =========================================================================
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function truncate(str, maxLen) {
    if (!str) return '';
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
  }
});
