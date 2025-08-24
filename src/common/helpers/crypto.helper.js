const { createHash } = require('crypto');

const generateSignKey = (timestamp) => {
  try {
    const params = {
      timestamp,
      user_id: Number(process.env.BYTEDANCE_USER_ID),
      role_id: Number(process.env.BYTEDANCE_ROLE_ID),
    };

    const sortedParams = Object.entries(params)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .filter(([, value]) => value !== '' && value !== null && value !== undefined);

    const rawString = sortedParams
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    if (!rawString) return '';

    const signString = `${rawString}${process.env.BYTEDANCE_TOKEN}`;
    return createHash('md5')
      .update(signString)
      .digest('hex');

  } catch (error) {}
}

module.exports = { generateSignKey };
