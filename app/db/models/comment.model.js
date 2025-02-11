"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable, QueryTypes } from "sequelize";

let CommentModel = null;

const init = async (sequelize) => {
  CommentModel = sequelize.define(
    constants.models.COMMENT_TABLE,
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
        references: {
          model: constants.models.SHARE_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
        validate: { isUUID: "4" },
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: constants.models.USER_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
        validate: { isUUID: "4" },
      },
      comment_id: {
        type: DataTypes.UUID,
        allowNull: true,
        onDelete: "CASCADE",
        references: {
          model: constants.models.COMMENT_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      is_reply: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_reviewed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await CommentModel.sync({ alter: true });
};

const create = async (req, { transaction }) => {
  return await CommentModel.create(
    {
      share_id: req.body.share_id,
      user_id: req.user_data.id,
      comment_id: req.body.comment_id,
      comment: req.body.comment,
      is_reply: req.body.is_reply,
    },
    { transaction }
  );
};

const getByShareId = async (req, id) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : null;
  const offset = (page - 1) * limit;

  const whereClause = `
    WHERE cmnt.share_id = :shareId 
    AND cmnt.is_reply = false 
    AND cmnt.is_reviewed = true
  `;

  const queryParams = {
    shareId: req?.params?.id ?? id,
  };

  let countQuery = `
  SELECT
      COUNT(cmnt.id) OVER()::integer as total
    FROM ${constants.models.COMMENT_TABLE} cmnt
    ${whereClause}
    ORDER BY cmnt.created_at DESC
  `;

  let query = `
  SELECT
      cmnt.id, cmnt.comment, cmnt.created_at, cmnt.is_reviewed, cmnt.is_reply, usr.fullname, usr.avatar,
      COALESCE(json_agg(
        json_build_object(
          'id', cmnt2.id,
          'comment', cmnt2.comment,
          'created_at', cmnt2.created_at,
          'is_reviewed', cmnt2.is_reviewed,
          'fullname', rplyusr.fullname,
          'avatar', rplyusr.avatar
        )
      ) FILTER(WHERE cmnt2.id IS NOT NULL), '[]') AS replies
    FROM ${constants.models.COMMENT_TABLE} cmnt
    LEFT JOIN ${constants.models.COMMENT_TABLE} cmnt2 ON cmnt.id = cmnt2.comment_id AND cmnt2.is_reviewed = true
    LEFT JOIN ${constants.models.USER_TABLE} usr ON usr.id = cmnt.user_id
    LEFT JOIN ${constants.models.USER_TABLE} rplyusr ON rplyusr.id = cmnt2.user_id
    ${whereClause}
    GROUP BY cmnt.id, usr.fullname, usr.avatar
    ORDER BY cmnt.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

  const data = await CommentModel.sequelize.query(query, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });

  const count = await CommentModel.sequelize.query(countQuery, {
    replacements: { ...queryParams },
    type: QueryTypes.SELECT,
    raw: true,
  });

  return { comments: data, total: count?.[0]?.total ?? 0 };
};

const get = async (req) => {
  let whereConditions = [];
  const queryParams = {};

  if (req.query.is_reviewed !== undefined && req.query.is_reviewed !== "all") {
    const isReviewed = req.query.is_reviewed == "1";
    whereConditions.push(`cmnt.is_reviewed = :isReviewed`);
    queryParams.isReviewed = isReviewed;
  }

  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : null;
  const offset = (page - 1) * limit;

  let whereClause = "";
  if (whereConditions.length) {
    whereClause = "WHERE " + whereConditions.join(" AND ");
  }

  let countQuery = `
  SELECT
      COUNT(cmnt.id) OVER()::integer as total
    FROM ${constants.models.COMMENT_TABLE} cmnt
    LEFT JOIN ${constants.models.SHARE_TABLE} shr ON shr.id = cmnt.share_id
    ${whereClause}
    ORDER BY cmnt.created_at DESC
  `;

  let query = `
  SELECT
      cmnt.id, cmnt.comment, cmnt.created_at,
      shr.name AS share_name
    FROM ${constants.models.COMMENT_TABLE} cmnt
    LEFT JOIN ${constants.models.SHARE_TABLE} shr ON shr.id = cmnt.share_id
    ${whereClause}
    ORDER BY cmnt.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

  const data = await CommentModel.sequelize.query(query, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });

  const count = await CommentModel.sequelize.query(countQuery, {
    replacements: { ...queryParams },
    type: QueryTypes.SELECT,
    raw: true,
  });

  return { comments: data, total: count?.[0]?.total ?? 0 };
};

const getById = async (req, id) => {
  return await CommentModel.findOne({
    where: { id: req?.params?.id ?? id },
  });
};

const updateById = async (req, id) => {
  return await CommentModel.update(
    { is_reviewed: req.body.is_reviewed },
    {
      where: { id: req?.params?.id ?? id },
    }
  );
};

const deleteById = async (req, id, { transaction }) => {
  return await CommentModel.destroy({
    where: { id: req?.params?.id || id },
    transaction,
  });
};

export default {
  init: init,
  create: create,
  getByShareId: getByShareId,
  getById: getById,
  deleteById: deleteById,
  updateById: updateById,
  get: get,
};
