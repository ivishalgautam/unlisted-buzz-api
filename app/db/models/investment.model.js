"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { Deferrable, Op, QueryTypes } from "sequelize";
const { DataTypes } = sequelizeFwk;

let InvestmentModel = null;

const init = async (sequelize) => {
  InvestmentModel = sequelize.define(
    constants.models.INVESTMENT_TABLE,
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
      purchase_price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      date_of_purchase: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      share_type: {
        type: DataTypes.ENUM("current", "external"),
        allowNull: false,
        validate: {
          isIn: [["current", "external"]],
        },
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await InvestmentModel.sync({ alter: true });
};

const create = async (req, { transaction }) => {
  return await InvestmentModel.create(
    {
      share_id: req.body.share_id,
      user_id: req.user_data.id,
      quantity: req.body.quantity,
      purchase_price: req.body.purchase_price,
      date_of_purchase: req.body.date_of_purchase,
      share_type: req.body.share_type,
    },
    { transaction }
  );
};

const get = async (req) => {
  let whereConditions = [];
  const queryParams = {};
  const { role, id } = req.user_data;
  if (role === "user") {
    whereConditions.push(`inv.user_id = :user_id`);
    queryParams.user_id = id;
  }

  let q = req.query.q;
  if (q) {
    whereConditions.push(`shr.name ILIKE :query`);
    queryParams.query = `%${q}%`;
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
      COUNT(inv.id) OVER()::integer as total
    FROM ${constants.models.INVESTMENT_TABLE} inv
    LEFT JOIN ${constants.models.SHARE_TABLE} shr ON shr.id = inv.share_id
    ${whereClause}
    GROUP BY inv.id
    ORDER BY inv.created_at DESC
  `;

  let query = `
  SELECT
    inv.id,
    inv.share_type,
    inv.quantity::integer AS quantity,
    inv.purchase_price::integer AS purchase_price,
    (shr.price * inv.quantity)::integer AS current_value,
    (inv.purchase_price * inv.quantity)::integer AS investment_value,
    (shr.price * inv.quantity) <= (inv.purchase_price * inv.quantity) AS is_loss,
    CASE
      WHEN (inv.purchase_price * inv.quantity) = 0 THEN 0
      ELSE 
        ROUND(
          (
            (
              (shr.price * inv.quantity) - (inv.purchase_price * inv.quantity)
            )::numeric / NULLIF((inv.purchase_price * inv.quantity), 0)
          ) * 100, 2
        )
    END AS pnl_percent,
    shr.id AS share_id,
    shr.name AS share_name,
    shr.price AS share_price
    FROM ${constants.models.INVESTMENT_TABLE} inv
    LEFT JOIN ${constants.models.SHARE_TABLE} shr 
        ON shr.id = inv.share_id
    ${whereClause}
    GROUP BY inv.id, shr.id, shr.name, shr.price
    ORDER BY inv.created_at DESC
    LIMIT :limit OFFSET :offset;
  `;

  const data = await InvestmentModel.sequelize.query(query, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });

  const count = await InvestmentModel.sequelize.query(countQuery, {
    replacements: { ...queryParams },
    type: QueryTypes.SELECT,
    raw: true,
  });

  return { investments: data, total: count?.[0]?.total ?? 0 };
};

const portfolioData = async (req) => {
  const { id } = req.user_data;

  let query = `
  SELECT
    SUM(inv.purchase_price * inv.quantity)::integer AS total_investment,
    SUM(shr.price * inv.quantity)::integer AS total_current_value,
    (SUM(shr.price * inv.quantity) - SUM(inv.purchase_price * inv.quantity))::integer AS total_pnl_value,
    CASE
      WHEN SUM(inv.purchase_price * inv.quantity) = 0 THEN 0
      ELSE 
        ROUND(
          (
            (
              SUM(shr.price * inv.quantity) - SUM(inv.purchase_price * inv.quantity)
            )::numeric / NULLIF(SUM(inv.purchase_price * inv.quantity), 0)
          ) * 100, 2
        )
    END AS total_pnl_percent,
    CASE
      WHEN 
        (SUM(shr.price * inv.quantity) - SUM(inv.purchase_price * inv.quantity)) > 0 THEN 'profit'
      WHEN 
        (SUM(shr.price * inv.quantity) - SUM(inv.purchase_price * inv.quantity)) < 0 THEN 'loss'
      ELSE 'Break-even'
    END AS result_status
  FROM ${constants.models.INVESTMENT_TABLE} inv
  LEFT JOIN ${constants.models.SHARE_TABLE} shr 
      ON shr.id = inv.share_id
  WHERE inv.user_id = :userId;
`;
  const data = await InvestmentModel.sequelize.query(query, {
    replacements: { userId: id },
    type: QueryTypes.SELECT,
    raw: true,
  });

  return data?.[0] ?? {};
};

const update = async (req, id, { transaction }) => {
  const [rowCount, rows] = await InvestmentModel.update(
    {
      quantity: req.body.quantity,
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

const updateQuantity = async (quantity, id, { transaction }) => {
  const [rowCount, rows] = await InvestmentModel.update(
    { quantity },
    {
      where: {
        id: id,
      },
      returning: true,
      raw: true,
      transaction,
    }
  );

  return rows[0];
};

const getById = async (req, id) => {
  return await InvestmentModel.findOne({
    where: {
      id: req?.params?.id || id,
    },
    raw: true,
  });
};

const getByPk = async (req, id) => {
  return await InvestmentModel.findByPk(req?.params?.id || id);
};

const deleteById = async (req, id, { transaction }) => {
  return await InvestmentModel.destroy({
    where: { id: req?.params?.id || id },
    transaction,
  });
};

export default {
  init: init,
  create: create,
  get: get,
  update: update,
  updateQuantity: updateQuantity,
  getById: getById,
  getByPk: getByPk,
  deleteById: deleteById,
  portfolioData: portfolioData,
};
