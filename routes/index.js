const express = require("express");

const transactionRouter = require("./transaction.router");

const router = express.Router();

router.use("/payments/click", transactionRouter);

module.exports = router;
