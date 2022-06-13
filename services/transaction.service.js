const transactionRepo = require("../repositories/transaction.repo");
const userRepo = require("../repositories/user.repo");
const productRepo = require("../repositories/product.repo");

const {
  ClickError,
  ClickAction,
  TransactionStatus,
} = require("../enums/transaction.enum");

const { checkClickSignature } = require("../helpers/check-signature.helper");

class TransactionService {
  constructor(repo, userRepo, productRepo) {
    this.repo = repo;
    this.userRepo = userRepo;
    this.productRepo = productRepo;
  }

  async prepare(data) {
    const {
      click_trans_id: transId,
      service_id: serviceId,
      merchant_trans_id: userId,
      product_id: productId,
      amount,
      action,
      sign_time: signTime,
      sign_string: signString,
    } = data;

    const signatureData = {
      transId,
      serviceId,
      userId,
      amount,
      action,
      signTime,
    };

    const checkSignature = checkClickSignature(signatureData, signString);
    if (!checkSignature) {
      return {
        error: ClickError.SignFailed,
        error_note: "Invalid sign",
      };
    }

    if (parseInt(action) !== ClickAction.Prepare) {
      return {
        error: ClickError.ActionNotFound,
        error_note: "Action not found",
      };
    }

    const isAlreadyPaid = await this.repo.getByFilter({
      userId,
      productId,
      status: TransactionStatus.Paid,
    });
    if (isAlreadyPaid) {
      return {
        error: ClickError.AlreadyPaid,
        error_note: "Already paid",
      };
    }

    const user = await this.userRepo.getById(userId);
    if (!user) {
      return {
        error: ClickError.UserNotFound,
        error_note: "User not found",
      };
    }

    const product = await this.productRepo.getById(productId);
    if (!product) {
      return {
        error: ClickError.BadRequest,
        error_note: "Product not found",
      };
    }

    if (parseInt(amount) !== product.price) {
      return {
        error: ClickError.InvalidAmount,
        error_note: "Incorrect parameter amount",
      };
    }

    const transaction = await this.repo.getById(transId);
    if (transaction && transaction.status === TransactionStatus.Canceled) {
      return {
        error: ClickError.TransactionCanceled,
        error_note: "Transaction canceled",
      };
    }

    const time = new Date().getTime();

    await this.repo.create({
      id: transId,
      user_id: userId,
      product_id: productId,
      status: TransactionStatus.Pending,
      create_time: time,
      amount,
      prepare_id: time,
    });

    return {
      click_trans_id: transId,
      merchant_trans_id: userId,
      merchant_prepare_id: time,
      error: ClickError.Success,
      error_note: "Success",
    };
  }

  async complete(data) {
    const {
      click_trans_id: transId,
      service_id: serviceId,
      merchant_trans_id: userId,
      product_id: productId,
      merchant_prepare_id: prepareId,
      amount,
      action,
      sign_time: signTime,
      sign_string: signString,
      error,
    } = data;

    const signatureData = {
      transId,
      serviceId,
      userId,
      prepareId,
      amount,
      action,
      signTime,
    };

    const checkSignature = checkClickSignature(signatureData, signString);
    if (!checkSignature) {
      return {
        error: ClickError.SignFailed,
        error_note: "Invalid sign",
      };
    }

    if (parseInt(action) !== ClickAction.Complete) {
      return {
        error: ClickError.ActionNotFound,
        error_note: "Action not found",
      };
    }

    const user = await this.userRepo.getById(userId);
    if (!user) {
      return {
        error: ClickError.UserNotFound,
        error_note: "User not found",
      };
    }

    const product = await this.productRepo.getById(productId);
    if (!product) {
      return {
        error: ClickError.BadRequest,
        error_note: "Product not found",
      };
    }

    const isPrepared = await this.repo.getByFilter({
      prepare_id: prepareId,
    });
    if (!isPrepared) {
      return {
        error: ClickError.TransactionNotFound,
        error_note: "Transaction not found",
      };
    }

    const isAlreadyPaid = await this.repo.getByFilter({
      userId,
      productId,
      status: TransactionStatus.Paid,
    });
    if (isAlreadyPaid) {
      return {
        error: ClickError.AlreadyPaid,
        error_note: "Already paid for course",
      };
    }

    if (parseInt(amount) !== product.price) {
      return {
        error: ClickError.InvalidAmount,
        error_note: "Incorrect parameter amount",
      };
    }

    const transaction = await this.repo.getById(transId);
    if (transaction && transaction.status === TransactionStatus.Canceled) {
      return {
        error: ClickError.TransactionCanceled,
        error_note: "Transaction canceled",
      };
    }

    const time = new Date().getTime();

    if (error < 0) {
      await this.repo.updateById(transId, {
        status: TransactionStatus.Canceled,
        cancel_time: time,
      });

      return {
        error: ClickError.TransactionNotFound,
        error_note: "Transaction not found",
      };
    }

    await this.repo.updateById(transId, {
      status: TransactionStatus.Paid,
      perform_time: time,
    });

    return {
      click_trans_id: transId,
      merchant_trans_id: userId,
      merchant_confirm_id: time,
      error: ClickError.Success,
      error_note: "Success",
    };
  }
}

module.exports = new TransactionService(transactionRepo, userRepo, productRepo);
