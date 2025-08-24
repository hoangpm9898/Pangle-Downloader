const Queue = require('bull');
const fs = require('fs/promises');
const path = require('path');

const JobRepository = require('../job.repo');

const videoQueue = new Queue('pangle-video-processing', {
  redis: process.env.REDIS_URI,
  defaultJobOptions: {
    removeOnComplete: { age: 86400 }, // Xóa job hoàn thành sau 1 ngày
    removeOnFail: { age: 86400 },     // Xóa job thất bại sau 1 ngày
  },
});

videoQueue.process(2, async (job) => {

  const { clientId, filmId, filmName, filmLang, episode } = job.data;
  try {
    // Ensure directory exists
    const dirPath = path.join('data', 'bytedrama', 'pangles', String(filmId));
    await fs.mkdir(dirPath, { recursive: true });

    // Update initial progress (0%)
    await job.progress(0);

    console.log(`\n[!] Start download episode [${episode.name}] of film: ${filmName} (${filmLang})`);

    const response = await fetch(episode.play_url);
    if (!response.ok) {
      throw new Error(`Fetch origin link with status ${response.status}`);
    }

    // Lưu job vào DB (1 record cho mỗi episode)
    JobRepository.saveDownloadJob({
      jobId: Number(job.id),
      filmId,
      episode: episode.index,
      clientId,
      download_at: new Date(),
    });

    let episodeLoaded = 0;
    const chunks = {};
    const episodeSize = episode.video_size || 0;
    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log(`[!] - Downloading [${episode.name}]: 100%`);
        break;
      }
      chunks[episodeLoaded] = value;
      episodeLoaded += value.length;

      // Update progress (overall % based on total bytes)
      if (episodeSize > 0) {
        const overallProgress = Math.floor((episodeLoaded / episodeSize) * 100);
        await job.progress(overallProgress);
        // process.stdout.write(`[!] - Downloading [${episode.name}]: ${overallProgress}% \r`);
      }
    }

    // Combine chunks into a single buffer
    const chunksAll = new Uint8Array(episodeLoaded);
    Object.keys(chunks).forEach(index => {
      chunksAll.set(chunks[index], Number(index));
    });

    // Write to file
    const fileName = (filmName) ? `${filmName} ${episode.index}.mp4` : episode.name;
    const episodePath = path.join(dirPath, fileName);
    await fs.writeFile(episodePath, chunksAll);

    console.log(`[!] - Save file complete: ${episodePath}`);

    // Save result in job data
    const episodeLink = `${process.env.PUBLIC_DATA_URL}/${filmId}/${fileName}`;
    await job.update({ 
      ...job.data, 
      result_file_path: episodePath, 
      result_link: episodeLink 
    });
    await JobRepository.updateJob(Number(job.id), episodePath, episodeLink);

    console.log('[!] - Download episode file successfully');

    // Final progress: 100%
    await job.progress(100);

  } catch (error) {
    console.error(`[x] - Failed to download episode file: ${error.message}`);
    throw new Error(`Failed to download episode file: ${error.message}`);
  }
});

// Event listeners for monitoring
videoQueue.on('completed', (job) => {
  console.log(`\n[!] Job ${job.id} for filmId ${job.data.filmId} completed`);
});

videoQueue.on('failed', (job, err) => {
  console.log(`\n[x] Job ${job.id} for filmId ${job.data.filmId} failed: ${err.message}`);
});

module.exports = { videoQueue };
