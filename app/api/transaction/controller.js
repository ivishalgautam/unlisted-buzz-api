"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import { sequelize } from "../../db/postgres.js";
import { transactionSchema } from "../../validation-schemas/transaction.schema.js";
const { NOT_FOUND } = constants.http.status;

const create = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const validateData = transactionSchema.parse(req.body);

    const investement = await table.InvestmentModel.getById(
      0,
      validateData.investment_id
    );
    if (!investement)
      return res
        .code(404)
        .send({ status: "false", message: "Investment not found!" });

    if (validateData.quantity > investement.quantity)
      return res.code(409).send({
        status: false,
        message: `You have only "${investement.quantity}" shares!`,
      });

    let newReq = { ...req };
    let newQuantity = investement.quantity - validateData.quantity;
    if (newQuantity === 0) {
      await table.InvestmentModel.deleteById(0, validateData.investment_id, {
        transaction,
      });
    }
    const isInvestmentUpdated =
      newQuantity &&
      (await table.InvestmentModel.updateQuantity(
        newQuantity,
        validateData.investment_id,
        { transaction }
      ));

    console.log({ isInvestmentUpdated });

    req.body.share_id = investement.share_id;
    req.body.share_type = investement.share_type;
    await table.TransactionModel.create(req, { transaction });

    await transaction.commit();
    res.send({ status: true, message: "Created." });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const updateById = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const record = await table.TransactionModel.getById(req);
    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Transaction not found!" });
    }
    await table.TransactionModel.update(req, 0, { transaction });

    await transaction.commit();
    res.send({
      status: true,
      message: "Updated.",
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getById = async (req, res) => {
  try {
    const record = await table.TransactionModel.getById(req);
    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Transaction not found!" });
    }

    res.send({ status: true, data: record });
  } catch (error) {
    throw error;
  }
};

const get = async (req, res) => {
  try {
    const data = await table.TransactionModel.get(req);
    res.send({ status: true, data: data, total: data?.[0]?.total });
  } catch (error) {
    throw error;
  }
};

const deleteById = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const record = await table.TransactionModel.getByPk(req);
    if (!record)
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Transaction not found!" });

    await table.TransactionModel.deleteById(req, req.params.id, {
      transaction,
    });

    await transaction.commit();
    res.send({ status: true, message: "Transaction deleted." });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export default {
  create: create,
  get: get,
  updateById: updateById,
  deleteById: deleteById,
  getById: getById,
};
