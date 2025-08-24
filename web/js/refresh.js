
let isRefreshing = false;
let historyPollingInterval = null;

async function refreshFilmData() {
    try {
        if (currentView === 'films' && filmsView) {
            renderFilmsView();
        }
    } catch (error) {
        filteredHistory = filteredHistory || [];
        if (currentView === 'films' && filmsView) {
            renderFilmsView();
        }
    }
}

async function refreshHistoryData() {
    if (isRefreshing) return; // Bỏ qua nếu đang refresh
    isRefreshing = true;
    try {
        filteredHistory = await getDownloadHistory();
        // console.log('Refreshed filteredHistory:', filteredHistory);
        if (currentView === 'history' && historyView) {
            renderHistoryView();
        }
    } catch (error) {
        // console.error('Error refreshing history:', error);
        filteredHistory = filteredHistory || [];
        if (currentView === 'history' && historyView) {
            renderHistoryView();
        }
    } finally {
        isRefreshing = false;
    }
}

/**
 * Sử dụng setInterval để gọi refreshHistoryData() mỗi 3 giây khi ở History View, 
 * ... và dừng interval khi rời khỏi History view.
 */ 

// Hàm bắt đầu polling
function startHistoryPolling() {
    // Dừng interval cũ nếu tồn tại
    stopHistoryPolling();
    // Bắt đầu interval gọi refreshHistoryData mỗi 3s
    historyPollingInterval = setInterval(() => {
        if (currentView === 'history') {
            console.log('Refresh history data...');
            refreshHistoryData();
        }
    }, 3000);
}

// Hàm dừng polling
function stopHistoryPolling() {
    if (historyPollingInterval) {
        clearInterval(historyPollingInterval);
        historyPollingInterval = null;
    }
}
