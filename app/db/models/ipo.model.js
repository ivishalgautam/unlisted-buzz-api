"use strict";
import moment from "moment";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable, Op, QueryTypes } from "sequelize";

let IPOModel = null;

const init = async (sequelize) => {
  IPOModel = sequelize.define(
    constants.models.IPO_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      ipo_price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      share_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: constants.models.SHARE_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
        unique: {
          msg: "Sector exist with this name!",
        },
        validate: { isUUID: "4" },
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await IPOModel.sync({ alter: true });
};

const create = async (req, shareId, { transaction }) => {
  return await IPOModel.create(
    {
      ipo_price: req.body.ipo_price,
      share_id: shareId,
    },
    { transaction }
  );
};

const get = async (req) => {
  let whereConditions = [];
  const queryParams = {};
  let q = req.query.q;
  if (q) {
    // whereConditions.push(`ipo.name ILIKE :query`);
    // queryParams.query = `%${q}%`;
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
      COUNT(ipo.id) OVER()::integer as total
    FROM ${constants.models.IPO_TABLE} ipo
    ${whereClause}
    ORDER BY ipo.created_at DESC
  `;

  let query = `
  SELECT
      ipo.id, ipo.name, ipo.image, ipo.slug, ipo.created_at
    FROM ${constants.models.IPO_TABLE} ipo
    ${whereClause}
    ORDER BY ipo.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

  const data = await IPOModel.sequelize.query(query, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });

  const count = await IPOModel.sequelize.query(countQuery, {
    replacements: { ...queryParams },
    type: QueryTypes.SELECT,
    raw: true,
  });

  return { sectors: data, total: count?.[0]?.total ?? 0 };
};

const update = async (req, id, { transaction }) => {
  const [rowCount, rows] = await IPOModel.update(
    {
      ipo_price: req.body.ipo_price,
    },
    {
      where: {
        id: req?.params?.id || id,
      },
      returning: true,
      raw: true,
      transaction,
    }
  );

  return rows[0];
};

const getById = async (req, id) => {
  return await IPOModel.findOne({
    where: {
      id: req.params.id || id,
    },
  });
};

const getByShareId = async (req, id) => {
  return await IPOModel.findOne({
    where: {
      share_id: req?.params?.id || id,
    },
    raw: true,
  });
};

const getByPk = async (req, id) => {
  return await IPOModel.findByPk(req?.params?.id || id);
};

const deleteById = async (req, id, { transaction }) => {
  return await IPOModel.destroy({
    where: { id: req?.params?.id || id },
    transaction,
  });
};

export default {
  init: init,
  create: create,
  get: get,
  update: update,
  getById: getById,
  getByShareId: getByShareId,
  getByPk: getByPk,
  deleteById: deleteById,
};
