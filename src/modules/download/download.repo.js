const Download = require('./download.model');

class DownloadRepository {

  async save(data, dirPath) {
    try {
      // Store download info
      const download = new Download({
        ...data,
        dir_path: dirPath
      });
      await download.save();
      return download;
    } catch (error) {
      console.error(`[x] - Save download-data fail: ${error.message}`);
    }
  }

  async findOne(filmId) {
    try {
      return Download.findOne({ file_id: Number(filmId) });
    } catch (error) {
    }
  }

  async updateEpisode(fileId, episodeIndex, updateData) {
    try {
      // Validate input
      if (!fileId || !episodeIndex || !updateData) {
        throw new Error('Missing required parameters: fileId, episodeIndex, or updateData');
      }

      // Prepare update object with only allowed fields
      const updateFields = {};
      if (updateData.download_url) updateFields['episode_list.$.download_url'] = updateData.download_url;
      if (updateData.file_path) updateFields['episode_list.$.file_path'] = updateData.file_path;
      updateFields['episode_list.$.downloaded_at'] = new Date(Date.now());

      if (Object.keys(updateFields).length === 0) {
        throw new Error('No valid fields provided for update');
      }

      // Update episode in episode_list array
      const result = await Download.updateOne(
        {
          file_id: fileId,
          'episode_list.index': episodeIndex
        },
        {
          $set: updateFields
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('No episode found with provided file_id and index');
      }
      return true;

    } catch (error) {
      console.error(`[x] - Failed to update episode: ${error.message}`);
    }
    return false;
  }
}

module.exports = new DownloadRepository();
