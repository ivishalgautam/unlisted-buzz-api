"use strict";

import hash from "../../lib/encryption/index.js";
import table from "../../db/models.js";
import { sequelize } from "../../db/postgres.js";
import authToken from "../../helpers/auth.js";
import { userSchema } from "../../validation-schemas/user.schema.js";
import {
  customerLoginSchema,
  loginSchema,
} from "../../validation-schemas/login.schema.js";
import { adminSchema } from "../../validation-schemas/admin.schema.js";
import crypto from "crypto";
import { customerSchema } from "../../validation-schemas/customer.schema.js";

const verifyUserCredentials = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res
        .code(400)
        .send({ status: false, message: "Invalid role specified!" });
    }

    let userData = null;
    let adminRecord = null;
    let otpRecord = null;

    if (role === "admin") {
      const validateBody = loginSchema.parse(req.body);
      adminRecord = await table.AdminModel.getByUsername(req);
      if (!adminRecord)
        return res.code(404).send({ message: "User not found!" });
      userData = await table.UserModel.getByPk(0, adminRecord.user_id);
      if (!userData) {
        return res
          .code(404)
          .send({ status: false, message: "User not found!" });
      }
    } else if (role === "user") {
      const validateBody = customerLoginSchema.parse(req.body);
      userData = await table.UserModel.getByEmailId(req);
      if (!userData) {
        return res
          .code(404)
          .send({ status: false, message: "User not found!" });
      }
      otpRecord = await table.OTPModel.getByEmail(req);
    } else {
      return res
        .code(400)
        .send({ status: false, message: "Invalid role specified!" });
    }

    if (!userData) {
      return res.code(404).send({ status: false, message: "User not found!" });
    }

    let passwordIsValid =
      role === "admin"
        ? hash.verify(req.body.password, adminRecord.password)
        : null;
    let otpIsValid =
      role === "user" ? otpRecord.otp === req.body.email_otp : null;

    if (role === "admin" && !passwordIsValid) {
      return res
        .code(400)
        .send({ status: false, message: "Invalid credentials" });
    }
    if (role === "user" && !otpIsValid) {
      return res.code(400).send({ status: false, message: "Wrong OTP!" });
    }

    const [jwtToken, expiresIn] = authToken.generateAccessToken(userData);
    const refreshToken = authToken.generateRefreshToken(userData);

    return res.send({
      status: true,
      token: jwtToken,
      expire_time: Date.now() + expiresIn,
      refresh_token: refreshToken,
      user_data: userData,
    });
  } catch (error) {
    throw error;
  }
};

const createNewUser = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const validateUserData = userSchema.parse(req.body);
    req.body = { ...req.body, ...validateUserData };
    if (req.body.role === "user") {
      const otpRecord = await table.OTPModel.getByEmail(req);
      console.log({ otpRecord });
      if (!otpRecord) {
        return res
          .code(401)
          .send({ status: false, message: "Please verify otp." });
      }
      console.log(otpRecord.otp, req.body.email_otp);

      if (otpRecord.otp !== req.body.email_otp) {
        return res
          .code(401)
          .send({ status: false, message: "Wrong email OTP." });
      }
    }
    const data = await table.UserModel.create(req, { transaction });
    if (!data)
      return res.code(400).send({ message: "Error while registering." });

    if (data.role === "admin") {
      const validateAdminData = adminSchema.parse(req.body);
      await table.AdminModel.create(req, data.id, { transaction });
    }

    if (data.role === "user") {
      const validateCustomerData = customerSchema.parse(req.body);
      await table.CustomerModel.create(req, data.id, { transaction });
    }

    const [jwtToken, expiresIn] = authToken.generateAccessToken(data);
    const refreshToken = authToken.generateRefreshToken(data);

    await transaction.commit();
    return res.send({
      status: true,
      token: jwtToken,
      expire_time: Date.now() + expiresIn,
      refresh_token: refreshToken,
      user_data: data,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const otpSend = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const otpRecord = await table.OTPModel.getByEmail(req);
    const otp = 111111 ?? crypto.randomInt(100000, 999999);
    req.body.otp = otp;

    let newOtp = null;

    if (otpRecord) {
      newOtp = await table.OTPModel.update(req);
    } else {
      newOtp = await table.OTPModel.create(req, { transaction });
    }

    if (newOtp) {
      console.log({ otp });
    }

    await transaction.commit();
    res.send({ status: true, message: "Otp sent." });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const verifyRefreshToken = async (req, res) => {
  try {
    return authToken.verifyRefreshToken(req, res);
  } catch (error) {
    throw error;
  }
};

export default {
  verifyUserCredentials: verifyUserCredentials,
  createNewUser: createNewUser,
  verifyRefreshToken: verifyRefreshToken,
  otpSend: otpSend,
};
