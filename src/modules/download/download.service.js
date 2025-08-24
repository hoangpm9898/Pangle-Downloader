const axios = require('axios');

const { generateSignKey } = require('../../common/helpers/crypto.helper');
const { videoQueue } = require('./queues/video.queue');
const DownloadRepository = require('./download.repo');
const JobRepository = require('./job.repo');

class DownloadService {

  async getEpisodeLinks(filmId) {
    try {
      // Fetch download links of episodes
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const response = await axios.post(`${process.env.BYTEDANCE_API_URL}/file/download`, {
        auth_info: { 
          user_id: Number(process.env.BYTEDANCE_USER_ID), 
          role_id: Number(process.env.BYTEDANCE_ROLE_ID), 
          timestamp, 
          sign: generateSignKey(timestamp)
        },
        page_info: { page: 1, page_size: 100 },
        controller: { download_config: [{ file_id: filmId, target_index: [1,2,3,4,5,6,7,8,9,10] }] }
      });

      const result = response.data;
      if (result && result.code==='100' && result.data[0]) {
        return result.data[0];
      } else {
        throw new Error(`${result.message} (${result.code})`);
      }
    } catch (error) {
      console.error(`[x] - Get esipode links for this film fail: ${error.message}`);
    }
  }

  async downloadAllEpisodes(clientId, filmId, filmName, filmLang) {
    const jobIds = [];
    try {
      console.log(`\n[!] Download 10 episodes of film ${filmId}...`);
      const downloadData = await this.getEpisodeLinks(filmId);
      for (let index = 1; index <= 10; index++) {
        const episode = downloadData.episode_list.find((e) => e.index===index);
        if (episode) {
          const job = await videoQueue.add({ clientId, filmId, filmName, filmLang, episode });
          console.log('[!] - Processing queued successfully for episode', index, 'with job ID:', Number(job.id));
          jobIds.push(Number(job.id));
        }
      }
    } catch (error) {
      console.error(`[x] - Failed to queue processing: ${error.message}`);
    }
    return jobIds;
  }

  async getDownloadJobHistory(queryData) {

    const { clientId, from, to } = queryData; // from=YYYY-MM-DD, to=YYYY-MM-DD
    try {
      let matchStage = {};

      if (from || to) {
        matchStage.download_at = {};
        if (from) matchStage.download_at.$gte = new Date(from);
        if (to) {
          const toDate = new Date(to);
          toDate.setHours(23, 59, 59, 999);
          matchStage.download_at.$lte = toDate;
        }
        matchStage.clientId = clientId;
      }
      const aggregatedResults = await JobRepository.getListJobs(matchStage);

      if (aggregatedResults) {
        console.log(`\n[!] Get download job history: ${aggregatedResults.length} films`);
        return { success: true, data: aggregatedResults };
      }
    } catch (error) {
      console.error(`\n[x] Failed to fetch download job history: ${error.message}`);
      return { success: false, message: error.message }
    }
    return { success: true, data: [] };
  }

  async getDownloadJobStatus(jobId) {
    try {
      const jobs = await videoQueue.getJobs(['waiting', 'active', 'completed', 'failed', 'delayed', 'paused']);
      const job = jobs.find(j => parseInt(j.id) === jobId);
      
      if (!job) {
        return {
          status: 'not_found',
          message: 'No processing job found for this filmId',
          progress: '0%',
        };
      }
      // console.log(JSON.stringify(job,null,2));
      
      const state = await job.getState();
      const progress = job._progress || 0;

      const statusMessages = {
        waiting: 'Job is queued and waiting to be processed',
        active: `Job is actively processing (${progress}% complete)`,
        completed: 'Job has completed successfully',
        failed: `Job failed: ${job.failedReason || 'Unknown error'}`,
        delayed: 'Job is delayed and will retry later',
        paused: 'Job is paused'
      };

      return {
        status: state,
        progress: `${progress}%`,
        message: statusMessages[state] || 'Unknown job status',
        jobId: Number(job.id),
        filmName: job.data.filmName,
        filmLang: job.data.filmLang,
        result: job.data.result_link,
        failedReason: state === 'failed' ? job.failedReason : null,
      };

    } catch (error) {
      return {
        status: 'error',
        message: `Failed to check job status: ${error.message}`,
        progress: '0%',
      };
    }
  }
}

module.exports = new DownloadService();