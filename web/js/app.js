
// Application State
let currentView = 'films';
let currentPage = 1;
let itemsPerPage = 30;
let filteredFilms = [];
let filteredHistory = [];

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const filmsView = document.getElementById('filmsView');
const historyView = document.getElementById('historyView');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const subLanguageFilter = document.getElementById('subLanguageFilter');
const voiceLanguageFilter = document.getElementById('voiceLanguageFilter');
// const filterBtn = document.getElementById('filterBtn');
// const fetchBtn = document.getElementById('fetchBtn');
const pagination = document.getElementById('pagination');
const filmDetailPopup = document.getElementById('filmDetailPopup');
const closePopup = document.getElementById('closePopup');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

async function initializeApp() {
    // Gen client ID
    setClientId();
    // Filter
    populateFilters()
    // Get list films from DB
    filteredFilms = await fetchPangleData('db',undefined,undefined,undefined,undefined);
    // Get list jobs
    filteredHistory = await getDownloadHistory() || [];
    // Render list films...
    await renderFilmsView();
    updatePagination();
    
    // Setup auto-refresh to check for new films every 30 minutes
    setupAutoRefresh();
}

function setupEventListeners() {

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            switchView(section);
        });
    });

    // Search and auto-filters...
    searchInput.addEventListener('input', debounce(handleSearchAndFilter, 300));
    categoryFilter.addEventListener('change', handleAutoFilter);
    subLanguageFilter.addEventListener('change', handleAutoFilter);
    voiceLanguageFilter.addEventListener('change', handleAutoFilter);

    // Popup
    closePopup.addEventListener('click', closeFilmDetailPopup);
    filmDetailPopup.addEventListener('click', function(e) {
        if (e.target === this) {
            closeFilmDetailPopup();
        }
    });

    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => changePage(currentPage - 1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(currentPage + 1));

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeFilmDetailPopup();
        }
    });
}

async function populateFilters() {

    // 1. Categories
    const categories = await getCategories();
    // Get the select element
    const selectElement = document.getElementById("categoryFilter");
    // Clear existing options except the default "All Categories"
    selectElement.innerHTML = '<option value="0">All Categories</option>';
    // Loop through categories and create option elements
    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        selectElement.appendChild(option);
    });

    // 2. Sub & voice languages
    const subLanguageSelect = document.getElementById("subLanguageFilter");
    const voiceLanguageSelect = document.getElementById("voiceLanguageFilter");
    // Clear existing options except the default ones
    subLanguageSelect.innerHTML = '<option value="">All Sub Languages</option>';
    voiceLanguageSelect.innerHTML = '<option value="">All Voice Languages</option>';
    // Loop through languageMap and create option elements for both selects
    Object.entries(languageMap).forEach(([key, value]) => {
        // Create option for subLanguageFilter
        const subOption = document.createElement("option");
        subOption.value = key;
        subOption.textContent = value;
        subLanguageSelect.appendChild(subOption);
        // Create option for voiceLanguageFilter
        const voiceOption = document.createElement("option");
        voiceOption.value = key;
        voiceOption.textContent = value;
        voiceLanguageSelect.appendChild(voiceOption);
    });
}

async function switchView(view) {
    currentView = view;
    currentPage = 1;
    // Update navigation
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === view) {
            item.classList.add('active');
        }
    });
    // Show/hide views và quản lý polling data ở History view
    if (view === 'films') {
        filmsView.style.display = 'grid';
        historyView.style.display = 'none';
        stopHistoryPolling(); // Dừng polling khi rời History View
        await renderFilmsView();
    } 
    else if (view === 'history') {
        filmsView.style.display = 'none';
        historyView.style.display = 'block';
        await renderHistoryView();
        startHistoryPolling(); // Bắt đầu polling khi vào History View
    }
    updatePagination();
}

// Films page
// --------------------------------------------------------------

async function handleSearchAndFilter() {
    if (currentView === 'films') {
        // For films view, use the unified filter function
        applyFilters();
    } else if (currentView === 'history') {
        // For history view, use simple search
        const searchTerm = searchInput.value.toLowerCase().trim();
        const searched = filteredHistory.filter(item =>
            item.filmName.toLowerCase().includes(searchTerm)
        ) || [];
        console.log(`Result for search term '${searchTerm}': ${searched.length} jobs`);
        await renderHistoryView(searched);
        currentPage = 1;
        updatePagination(searched.length);
    }
}

// Auto-filter function with debouncing for better performance
const handleAutoFilter = debounce(function() {
    applyFilters();
}, 200);

function applyFilters() {
    const categoryId = Number(categoryFilter.value);
    const subLanguage = subLanguageFilter.value;
    const voiceLanguage = voiceLanguageFilter.value;
    const searchTerm = searchInput.value.toLowerCase().trim();

    console.log('Auto-filtering with:', { categoryId, subLanguage, voiceLanguage, searchTerm });
    
    // Update visual indicators for active filters
    updateFilterVisualStates(categoryId, subLanguage, voiceLanguage);
    
    const filtered = filteredFilms.data.filter(film => {
        const matchesSearch = !searchTerm || searchTerm==='' || film.title.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryId || categoryId===0 || film.categories.map(c => c.id).includes(categoryId);
        const matchesSubLanguage = !subLanguage || subLanguage==='' || film.lang === subLanguage;
        const matchesVoiceLanguage = !voiceLanguage || voiceLanguage==='' || film.voice_lang === voiceLanguage;

        return matchesSearch && matchesCategory && matchesSubLanguage && matchesVoiceLanguage;
    }) || [];
    
    console.log('---> Auto-filter result:', filtered.length, 'films');

    // Only show notification if filters are actually applied (not default state)
    const hasActiveFilters = categoryId !== 0 || subLanguage !== '' || voiceLanguage !== '' || searchTerm !== '';
    if (hasActiveFilters) {
        showNotification(`${filtered.length} films found`, 'info');
    }

    currentPage = 1;
    renderFilmsView(filtered);
    updatePagination(filtered.length);
}

// Update visual states for active filters
function updateFilterVisualStates(categoryId, subLanguage, voiceLanguage) {
    // Update category filter visual state
    if (categoryId && categoryId !== 0) {
        categoryFilter.classList.add('active');
    } else {
        categoryFilter.classList.remove('active');
    }

    // Update sub language filter visual state
    if (subLanguage && subLanguage !== '') {
        subLanguageFilter.classList.add('active');
    } else {
        subLanguageFilter.classList.remove('active');
    }

    // Update voice language filter visual state
    if (voiceLanguage && voiceLanguage !== '') {
        voiceLanguageFilter.classList.add('active');
    } else {
        voiceLanguageFilter.classList.remove('active');
    }
}



async function renderFilmsView(newFilms=[]) {
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const filmsToShow = (newFilms.length > 0) ? newFilms.slice(startIndex, endIndex) : filteredFilms.data.slice(startIndex, endIndex);

    if (filmsToShow.length === 0) {
        filmsView.innerHTML = '<div class="text-center text-muted" style="grid-column: 1/-1; padding: 2rem;">😈 No short films found. New films are automatically fetched daily!</div>';
        return;
    }

    filmsView.innerHTML = await Promise.all(
        filmsToShow.map(async (film) => {
            // Check if film is new (created within last 24 hours)
            const isNew = film.created_at ? isFilmNew(film.created_at) : false;
            const newBadge = isNew ? '<div class="new-badge">NEW</div>' : '';
            
            return `
            <div class="film-card ${isNew ? 'new-film' : ''}">
                ${newBadge}
                <div class="film-poster">
                    <img src="${film.cover_image}" alt="${film.title}" onerror='this.style.display="none"; this.parentElement.innerHTML="<i class=\"fas fa-film\"></i>";'>
                </div>
                <div class="film-info" onclick="showFilmDetail(${film.file_id})">
                    <div class="film-title">${film.title}</div>
                    <div class="film-meta">
                        <span><i class="fas fa-tag"></i> ${capitalizeFirst(film.categories[0].name)}</span>
                        <span><i class="fas fa-closed-captioning"></i> ${getLanguageFullName(film.lang)}</span>
                        <span><i class="fas fa-volume-up"></i> ${getLanguageFullName(film.voice_lang)}</span>
                    </div>
                </div>
                <div class="download-icon" onclick="downloadAllEsiposes(${film.file_id}, '${film.title}', '${film.lang}')">
                    <i class="fas fa-download"></i>
                </div>
            </div>
        `;
        })
    ).then(results => results.join(''));
}

// History page
// --------------------------------------------------------------

async function renderHistoryView(newHistories = []) {
    // Group history by film name
    const groupedHistory = groupHistoryByFilm((newHistories.length > 0) ? newHistories : filteredHistory);
    if (Object.keys(groupedHistory).length === 0) {
        historyView.innerHTML = '<div class="text-center text-muted" style="padding: 2rem;">😈 No download history found!</div>';
        return;
    }
    // Get sorted film names based on the latest (max) datetime in each group
    const sortedFilmNames = Object.keys(groupedHistory).sort((a, b) => {
        const maxDateA = Math.max(...groupedHistory[a].map(item => new Date(item.datetime).getTime()));
        const maxDateB = Math.max(...groupedHistory[b].map(item => new Date(item.datetime).getTime()));
        return maxDateB - maxDateA; // Sort descending: groups with most recent datetime first
    });
    historyView.innerHTML = await Promise.all(sortedFilmNames
        .map(async (filmName) => {
            // Get subLang from the first item in the group (assuming all items in the group have the same filmLang)
            const subLang = getLanguageFullName(groupedHistory[filmName][0].filmLang);
            // Sort items within the group by datetime descending (most recent first)
            const sortedItems = groupedHistory[filmName].sort((itemA, itemB) => 
                new Date(itemB.datetime).getTime() - new Date(itemA.datetime).getTime()
            );
            return `
            <div class="history-group">
                <div class="history-group-header">
                    <i class="fas fa-film"></i> ${filmName} <i class="fas fa-closed-captioning"></i> ${subLang}
                </div>
                <div class="history-table-container">
                    <div class="history-table-header">
                        <div>Episode</div>
                        <div>Status</div>
                        <div>Message</div>
                        <div>Time</div>
                        <div>Actions</div>
                    </div>
                    ${await Promise.all(
                        sortedItems.map(async (item) => `
                            <div class="history-row">
                                <div style="margin-left: 10px;">${item.episode}</div>
                                <div>
                                    <span class="status-badge status-${item.status.name.toLowerCase()}">${(item.status.name === 'active') ? `PROCESSING (${item.status.process})` : item.status.name.toUpperCase()}</span>
                                </div>
                                <div style="color: darkgray;">${item.status.message}</div>
                                <div>${formatTime(item.datetime)}</div>
                                <div class="action-buttons">
                                    <button class="btn-action" onclick="openLinkInNewTab('${item.resultLink}')" title="Review">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn-action" onclick="downloadFile('${item.resultLink}')" title="Download">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                        `)
                    ).then(results => results.join(''))}
                </div>
            </div>
        `;
        })
    ).then(results => results.join(''));
}

function groupHistoryByFilm(history) {
    const groups = {};
    history.forEach(item => {
        const titleKey = item.filmName;
        if (!groups[titleKey]) groups[titleKey] = [];
        groups[titleKey].push(item);
    });
    return groups;
}

async function renderHistoryViewGroupByDateTime(newHistories=[]) {
    // Group history by date/time
    const groupedHistory = groupHistoryByDateTime((newHistories.length > 0) ? newHistories : filteredHistory);
    if (Object.keys(groupedHistory).length === 0) {
        historyView.innerHTML = '<div class="text-center text-muted" style="padding: 2rem;">😈 No download history found!</div>';
        return;
    }
    historyView.innerHTML = await Promise.all(Object.keys(groupedHistory)
        .sort((a, b) => new Date(b) - new Date(a))
        .map(async (dateTime) => `
            <div class="history-group">
                <div class="history-group-header">
                    <i class="fas fa-clock"></i> ${formatDateTime(dateTime)}
                </div>
                <div class="history-table-container">
                    <div class="history-table-header">
                        <div>Film Name</div>
                        <div>Sub Language</div>
                        <div>Episode</div>
                        <div>Status</div>
                        <div>Time</div>
                        <div>Actions</div>
                    </div>
                    ${await Promise.all(
                        groupedHistory[dateTime].map(async (item) => `
                            <div class="history-row">
                                <div>${item.filmName}</div>
                                <div>${getLanguageFullName(item.filmLang)}</div>
                                <div>${item.episode}</div>
                                <div>
                                    <span class="status-badge status-${item.status.name.toLowerCase()}">${(item.status.name==='active') ? `PROCESSING (${item.status.process})` : item.status.name.toUpperCase()}</span>
                                </div>
                                <div>${formatTime(item.datetime)}</div>
                                <div class="action-buttons">
                                    <button class="btn-action" onclick="openLinkInNewTab('${item.resultLink}')" title="Review">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn-action" onclick="downloadFile('${item.resultLink}')" title="Download">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                        `)
                    ).then(results => results.join(''))}
                </div>
            </div>
        `)
    ).then(results => results.join(''));
}

function groupHistoryByDateTime(history) {
    const groups = {};
    history.forEach(item => {
        const date = new Date(item.datetime);
        const hourKey = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).toISOString();
        if (!groups[hourKey]) {
            groups[hourKey] = [];
        }
        groups[hourKey].push(item);
    });
    return groups;
}

// Detail Popup
// --------------------------------------------------------------

async function showFilmDetail(filmId) {

    const film = filteredFilms.data.find(f => f.file_id === Number(filmId));
    if (!film) return;

    // Update popup content
    document.getElementById('filmTitle').textContent = film.title;
    document.getElementById('filmPoster').src = film.cover_image;
    document.getElementById('filmCategory').textContent = capitalizeFirst(film.categories[0].name);
    document.getElementById('filmSubLanguage').textContent = getLanguageFullName(film.lang);
    document.getElementById('filmVoiceLanguage').textContent = getLanguageFullName(film.voice_lang);
    // document.getElementById('filmEpisodes').textContent = film.episodes;
    const description = film.desc.length > 180 ? film.desc.slice(0, 180) + ' ...' : film.desc;
    document.getElementById('filmDescription').textContent = description;

    // Show popup
    filmDetailPopup.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Fetch episode download links...
    // if (await fetchEsiposeLinks(filmId)) {
    //   const episodesList = document.getElementById('episodesList');
    //   const episodes = Array.from({length: 10}, (_, i) => i + 1);
    //   episodesList.innerHTML = episodes.map(ep => `
    //       <button class="episode-btn" onclick="downloadFilmEsipose(${film.file_id}, ${ep})">
    //           Episode ${ep}
    //       </button>
    //   `).join('');
    // }
}

function closeFilmDetailPopup() {
    filmDetailPopup.classList.remove('active');
    document.body.style.overflow = '';
}

// Pagination
// --------------------------------------------------------------

function updatePagination(newListLength=0) {

    const totalItems = currentView === 'films' ? ((newListLength!==0) ? newListLength : filteredFilms.data.length) : filteredHistory.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    
    // Update prev/next buttons
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    
    prevBtn.classList.toggle('disabled', currentPage === 1);
    nextBtn.classList.toggle('disabled', currentPage === totalPages);
    
    // Update page numbers
    const pageNumbers = document.getElementById('pageNumbers');
    const pages = generatePageNumbers(currentPage, totalPages);
    
    pageNumbers.innerHTML = pages.map(page => {
        if (page === '...') {
            return '<span class="page-ellipsis">...</span>';
        }
        return `<button class="btn-page ${page === currentPage ? 'active' : ''}" onclick="changePage(${page})">${page}</button>`;
    }).join('');
}

function generatePageNumbers(current, total) {

    const pages = [];
    
    if (total <= 7) {
        for (let i = 1; i <= total; i++) {
            pages.push(i);
        }
    } else {
        if (current <= 4) {
            for (let i = 1; i <= 5; i++) pages.push(i);
            pages.push('...');
            pages.push(total);
        } else if (current >= total - 3) {
            pages.push(1);
            pages.push('...');
            for (let i = total - 4; i <= total; i++) pages.push(i);
        } else {
            pages.push(1);
            pages.push('...');
            for (let i = current - 1; i <= current + 1; i++) pages.push(i);
            pages.push('...');
            pages.push(total);
        }
    }
    
    return pages;
}

async function changePage(page) {

    const totalItems = currentView === 'films' ? filteredFilms.length : filteredHistory.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    
    if (currentView === 'films') {
        await renderFilmsView();
    } else {
        await renderHistoryView();
    }
    
    updatePagination();
    
    // Scroll to top of content
    document.querySelector('.content').scrollTop = 0;
}

// Action Functions
// --------------------------------------------------------------

async function downloadFile(link) {
  try {
    if (!link || link==='') {
      throw new Error('Not found');
    }
    else if (typeof link !== 'string' || !link.startsWith('http')) {
      throw new Error('Invalid link');
    }
    showNotification(`Downloading this episode ...`, 'info');
    const response = await fetch(link);
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    let fileName = 'downloaded_file';
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition && contentDisposition.includes('filename=')) {
      fileName = contentDisposition
        .split('filename=')[1]
        .split(';')[0]
        .replace(/"/g, '');
    } else {
      const urlParts = link.split('/');
      fileName = urlParts[urlParts.length - 1] || fileName;
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
    showNotification(`Download file ${fileName} successfully!`, 'success');
  } catch (error) {
    console.error('Error while download file:', error.message);
    showNotification(`Error while download file: ${error.message}`, 'error');
  }
}

function openLinkInNewTab(link) {
  try {
    if (!link || link==='') {
      throw new Error('Not found');
    }
    else if (typeof link !== 'string' || !link.startsWith('http')) {
      throw new Error('Invalid link');
    }
    window.open(link, '_blank');
  } catch (error) {
    console.error('Error while open link:', error.message);
    showNotification(`Error while open link: ${error.message}`, 'error');
  }
}

// Notification
// --------------------------------------------------------------

function showNotification(message, type = 'info') {

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}" style="margin-right: 5px;"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add notification styles if not already added
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: var(--secondary-bg);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                padding: var(--spacing-md);
                box-shadow: var(--shadow-lg);
                z-index: 1001;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                max-width: 400px;
                animation: slideInRight 0.3s ease-out;
            }
            
            .notification-info { border-left: 4px solid var(--accent-color); }
            .notification-success { border-left: 4px solid var(--success-color); }
            .notification-error { border-left: 4px solid var(--error-color); }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                flex: 1;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: var(--muted-text);
                cursor: pointer;
                padding: var(--spacing-xs);
                border-radius: var(--radius-sm);
                transition: all 0.3s ease;
            }
            
            .notification-close:hover {
                background: var(--tertiary-bg);
                color: var(--primary-text);
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Helper Functions
// --------------------------------------------------------------

function isFilmNew(createdAt) {
    if (!createdAt) return false;
    
    const filmDate = new Date(createdAt);
    const now = new Date();
    const diffInHours = Math.abs(now - filmDate) / (1000 * 60 * 60);
    
    // Consider film as "new" if created within last 24 hours
    return diffInHours <= 24;
}

// Auto-refresh functionality
// --------------------------------------------------------------

function setupAutoRefresh() {
    // Check for new films every 30 minutes
    setInterval(async () => {
        await checkForNewFilms();
    }, 30 * 60 * 1000); // 30 minutes
}

async function checkForNewFilms() {
    try {
        const currentFilmCount = filteredFilms.data.length;
        
        // Fetch fresh data from DB
        const freshData = await fetchPangleData('db',undefined,undefined,undefined,undefined);
        
        if (freshData && freshData.data && freshData.data.length > currentFilmCount) {
            const newFilmsCount = freshData.data.length - currentFilmCount;
            
            // Update the global data
            filteredFilms = freshData;
            
            // Only refresh view if user is on films page
            if (currentView === 'films') {
                await renderFilmsView();
                updatePagination();
            }
            
            // Show notification about new films
            showNotification(`${newFilmsCount} new films available! Auto-refreshed.`, 'success');
        }
    } catch (error) {
        console.error('Error checking for new films:', error);
    }
}

// Export functions for global access
window.showFilmDetail = showFilmDetail;
// window.downloadEpisode = downloadEpisode;
window.downloadFile = downloadFile;
window.openLinkInNewTab = openLinkInNewTab;
window.changePage = changePage;

