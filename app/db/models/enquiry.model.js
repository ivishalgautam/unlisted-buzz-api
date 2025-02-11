"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { Deferrable, QueryTypes } from "sequelize";
const { DataTypes } = sequelizeFwk;

let EnquiryModel = null;

const init = async (sequelize) => {
  EnquiryModel = sequelize.define(
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
        validate: {
          max: 2147483647,
          min: -2147483648,
        },
      },
      price_per_share: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          max: 2147483647,
          min: -2147483648,
        },
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

  await EnquiryModel.sync({ alter: true });
};

const create = async (req) => {
  return await EnquiryModel.create({
    transaction_type: req.body.transaction_type,
    share_id: req.body.share_id,
    quantity: req.body.quantity,
    price_per_share: req.body.price_per_share,
    message: req.body.message,
  });
};

const get = async (req) => {
  let whereConditions = [];
  const queryParams = {};
  let q = req.query.q;
  if (q) {
    whereConditions.push(`shr.name ILIKE :query`);
    queryParams.query = `%${q}%`;
  }

  let transactionType = req.query.type ? req.query.type.split(".") : "";
  if (transactionType) {
    whereConditions.push(`enq.transaction_type = ANY(:type)`);
    queryParams.type = `{${transactionType.join(",")}}`;
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
        COUNT(shr.id) OVER()::integer as total
      FROM ${constants.models.ENQUIRY_TABLE} enq
      LEFT JOIN ${constants.models.SHARE_TABLE} shr ON shr.id = enq.share_id
      ${whereClause}
      `;

  let query = `
      SELECT
        enq.*
      FROM ${constants.models.ENQUIRY_TABLE} enq
      LEFT JOIN ${constants.models.SHARE_TABLE} shr ON shr.id = enq.share_id
      ${whereClause}
      ORDER BY enq.created_at DESC
      LIMIT :limit OFFSET :offset
    `;

  const data = await EnquiryModel.sequelize.query(query, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });

  const count = await EnquiryModel.sequelize.query(countQuery, {
    replacements: { ...queryParams },
    type: QueryTypes.SELECT,
    raw: true,
  });

  return { enquiries: data, total: count?.[0]?.total ?? 0 };
};

const getById = async (req, id) => {
  return await EnquiryModel.findOne({
    where: {
      id: req.params.id || id,
    },
  });
};

const deleteById = async (req, id) => {
  return await EnquiryModel.destroy({
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
