"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { Deferrable, Op, QueryTypes } from "sequelize";
const { DataTypes } = sequelizeFwk;

let TransactionModel = null;

const init = async (sequelize) => {
  TransactionModel = sequelize.define(
    constants.models.TRANSACTION_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
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
      share_id: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          isUUID: "4",
        },
        references: {
          model: constants.models.SHARE_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
        onDelete: "CASCADE",
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      share_type: {
        type: DataTypes.ENUM("current", "external"),
        allowNull: false,
        validate: {
          isIn: [["current", "external"]],
        },
      },
      type: {
        type: DataTypes.ENUM("buy", "sell"),
        allowNull: false,
        validate: {
          isIn: [["buy", "sell"]],
        },
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await TransactionModel.sync({ alter: true });
};

const create = async (req, { transaction }) => {
  return await TransactionModel.create(
    {
      share_id: req.body.share_id,
      user_id: req.user_data.id,
      quantity: req.body.quantity,
      price: req.body.price,
      share_type: req.body.share_type,
      type: req.body.type,
      date: req.body.date,
    },
    { transaction }
  );
};

const get = async (req) => {
  let whereConditions = [];
  const queryParams = {};
  const { role, id } = req.user_data;
  if (role === "user") {
    whereConditions.push(`trn.user_id = :user_id`);
    queryParams.user_id = id;
  }

  let q = req.query.q;
  if (q) {
    whereConditions.push(`shr.name ILIKE :query`);
    queryParams.query = `%${q}%`;
  }

  let shareTypes = req.query.share_type
    ? req.query.share_type.split(".")
    : null;
  if (shareTypes?.length) {
    whereConditions.push(`trn.share_type = ANY(:shareTypes)`);
    queryParams.shareTypes = `{${shareTypes.join(",")}}`;
  }

  let types = req.query.type ? req.query.type.split(".") : null;
  if (types?.length) {
    whereConditions.push(`trn.type = ANY(:types)`);
    queryParams.types = `{${types.join(",")}}`;
  }

  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : null;
  const offset = (page - 1) * limit;

  let whereClause = "";
  if (whereConditions.length > 0) {
    whereClause = "WHERE " + whereConditions.join(" AND ");
  }

  let countQuery = `
  SELECT
      COUNT(trn.id) OVER()::integer as total
    FROM ${constants.models.TRANSACTION_TABLE} trn
    LEFT JOIN ${constants.models.SHARE_TABLE} shr ON shr.id = trn.share_id
    ${whereClause}
    GROUP BY trn.id
    ORDER BY trn.created_at DESC
  `;

  let query = `
  SELECT
      trn.*,
      SUM(trn.quantity * trn.price)::integer as total_value,
      shr.name as share_name,
      shr.price as share_price
    FROM ${constants.models.TRANSACTION_TABLE} trn
    LEFT JOIN ${constants.models.SHARE_TABLE} shr ON shr.id = trn.share_id
    ${whereClause}
    GROUP BY trn.id, shr.name, shr.price
    ORDER BY trn.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

  const data = await TransactionModel.sequelize.query(query, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });

  const count = await TransactionModel.sequelize.query(countQuery, {
    replacements: { ...queryParams },
    type: QueryTypes.SELECT,
    raw: true,
  });

  return { transactions: data, total: count?.[0]?.total ?? 0 };
};

const update = async (req, id, { transaction }) => {
  const [rowCount, rows] = await TransactionModel.update(
    {
      share_id: req.body.share_id,
      user_id: req.user_data.id,
      quantity: req.body.quantity,
      price: req.body.price,
      share_type: req.body.share_type,
      type: req.body.type,
    },
    {
      where: {
        id: req.params.id || id,
      },
      returning: true,
      raw: true,
      transaction,
    }
  );

  return rows[0];
};

const getById = async (req, id) => {
  return await TransactionModel.findOne({
    where: {
      id: req.params.id || id,
    },
  });
};

const getByPk = async (req, id) => {
  return await TransactionModel.findByPk(req?.params?.id || id);
};

const deleteById = async (req, id, { transaction }) => {
  return await TransactionModel.destroy({
    where: { id: req.params.id || id },
    transaction,
  });
};

export default {
  init: init,
  create: create,
  get: get,
  update: update,
  getById: getById,
  getByPk: getByPk,
  deleteById: deleteById,
};
