const axios = require('axios');

const PangleRepository = require('./pangle.repo')
const { ApiError } = require('../../common/filters/error.filter');
const { generateSignKey } = require('../../common/helpers/crypto.helper');
const { ResponseListData } = require('../../common/types/api.response.type');

class PangleService {

  async getCategories() {
    console.log(`\n[!] Get list categories`);
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const response = await axios.post(`${process.env.BYTEDANCE_API_URL}/category/list`, {
        auth_info: { 
          user_id: Number(process.env.BYTEDANCE_USER_ID), 
          role_id: Number(process.env.BYTEDANCE_ROLE_ID), 
          timestamp, 
          sign: generateSignKey(timestamp)
        },
      });
      const result = response.data;
      if (result && result.code==='100') {
        console.log(`\n[!] - Get list ${result.data.length} categories success`);
        return result.data;
      } else {
        throw new Error(`${result.message} (${result.code})`);
      }
    } catch (error) {
      console.error(`[x] - Get list categories fail: ${error.message}`);
      throw new ApiError(500, 'Failed to fetch categories from provider');
    }
  }

  async getPangleList(filters) {
    console.log(`\n[!] Get list pangle films: ${JSON.stringify(filters)}`);
    try {
      // Fetch from provider
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const response = await axios.post(`${process.env.BYTEDANCE_API_URL}/file/list`, {
        auth_info: { 
          user_id: Number(process.env.BYTEDANCE_USER_ID), 
          role_id: Number(process.env.BYTEDANCE_ROLE_ID), 
          timestamp, 
          sign: generateSignKey(timestamp)
        },
        page_info: { 
          page: filters.page || 1, 
          page_size: filters.page_size || 100
        },
        controller: { 
          category_ids: filters.category_ids,
          lang: filters.langs,
          voice_lang: filters.voice_langs,
          title: filters.title,
        }
      });

      const result = response.data;
      if (result && result.code==='100') {

        const pangles = result.data;
        console.log(`[!] - Get ${pangles.length} films success`);
        // Store...
        if (process.env.STORE_DATA==='ENABLE') {
          await PangleRepository.updateOne(pangles);
          console.log(`[!] - Save new films into DB success`);
        }
        return new ResponseListData({
          success: true,
          data: pangles,
          pagination: response.data.page_info
        });

      } else {
        throw new Error(`${result.message} (${result.code})`);
      }
    } catch (error) {
      console.error(`[x] - Get list pangle films fail: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  async getPangleListFromDB(page = 1, pageSize = 1200, filters = {}) {
    try {
      // Fetch data with pagination
      const [data, total] = await PangleRepository.list(page, pageSize, filters);

      // Calculate total pages
      const totalPage = Math.ceil(total / pageSize);

      return {
        success: true,
        data,
        pagination: {
          page,
          page_size: pageSize,
          total,
          total_page: totalPage
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new PangleService();
