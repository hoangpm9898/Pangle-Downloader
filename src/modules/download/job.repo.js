
const DownloadJob = require('./job.model');

class JobRepository {
  
  async saveDownloadJob(job) {
    try {
      await DownloadJob.create(job);
    } catch (error) {
    }
  }

  async getListJobs(matchStage) {
    try {
      const aggregatedResults = await DownloadJob.aggregate([
        { $match: matchStage },
        // {
        //   $group: {
        //     filmId: '$filmId',
        //     episodes: { $push: '$episode' },        // Collect episodes vào array
        //     download_at: { $first: '$download_at' } // Hoặc $min/$max nếu cần
        //   }
        // },
        { $sort: { download_at: 1 } }               // Sắp xếp theo download_at
      ]);
      return aggregatedResults;
    } catch (error) {
    }
  }

  async getListOldJobs(oneHourAgo) {
    try {
      return await DownloadJob.find({
        download_at: { $lt: oneHourAgo }
      });
    } catch (error) {
    }
  }

  async removeJob(jobId) {
    try {
      await DownloadJob.deleteOne({ _id: jobId });
    } catch (error) {
    }
  }

  async updateJob(jobId, resultFilePath, resultLink) {
    try {
      const updatedJob = await DownloadJob.findOneAndUpdate(
        { jobId: jobId }, // Filter to find the document by jobId
        { 
          $set: { 
            result_file_path: resultFilePath, 
            result_link: resultLink 
          } 
        }, // Fields to update
        { new: true } // Return the updated document
      );
      if (!updatedJob) {
        // console.log(`No document found with jobId: ${jobId}`);
        return null;
      }
      // console.log('Updated document:', updatedJob);
      return updatedJob;
    } catch (error) {
      // console.error('Error updating document:', error);
      throw error;
    }
  }
}

module.exports = new JobRepository();