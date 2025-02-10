"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { Deferrable } from "sequelize";
const { DataTypes } = sequelizeFwk;

let QueryModel = null;

const init = async (sequelize) => {
  QueryModel = sequelize.define(
    constants.models.ENQUIRY_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      transaction_type: {
        type: DataTypes.ENUM(["buy", "sell"]),
        allowNull: false,
        validate: {
          isIn: [["buy", "sell"]],
        },
      },
      share_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.SHARE_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      price_per_share: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await QueryModel.sync({ alter: true });
};

const create = async (req) => {
  return await QueryModel.create({
    transaction_type: req.body.transaction_type,
    share_id: req.body.share_id,
    quantity: req.body.quantity,
    price_per_share: req.body.price_per_share,
    message: req.body.message,
  });
};

const get = async (req) => {
  return await QueryModel.findAll({
    order: [["created_at", "DESC"]],
  });
};

const getById = async (req, id) => {
  return await QueryModel.findOne({
    where: {
      id: req.params.id || id,
    },
  });
};

const deleteById = async (req, id) => {
  return await QueryModel.destroy({
    where: { id: req.params.id || id },
  });
};

export default {
  init: init,
  create: create,
  get: get,
  getById: getById,
  deleteById: deleteById,
};
