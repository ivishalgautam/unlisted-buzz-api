"use strict";
import constants from "../../lib/constants/index.js";
import hash from "../../lib/encryption/index.js";
import { DataTypes, Deferrable } from "sequelize";

let CustomerModel = null;
const init = async (sequelize) => {
  CustomerModel = sequelize.define(
    constants.models.CUSTOMER_TABLE,
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      residency: { type: DataTypes.STRING, allowNull: false },
      country: { type: DataTypes.STRING, allowNull: false },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          isUUID: "4",
        },
        references: {
          model: constants.models.USER_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
        onDelete: "CASCADE",
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await CustomerModel.sync({ alter: true });
};

const create = async (req, user_id, { transaction }) => {
  const data = await CustomerModel.create(
    {
      residency: req.body.residency,
      country: req.body.country,
      user_id: user_id,
    },
    { transaction }
  );

  return data.dataValues;
};

const get = async (req) => {
  return await CustomerModel.findAll({});
};

const getById = async (req, id) => {
  return await CustomerModel.findOne({ where: { id: req?.params?.id || id } });
};

const getByPk = async (req, id) => {
  const data = await CustomerModel.findByPk(req?.params?.id || id);
};

const getByUserId = async (userId) => {
  return await CustomerModel.findOne({
    where: {
      user_id: userId,
    },
    raw: true,
  });
};

const update = async (req, id, { transaction }) => {
  const [rowCount, rows] = await CustomerModel.update(
    {
      residency: req.body.residency,
      country: req.body.country,
    },
    {
      where: {
        id: req?.params?.id || id,
      },
      returning: true,
      raw: true,
      plain: true,
      transaction,
    }
  );
  return rows;
};

const deleteById = async (req, user_id) => {
  return await CustomerModel.destroy({
    where: {
      id: req?.params?.id || user_id,
    },
    returning: true,
    raw: true,
  });
};

export default {
  init: init,
  create: create,
  get: get,
  getById: getById,
  getByPk: getByPk,
  getByUserId: getByUserId,
  update: update,
  deleteById: deleteById,
};
