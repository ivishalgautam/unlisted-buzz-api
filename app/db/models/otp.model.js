"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable } from "sequelize";

let OtpModel = null;

const init = async (sequelize) => {
  OtpModel = sequelize.define(
    constants.models.OTP_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: { msg: "Email is not valid!" },
        },
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await OtpModel.sync({ alter: true });
};

const create = async (req, { transaction }) => {
  return await OtpModel.create(
    {
      email: req.body.email,
      otp: req.body.otp,
    },
    { transaction }
  );
};

const update = async (req) => {
  return await OtpModel.update(
    { otp: req.body.otp },
    {
      where: {
        email: req.body.email,
      },
      returning: true,
      raw: true,
    }
  );
};

const getByEmail = async (req, email) => {
  return await OtpModel.findOne({
    where: {
      email: req?.body?.email || email,
    },
    order: [["created_at", "DESC"]],
    raw: true,
    plain: true,
  });
};

const getByMobile = async (req) => {
  return await OtpModel.findOne({
    where: {
      mobile_number: req.body.mobile_number,
    },
    order: [["created_at", "DESC"]],
    raw: true,
    plain: true,
  });
};

const deleteByMobile = async (req) => {
  return await OtpModel.destroy({
    where: { mobile_number: req.body.mobile_number },
  });
};

export default {
  init: init,
  create: create,
  update: update,
  getByEmail: getByEmail,
  getByMobile: getByMobile,
  deleteByMobile: deleteByMobile,
};
