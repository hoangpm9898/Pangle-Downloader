
class ResponseListData {
  constructor({ success, data, pagination }) {
    this.success = success;
    this.data = data;
    this.pagination = pagination;
  }
}

module.exports = { ResponseListData };
