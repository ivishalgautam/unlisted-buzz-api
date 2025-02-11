"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import { sequelize } from "../../db/postgres.js";
import { commentSchema } from "../../validation-schemas/comment.schema.js";
import jwtVerify from "../../helpers/auth.js";

const { NOT_FOUND } = constants.http.status;

const create = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const validateComment = commentSchema.parse(req.body);
    const isReply = validateComment.comment_id;

    if (isReply) {
      const commentRecord = await table.CommentModel.getById(
        0,
        req.body.comment_id
      );
      if (!commentRecord)
        return res
          .code(404)
          .send({ message: "Comment not found!", status: false });
      req.body.is_reply = true;
    }

    const data = await table.CommentModel.create(req, { transaction });
    await transaction.commit();
    res.send({ status: true, data: data });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const updateById = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const record = await table.CommentModel.getById(req);
    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Comment not found!" });
    }

    await table.CommentModel.updateById(req, 0, { transaction });
    await transaction.commit();
    res.send({
      status: true,
      message: "Updated.",
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getByShareId = async (req, res) => {
  try {
    const shareRecord = await table.ShareModel.getById(req);
    if (!shareRecord)
      return res.code(404).send({ status: false, message: "Share not found!" });

    const data = await table.CommentModel.getByShareId(req);
    res.send({ status: true, data });
  } catch (error) {
    throw error;
  }
};

const get = async (req, res) => {
  try {
    const data = await table.CommentModel.get(req);
    res.send({ status: true, data: data });
  } catch (error) {
    throw error;
  }
};

const getById = async (req, res) => {
  try {
    const record = await table.CommentModel.getById(req);
    if (!record)
      return res
        .code(404)
        .send({ status: false, message: "Comment not found!" });

    res.send({ status: true, data: record });
  } catch (error) {
    throw error;
  }
};

const deleteById = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const record = await table.CommentModel.getById(req);
    if (!record)
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Comment not found!" });

    await table.CommentModel.deleteById(req, 0, { transaction });
    await transaction.commit();
    res.send({ status: true, message: "Comment deleted." });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export default {
  create: create,
  getByShareId: getByShareId,
  updateById: updateById,
  deleteById: deleteById,
  getById: getById,
  get: get,
};
