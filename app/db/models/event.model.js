"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { QueryTypes } from "sequelize";
const { DataTypes } = sequelizeFwk;

let EventModel = null;

const init = async (sequelize) => {
  EventModel = sequelize.define(
    constants.models.EVENT_TABLE,
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
        validate: {
          notNull: { args: true, message: "Name of event is required*" },
        },
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { args: true, message: "Description of event is required*" },
        },
      },
      date: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { args: true, message: "Date of event is required*" },
        },
      },
      details: { type: DataTypes.TEXT, defaultValue: "" },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await EventModel.sync({ alter: true });
};

const create = async (req, { transaction }) => {
  return await EventModel.create(
    {
      name: req.body.name,
      description: req.body.description,
      date: req.body.date,
      details: req.body.details,
    },
    { transaction }
  );
};

const get = async (req) => {
  let whereConditions = [];
  const queryParams = {};
  let q = req.query.q;
  if (q) {
    whereConditions.push(`evnt.name ILIKE :query`);
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
      COUNT(evnt.id) OVER()::integer as total
    FROM ${constants.models.EVENT_TABLE} evnt
    ${whereClause}
    ORDER BY evnt.created_at DESC
  `;

  let query = `
  SELECT
      evnt.*
    FROM ${constants.models.EVENT_TABLE} evnt
    ${whereClause}
    ORDER BY evnt.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

  const events = await EventModel.sequelize.query(query, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });

  const count = await EventModel.sequelize.query(countQuery, {
    replacements: { ...queryParams },
    type: QueryTypes.SELECT,
    raw: true,
  });

  return { events, total: count?.[0]?.total ?? 0 };
};

const update = async (req, id, { transaction }) => {
  const [rowCount, rows] = await EventModel.update(
    {
      name: req.body.name,
      description: req.body.description,
      date: req.body.date,
      details: req.body.details,
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
  return await EventModel.findOne({
    where: {
      id: req.params.id || id,
    },
  });
};

const getByPk = async (req, id) => {
  return await EventModel.findByPk(req?.params?.id || id);
};

const deleteById = async (req, id, { transaction }) => {
  return await EventModel.destroy({
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
