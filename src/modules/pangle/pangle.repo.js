const Pangle = require('./pangle.model');

class PangleRepository {

  async findOne(fileId) {
    try {
      const film = await Pangle
        .findOne({ file_id: fileId })
        .select('title desc cover_image lang voice_lang categories created_at')
        .lean();
      if (!film) return null;
      return film;
    } catch (error) {
      throw error;
    }
  }

  async list(page, pageSize, filters) { 
    
    // Validate page and pageSize
    page = parseInt(page) || 1;
    pageSize = parseInt(pageSize) || 100;
      
    // Build query from filters
    const query = {};
    // if (filters.category_ids && Array.isArray(filters.category_ids)) {
    //   query['categories.id'] = { $in: filters.category_ids };
    // }
    // if (filters.lang) {
    //   query.lang = filters.lang;
    // }
    // if (filters.voice_lang) {
    //   query.voice_lang = filters.voice_lang;
    // }
    // if (filters.title) {
    //   query.title = { $regex: filters.title, $options: 'i' }; // Case-insensitive title search
    // }

    // Calculate skip for pagination
    const skip = (page - 1) * pageSize;

    // Fetch data with pagination
    return Promise.all([
      Pangle
        .find(query)
        .select('file_id shortplay_id title desc cover_image lang voice_lang categories created_at')
        .sort({ created_at: -1 }) // Sort by created_at in descending order (most recent first)
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Pangle.countDocuments(query)
    ]);
  }

  async updateOne(pangles) {
    try {
      // Prepare bulk operations for upsert
      const bulkOps = pangles.map(pangle => ({
        updateOne: {
          filter: { file_id: pangle.file_id, provider: 'bytedrama' },
          update: {
            $set: {
              ...pangle,
              provider: 'bytedrama',
              categories: pangle.category,
              updated_at: new Date()
            },
            $setOnInsert: {
              created_at: new Date()
            }
          },
          upsert: true
        }
      }));
      // Execute bulk write
      await Pangle.bulkWrite(bulkOps);
    } catch (error) {
    }
  }

  async findOneAndUpdate(pangle) {
    try {
      // Upsert into MongoDB
      await Pangle.findOneAndUpdate(
        { file_id, provider },
        {
          $set: {
            ...pangle,
            provider,
            categories: pangle.category,
            updated_at: new Date()
          },
          $setOnInsert: { created_at: new Date() }
        },
        { upsert: true, new: true }
      );
    } catch (error) {
    }
  }
}

module.exports = new PangleRepository();
