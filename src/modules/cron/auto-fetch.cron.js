const cron = require('node-cron');

const PangleService = require('../pangle/pangle.service');
const NewFilmsService = require('../new-films/new-films.service');

class AutoFetchCron {

  constructor() {
    console.log('\n**** Start Auto-fetch films cron...');
    // Schedule cron job to run daily at 2:00 AM
    this.scheduleAutoFetch();
  }

  scheduleAutoFetch() {
    // Run daily at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        await this.autoFetchFilms();
        console.log('\n**** Auto-fetch films completed successfully');
      } catch (error) {
        console.error('\n**** Error in auto-fetch films:', error);
      }
    });
  }

  async autoFetchFilms() {
    console.log('\n[!] Starting daily auto-fetch for films...');
    
    try {
      // Get all categories first
      const categories = await PangleService.getCategories();
      
      // Define language parameters to fetch
      const subLanguages = ['vi', 'en', 'zh-CN', 'zh-TW']; // Vietnamese, English, Chinese Simplified, Chinese Traditional
      const voiceLanguages = ['vi', 'en', 'zh-CN', 'zh-TW']; // Same for voice languages
      
      let totalFetched = 0;
      let allNewFilms = []; // Collect all new films
      
      // Fetch films for each combination of category, sub language, and voice language
      for (const category of categories) {
        for (const subLang of subLanguages) {
          for (const voiceLang of voiceLanguages) {
            try {
              console.log(`\n[!] Fetching films for category: ${category.name}, sub: ${subLang}, voice: ${voiceLang}`);
              
              const filters = {
                category_ids: [category.id],
                langs: [subLang],
                voice_langs: [voiceLang],
                page: 1,
                page_size: 100
              };
              
              const result = await PangleService.getPangleList(filters);
              
              if (result.success && result.data && result.data.length > 0) {
                totalFetched += result.data.length;
                // Collect films for new films processing
                allNewFilms.push(...result.data);
                console.log(`[!] - Fetched ${result.data.length} films for category ${category.name}`);
              }
              
              // Add small delay between requests to avoid overwhelming the API
              await this.delay(1000);
              
            } catch (error) {
              console.error(`[x] Error fetching films for category ${category.name}, sub: ${subLang}, voice: ${voiceLang}:`, error.message);
              // Continue with next combination even if one fails
              continue;
            }
          }
        }
      }
      
      // Save all new films to the NewFilms collection and manage view history
      if (allNewFilms.length > 0) {
        console.log(`\n[!] Processing ${allNewFilms.length} total new films...`);
        const saveResult = await NewFilmsService.saveNewFilms(allNewFilms);
        if (saveResult.success) {
          console.log(`[!] - Successfully saved ${saveResult.count} new films for process ${saveResult.processId}`);
        } else {
          console.error(`[x] - Error saving new films: ${saveResult.error}`);
        }
      }
      
      console.log(`\n[!] Auto-fetch completed. Total films fetched: ${totalFetched}`);
      
      return {
        success: true,
        totalFetched,
        timestamp: new Date(),
        message: `Successfully fetched ${totalFetched} films`
      };
      
    } catch (error) {
      console.error('\n[x] Error in auto-fetch films:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  // Helper method to add delay between requests
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to manually trigger auto-fetch (for testing or admin purposes)
  async triggerAutoFetch() {
    return await this.autoFetchFilms();
  }
}

module.exports = new AutoFetchCron();
