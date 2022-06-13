const transactionService = require("../services/transaction.service");

class TransactionController {
  constructor(service) {
    this.service = service;
  }

  async prepare(req, res, next) {
    try {
      const data = req.body;

      const result = await this.service.prepare(data);

      res
        .set({
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        })
        .send(result);
    } catch (err) {
      next(err);
    }
  }

  async complete(req, res, next) {
    try {
      const data = req.body;

      const result = await this.service.complete(data);

      res
        .set({
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        })
        .send(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TransactionController(transactionService);
