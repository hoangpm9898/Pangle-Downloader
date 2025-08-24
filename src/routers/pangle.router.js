const express = require('express');
const router = express.Router();

const PangleService = require('../modules/pangle/pangle.service');
const { pangleFilterSchema } = require('../common/dtos/pangle.dto');
const { ApiError } = require('../common/filters/error.filter');

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await PangleService.getCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

router.post('/list', async (req, res, next) => {
  try {
    // const { error, value } = pangleFilterSchema.validate(req.body);
    // if (error) throw new ApiError(400, error.details[0].message);
    const { getFrom } = req.query;
    const result = (getFrom==='db') ? 
      await PangleService.getPangleListFromDB() : await PangleService.getPangleList(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;