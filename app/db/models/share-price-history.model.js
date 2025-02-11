"use strict";
import moment from "moment";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { Deferrable, Op, QueryTypes } from "sequelize";
const { DataTypes } = sequelizeFwk;

let SharePriceHistoryModel = null;

const init = async (sequelize) => {
  SharePriceHistoryModel = sequelize.define(
    constants.models.SHARE_PRICE_HISTORY_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
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
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          max: 2147483647,
          min: -2147483648,
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

  await SharePriceHistoryModel.sync({ alter: true });
};

const create = async (req, { transaction }) => {
  return await SharePriceHistoryModel.create(
    {
      share_id: req.body.share_id,
      price: req.body.price,
      date: req.body.date,
    },
    { transaction }
  );
};

const get = async (req) => {
  let whereConditions = [];
  const queryParams = {};
  let q = req.query.q;
  if (q) {
    whereConditions.push(`sp.name ILIKE :query`);
    queryParams.query = `%${q}%`;
  }

  const featured = req.query.featured;
  if (featured) {
    whereConditions.push(`sp.is_featured = true`);
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
      COUNT(sp.id) OVER()::integer as total
    FROM ${constants.models.SHARE_PRICE_HISTORY_TABLE} sp
    LEFT JOIN ${constants.models.SHARE_TABLE} shr ON shr.id = sp.share_id
    ${whereClause}
    ORDER BY sp.created_at DESC
  `;

  let query = `
  SELECT
      sp.id, sp.price, sp.created_at
    FROM ${constants.models.SHARE_PRICE_HISTORY_TABLE} sp
    LEFT JOIN ${constants.models.SHARE_TABLE} shr ON shr.id = sp.share_id
    ${whereClause}
    ORDER BY sp.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

  const data = await SharePriceHistoryModel.sequelize.query(query, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });

  const count = await SharePriceHistoryModel.sequelize.query(countQuery, {
    replacements: { ...queryParams },
    type: QueryTypes.SELECT,
    raw: true,
  });

  return { prices: data, total: count?.[0]?.total ?? 0 };
};

const update = async (req, id, { transaction }) => {
  const [rowCount, rows] = await SharePriceHistoryModel.update(
    {
      price: req.body.price,
      date: req.body.date,
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
  return await SharePriceHistoryModel.findOne({
    where: {
      id: req.params.id || id,
    },
  });
};

const getByPk = async (req, id) => {
  return await SharePriceHistoryModel.findByPk(req?.params?.id || id);
};

const deleteById = async (req, id, { transaction }) => {
  return await SharePriceHistoryModel.destroy({
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
