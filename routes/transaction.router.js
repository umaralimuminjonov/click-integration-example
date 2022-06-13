const express = require("express");

const transactionController = require("../controllers/transaction.controller");

const router = express.Router();

router.post("/prepare", transactionController.prepare);

router.post("/complete", transactionController.complete);

module.exports = router;
