"use strict";
import constants from "../../lib/constants/index.js";
import hash from "../../lib/encryption/index.js";
import { DataTypes, Deferrable } from "sequelize";

let AdminModel = null;
const init = async (sequelize) => {
  AdminModel = sequelize.define(
    constants.models.ADMIN_TABLE,
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: "Username already in use!",
        },
        validate: {
          notEmpty: true,
          is: { args: /^[0-9A-Za-z]{3,16}$/, msg: "Enter valid username!" },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
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
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await AdminModel.sync({ alter: true });
};

const create = async (req, user_id, { transaction }) => {
  const hash_password = hash.encrypt(req.body.password);
  const data = await AdminModel.create(
    {
      username: req.body.username,
      password: hash_password,
      user_id: user_id,
    },
    { transaction }
  );

  return data.dataValues;
};

const get = async (req) => {
  return await AdminModel.findAll({});
};

const getById = async (req, id) => {
  return await AdminModel.findOne({ where: { id: req?.params?.id || id } });
};

const getByPk = async (req, id) => {
  const data = await AdminModel.findByPk(req?.params?.id || id);
};

const getByUsername = async (req, record = undefined) => {
  const data = await AdminModel.findOne({
    where: {
      username: req?.body?.username || record?.user?.username,
    },
    raw: true,
  });

  return data;
};

const update = async (req, id, { transaction }) => {
  const [rowCount, rows] = await AdminModel.update(
    {
      username: req.body.username,
      password: req.body.password,
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

const updatePassword = async (req, user_id) => {
  const hash_password = hash.encrypt(req.body.new_password);
  return await AdminModel.update(
    {
      password: hash_password,
    },
    {
      where: {
        id: req.params?.id || user_id,
      },
    }
  );
};

const deleteById = async (req, user_id) => {
  return await AdminModel.destroy({
    where: {
      id: req?.params?.id || user_id,
    },
    returning: true,
    raw: true,
  });
};

export default {
  init: init,
  create: create,
  get: get,
  getById: getById,
  getByPk: getByPk,
  getByUsername: getByUsername,
  update: update,
  updatePassword: updatePassword,
  deleteById: deleteById,
};
