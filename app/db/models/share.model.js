"use strict";
import moment from "moment";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable, Op, QueryTypes } from "sequelize";

let ShareModel = null;

const init = async (sequelize) => {
  ShareModel = sequelize.define(
    constants.models.SHARE_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: "Sector exist with this name!",
        },
      },
      is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
      image: { type: DataTypes.TEXT, defaultValue: "" },
      sector_id: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          isUUID: "4",
        },
        references: {
          model: constants.models.SECTOR_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
        onDelete: "CASCADE",
      },
      about: { type: DataTypes.TEXT, defaultValue: "" },
      fundamentals: { type: DataTypes.JSONB, defaultValue: [] },
      shareholding_patterns: { type: DataTypes.JSONB, defaultValue: [] },
      peer_ratio: { type: DataTypes.JSONB, defaultValue: {} },
      financials: { type: DataTypes.JSONB, defaultValue: [] },
      faqs: { type: DataTypes.JSONB, defaultValue: [] },
      price: { type: DataTypes.INTEGER, allowNull: false },
      current_market_price: { type: DataTypes.INTEGER, allowNull: false },
      promoters_or_management: { type: DataTypes.JSONB, defaultValue: [] },
      is_ipo: { type: DataTypes.BOOLEAN, defaultValue: false },
      is_drhp_filed: { type: DataTypes.BOOLEAN, defaultValue: false },
      meta_title: { type: DataTypes.TEXT, defaultValue: "" },
      meta_description: { type: DataTypes.TEXT, defaultValue: "" },
      meta_keywords: { type: DataTypes.TEXT, defaultValue: "" },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await ShareModel.sync({ alter: true });
};

const create = async (req, { transaction }) => {
  const data = await ShareModel.create(
    {
      name: req.body.name,
      slug: req.body.slug,
      is_featured: req.body.is_featured,
      is_ipo: req.body.is_ipo,
      image: req.body.image,
      sector_id: req.body.sector_id,
      about: req.body.about,
      fundamentals: req.body.fundamentals,
      shareholding_patterns: req.body.shareholding_patterns,
      peer_ratio: req.body.peer_ratio,
      financials: req.body.financials,
      faqs: req.body.faqs,
      price: req.body.price,
      current_market_price: req.body.current_market_price,
      promoters_or_management: req.body.promoters_or_management,
      is_drhp_filed: req.body.is_drhp_filed,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
    },
    { returning: true, transaction }
  );

  return data.dataValues;
};

const get = async (req) => {
  let whereConditions = [];
  const queryParams = {};
  let q = req.query.q;
  if (q) {
    whereConditions.push(`sct.name ILIKE :query`);
    queryParams.query = `%${q}%`;
  }

  let sectorSlug = req.query.sector_slug;
  if (sectorSlug) {
    whereConditions.push(`sct.slug = :sectorSlug`);
    queryParams.sectorSlug = sectorSlug;
  }

  const featured = req.query.featured;
  if (featured) {
    whereConditions.push(`shr.is_featured = true`);
  }

  const is_ipo = req.query.is_ipo;
  if (is_ipo) {
    whereConditions.push(`shr.is_ipo = :is_ipo`);
    queryParams.is_ipo = is_ipo;
  }

  const is_drhp = req.query.drhp;
  if (is_drhp) {
    whereConditions.push(`shr.is_drhp_filed = true`);
  }

  const type = req.query.type ? req.query.type.split(".") : null;
  if (type?.length) {
    whereConditions.push(`shr.type = any(:type)`);
    queryParams.type = `{${type.join(",")}}`;
  }

  const timeRange = req.query.time_range ?? "15d"; // Default to 15 days
  if (timeRange) {
    const [value, unit] = [parseInt(timeRange), timeRange.replace(/\d+/g, "")];

    const intervalMap = {
      d: "DAY",
      m: "MONTH",
      y: "YEAR",
    };

    if (!intervalMap[unit]) {
      throw new Error("Invalid time range format. Use 1d, 1m, 1y, etc.");
    }

    const interval = `${value} ${intervalMap[unit]}`;
    queryParams.interval = interval;
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
    FROM ${constants.models.SHARE_TABLE} shr
    LEFT JOIN ${constants.models.SECTOR_TABLE} sct ON sct.id = shr.sector_id
    ${whereClause}
    GROUP BY
        shr.id
    ORDER BY shr.created_at DESC
    `;

  let query = `
    SELECT
      shr.id, shr.slug, shr.name, shr.image, shr.price, shr.current_market_price,
      COALESCE((
        SELECT sp.price
        FROM ${constants.models.SHARE_PRICE_HISTORY_TABLE} sp
        WHERE sp.share_id = shr.id
          AND sp.date <= CURRENT_DATE - INTERVAL :interval
        ORDER BY sp.date DESC
        LIMIT 1
      ), shr.price) AS old_price,
      shr.price AS current_price,
      COALESCE((shr.price - COALESCE((
        SELECT sp.price
        FROM ${constants.models.SHARE_PRICE_HISTORY_TABLE} sp
        WHERE sp.share_id = shr.id
          AND sp.date <= CURRENT_DATE - INTERVAL :interval
        ORDER BY sp.date DESC
        LIMIT 1
      ), shr.price)), 0) AS price_difference,
      ROUND((
        (shr.price - COALESCE((
          SELECT sp.price
          FROM ${constants.models.SHARE_PRICE_HISTORY_TABLE} sp
          WHERE sp.share_id = shr.id
            AND sp.date <= CURRENT_DATE - INTERVAL :interval
          ORDER BY sp.date DESC
          LIMIT 1
        ), shr.price))::numeric / NULLIF(COALESCE((
          SELECT sp.price
          FROM ${constants.models.SHARE_PRICE_HISTORY_TABLE} sp
          WHERE sp.share_id = shr.id
            AND sp.date <= CURRENT_DATE - INTERVAL :interval
          ORDER BY sp.date DESC
          LIMIT 1
        ), shr.price), 0) * 100
      ), 2) AS percentage_change,
      CASE
        WHEN (shr.price - COALESCE((
          SELECT sp.price
          FROM ${constants.models.SHARE_PRICE_HISTORY_TABLE} sp
          WHERE sp.share_id = shr.id
            AND sp.date <= CURRENT_DATE - INTERVAL :interval
          ORDER BY sp.date DESC
          LIMIT 1
        ), shr.price)) > 0 THEN 'gain'
        WHEN (shr.price - COALESCE((
          SELECT sp.price
          FROM ${constants.models.SHARE_PRICE_HISTORY_TABLE} sp
          WHERE sp.share_id = shr.id
            AND sp.date <= CURRENT_DATE - INTERVAL :interval
          ORDER BY sp.date DESC
          LIMIT 1
        ), shr.price)) < 0 THEN 'loss'
        ELSE 'no_change'
      END AS gain_or_loss,
      (SELECT sp.price
      FROM ${constants.models.SHARE_PRICE_HISTORY_TABLE} sp
      WHERE sp.share_id = shr.id
      ORDER BY sp.created_at ASC
      LIMIT 1) AS first_price
    FROM ${constants.models.SHARE_TABLE} shr
    LEFT JOIN ${constants.models.SECTOR_TABLE} sct ON sct.id = shr.sector_id
    ${whereClause}
    GROUP BY
      shr.id
    ORDER BY shr.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

  const data = await ShareModel.sequelize.query(query, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });

  const count = await ShareModel.sequelize.query(countQuery, {
    replacements: { ...queryParams },
    type: QueryTypes.SELECT,
    raw: true,
  });

  return { shares: data, total: count?.[0]?.total ?? 0 };
};

const getNewArrivals = async (req) => {
  let whereConditions = [];
  const queryParams = {};
  const timeRange = req.query.time_range ?? "15d";
  console.log({ timeRange });
  if (timeRange) {
    const [value, unit] = [parseInt(timeRange), timeRange.replace(/\d+/g, "")];

    const intervalMap = {
      d: "DAY",
      m: "MONTH",
      y: "YEAR",
    };

    if (!intervalMap[unit]) {
      throw new Error("Invalid time range format. Use 1d, 1m, 1y, etc.");
    }

    const interval = `${value} ${intervalMap[unit]}`;
    queryParams.interval = interval;
  }

  let query = `
    SELECT
      shr.id, shr.slug, shr.name, shr.image, shr.price, shr.current_market_price,
      COALESCE((
        SELECT sp.price
        FROM ${constants.models.SHARE_PRICE_HISTORY_TABLE} sp
        WHERE sp.share_id = shr.id
          AND sp.date <= CURRENT_DATE - INTERVAL :interval
        ORDER BY sp.date DESC
        LIMIT 1
      ), shr.price) AS old_price,
      shr.price AS current_price,
      COALESCE((shr.price - COALESCE((
        SELECT sp.price
        FROM ${constants.models.SHARE_PRICE_HISTORY_TABLE} sp
        WHERE sp.share_id = shr.id
          AND sp.date <= CURRENT_DATE - INTERVAL :interval
        ORDER BY sp.date DESC
        LIMIT 1
      ), shr.price)), 0) AS price_difference,
      ROUND((
        (shr.price - COALESCE((
          SELECT sp.price
          FROM ${constants.models.SHARE_PRICE_HISTORY_TABLE} sp
          WHERE sp.share_id = shr.id
            AND sp.date <= CURRENT_DATE - INTERVAL :interval
          ORDER BY sp.date DESC
          LIMIT 1
        ), shr.price))::numeric / NULLIF(COALESCE((
          SELECT sp.price
          FROM ${constants.models.SHARE_PRICE_HISTORY_TABLE} sp
          WHERE sp.share_id = shr.id
            AND sp.date <= CURRENT_DATE - INTERVAL :interval
          ORDER BY sp.date DESC
          LIMIT 1
        ), shr.price), 0) * 100
      ), 2) AS percentage_change,
      CASE
        WHEN (shr.price - COALESCE((
          SELECT sp.price
          FROM ${constants.models.SHARE_PRICE_HISTORY_TABLE} sp
          WHERE sp.share_id = shr.id
            AND sp.date <= CURRENT_DATE - INTERVAL :interval
          ORDER BY sp.date DESC
          LIMIT 1
        ), shr.price)) > 0 THEN 'gain'
        WHEN (shr.price - COALESCE((
          SELECT sp.price
          FROM ${constants.models.SHARE_PRICE_HISTORY_TABLE} sp
          WHERE sp.share_id = shr.id
            AND sp.date <= CURRENT_DATE - INTERVAL :interval
          ORDER BY sp.date DESC
          LIMIT 1
        ), shr.price)) < 0 THEN 'loss'
        ELSE 'no_change'
      END AS gain_or_loss
    FROM ${constants.models.SHARE_TABLE} shr
    LEFT JOIN ${constants.models.SECTOR_TABLE} sct ON sct.id = shr.sector_id
    WHERE shr.is_ipo = false
    GROUP BY
      shr.id
    ORDER BY shr.created_at DESC
    LIMIT 6 
  `;

  const data = await ShareModel.sequelize.query(query, {
    replacements: { ...queryParams },
    type: QueryTypes.SELECT,
    raw: true,
  });

  return { shares: data };
};

const update = async (req, id, { transaction }) => {
  const [rowsCount, rows] = await ShareModel.update(
    {
      name: req.body.name,
      slug: req.body.slug,
      is_featured: req.body.is_featured,
      is_ipo: req.body.is_ipo,
      image: req.body.image,
      about: req.body.about,
      fundamentals: req.body.fundamentals,
      shareholding_patterns: req.body.shareholding_patterns,
      peer_ratio: req.body.peer_ratio,
      financials: req.body.financials,
      faqs: req.body.faqs,
      price: req.body.price,
      current_market_price: req.body.current_market_price,
      is_drhp_filed: req.body.is_drhp_filed,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
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

const getById = async (req, id) => {
  return await ShareModel.findOne({
    where: {
      id: req?.params?.id || id,
    },
    raw: true,
    plain: true,
  });
};

const getChartByShareId = async (req, id) => {
  const timeRange = req.query.tr ?? null;

  // Prepare query replacements and condition for time range
  let queryParams = {
    id: req?.params?.id || id,
  };
  let timeCondition = ""; // Default: No time filter

  if (timeRange) {
    const [value, unit] = [parseInt(timeRange), timeRange.replace(/\d+/g, "")];

    const intervalMap = {
      d: "DAY",
      m: "MONTH",
      y: "YEAR",
    };

    if (!intervalMap[unit]) {
      throw new Error("Invalid time range format. Use 1d, 1m, 1y, etc.");
    }

    const interval = `${value} ${intervalMap[unit]}`;
    timeCondition = `AND sp.date >= CURRENT_DATE - INTERVAL :interval`;
    queryParams.interval = interval;
  }

  const query = `
    SELECT 
        sp.price, 
        sp.date
    FROM ${constants.models.SHARE_PRICE_HISTORY_TABLE} sp
    LEFT JOIN ${constants.models.SHARE_TABLE} shr 
      ON shr.id = sp.share_id
    WHERE shr.id = :id
      ${timeCondition}
    ORDER BY sp.date
  `;

  return await ShareModel.sequelize.query(query, {
    replacements: queryParams,
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const getByPk = async (req, id) => {
  return await ShareModel.findByPk(req?.params?.id || id);
};

const getBySlug = async (req, slug) => {
  return await ShareModel.findOne({
    where: {
      slug: req.params?.slug || slug,
    },
    raw: true,
  });
};

const deleteById = async (req, id, { transaction }) => {
  return await ShareModel.destroy({
    where: { id: req.params.id || id },
    transaction,
  });
};

const countShares = async (last_30_days = false) => {
  let where_query;
  if (last_30_days) {
    where_query = {
      created_at: {
        [Op.gte]: moment()
          .subtract(30, "days")
          .format("YYYY-MM-DD HH:mm:ss.SSSZ"),
      },
    };
  }

  return await ShareModel.count({
    where: where_query,
    raw: true,
  });
};

export default {
  init: init,
  create: create,
  get: get,
  update: update,
  getById: getById,
  getByPk: getByPk,
  getBySlug: getBySlug,
  deleteById: deleteById,
  countShares: countShares,
  getNewArrivals: getNewArrivals,
  getChartByShareId: getChartByShareId,
};
