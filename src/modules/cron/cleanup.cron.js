const cron = require('node-cron');

const JobRepository = require('../download/job.repo');
const { deleteFolderFromFilePath } = require('../../common/helpers/file.helper');

class JobCleanupCron {

  constructor() {
    console.log('\n**** Start Job cleanup cron...');
    // Schedule cron job to run every hour
    this.scheduleCleanup();
  }

  scheduleCleanup() {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
      try {
        await this.cleanupOldJobs();
        console.log('\n**** Cleanup job completed successfully');
      } catch (error) {
        console.error('\n**** Error in cleanup job:', error);
      }
    });
  }

  async cleanupOldJobs() {
    // Calculate the timestamp for one hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    // Find jobs older than one hour
    const oldJobs = await JobRepository.getListOldJobs(oneHourAgo);
    // Process each job
    for (const job of oldJobs) {
      try {
        // Delete the local file if it exists
        if (job.result_file_path) {
          // await fs.unlink(job.result_file_path);
          if (await deleteFolderFromFilePath(job.result_file_path)) {
            console.log(`\n**** Deleted file: ${job.result_file_path}`);
          } else {
            console.log(`\n**** Can't download file: ${job.result_file_path}`);
          }
        }
        // Delete the job from the database
        await JobRepository.removeJob(job._id);
        console.log(`\n**** Deleted job: ${job.jobId}`);
      } catch (error) {
        console.error(`\n**** Error processing job ${job.jobId}:`, error);
        // Continue with next job even if one fails
        continue;
      }
    }
    return {
      deletedJobsCount: oldJobs.length,
      timestamp: new Date()
    };
  }

  // Method to manually trigger cleanup (for testing or admin purposes)
  async triggerCleanup() {
    return await this.cleanupOldJobs();
  }
}

module.exports = new JobCleanupCron();