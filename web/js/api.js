
const API_HOST = 'http://localhost:3000';
// const API_HOST = 'https://pangle-downloader.tripdev.io';

/** ------------------------------------------------------------------------ **/ 
/** ------------------------------------------------------------------------ **/ 

async function getCategories() {
    try {
        const url = `${API_HOST}/api/v1/pangle/categories`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Get film info fail:', error.message);
    }
    return [];
}

async function fetchPangleData(getFrom, categoryId, subLang, voiceLang, titleText) {

    const url = `${API_HOST}/api/v1/pangle/list?getFrom=${getFrom}`;
    const payload = {
        category_ids: (!categoryId || categoryId===0) ? undefined : [categoryId],
        langs: (!subLang || subLang==='') ? undefined : [subLang],
        voice_langs: (!voiceLang || voiceLang==='') ? undefined : [voiceLang],
        title: (!titleText || titleText==='') ? undefined : titleText
    };
    
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        if (data.success) {
            return {
                success: true,
                data: data.data || [],
                pagination: data.pagination || {}
            };
        } else {
            return {
                success: false,
                message: data.message,
            };
        }
    } catch (error) {
        return {
            success: false,
            message: error.message,
        };
    }
}

/** ------------------------------------------------------------------------ **/ 
/** ------------------------------------------------------------------------ **/ 

async function downloadFilmEsipose(filmId, episodeIdx) {

    const url = `${API_HOST}/api/v1/download/?clientId=${getClientId()}&filmId=${filmId}&episodeIdx=${episodeIdx}`;
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`Download film episode successfully, with job: ${data.jobId}`);
        } else {
            showNotification(`Error while download film episode: ${data.message}`, 'error');
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Download film episode fail:', error.message);
    }
}

async function downloadAllEsiposes(filmId, filmName, filmLang) {

    const url = `${API_HOST}/api/v1/download/`;
    const payload = {
        clientId: getClientId(),
        filmId: filmId,
        filmName: filmName,
        filmLang: filmLang
    };
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        if (data.success) {
            showNotification(`Downloading 10 episodes. Check Download history!`, 'info');
        } else {
            showNotification(`Error while download: ${data.message}`, 'error');
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Download episodes fail:', error.message);
    }
}

/** ------------------------------------------------------------------------ **/ 
/** ------------------------------------------------------------------------ **/ 

async function getJobs() {
    try {
        const url = `${API_HOST}/api/v1/download/job/history?clientId=${getClientId()}&from=${getToday('YYYY-MM-DD')}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
            console.log('Get jobs success:', data.data.length, 'jobs on today!');
            return data.data || [];
        }
    } catch (error) {
        console.error('Get jobs fail:', error.message);
    }
    return undefined;
}

async function getJobStatus(jobId) {
    try {
        const url = `${API_HOST}/api/v1/download/job/status/${jobId}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // console.log('Get job status of', jobId, 'success');
        return {
            status: data.status,
            progress: data.progress,
            message: data.message,
            info: { 
              filmName: data.filmName, 
              filmLang: data.filmLang, 
              resultLink: data.result 
            },
        };
    } catch (error) {
        console.error('Get job status fail:', error.message);
    }
}

async function getDownloadHistory() {
  
    const jobs = await getJobs();
    if (!jobs || jobs.length===0) return undefined;

    const histories = [];

    for (const job of jobs) {
      const data = await getJobStatus(job.jobId);
      histories.push({
        filmName: data.info.filmName || 'Unknow',
        filmLang: data.info.filmLang || 'Unknow',
        episode: job.episode,
        status: { name: data.status, process: data.progress, message: data.message, },
        datetime: job.download_at,
        resultLink: data.info.resultLink
      });
    }
    // Sắp xếp histories theo datetime, gần nhất lên đầu...
    histories.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
    // console.log(JSON.stringify(histories,null,2));
    return histories;
}
