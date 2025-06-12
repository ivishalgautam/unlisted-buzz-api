"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import slugify from "slugify";
import { deleteFile } from "../../helpers/file.js";
import { sequelize } from "../../db/postgres.js";
import { sharePriceSchema } from "../../validation-schemas/share-price.schema.js";
import { ipoSchema } from "../../validation-schemas/ipo.model.js";
const { BAD_REQUEST, NOT_FOUND } = constants.http.status;
import fs from "fs";
import csv from "csv-parser";
import { parseObj } from "../../helpers/parse-object.js";

const trim = (str) => {
  return String(str).substring(0, 70);
};
const create = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    let slug = slugify(req.body.name, {
      lower: true,
      strict: true,
      remove: /['"]/g, // Remove apostrophes and quotes
    });
    req.body.slug = trim(slug);

    const share = await table.ShareModel.create(req, { transaction });
    if (share) {
      req.body.share_id = share.id;
      req.body.date = new Date().toISOString().split("T")[0];

      await table.SharePriceHistoryModel.create(req, { transaction });
    }

    if (req.body.is_ipo) {
      const validateIpo = ipoSchema.parse(req.body);
      await table.IPOModel.create(req, share.id, { transaction });
    }

    await transaction.commit();
    res.send({ status: true, message: "Created." });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const updateById = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    let slug = "";
    if (req.body.name) {
      slug = slugify(req.body?.name, {
        lower: true,
        strict: true,
        remove: /['"]/g, // Remove apostrophes and quotes
      });
      req.body.slug = trim(slug);
    }

    const share = await table.ShareModel.getById(req);
    if (!share) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Share not found!" });
    }
    const updateShare = await table.ShareModel.update(req, 0, { transaction });

    let ipo = await table.IPOModel.getByShareId(0, share.id);
    if (req.body.name) {
      const slugExist = await table.ShareModel.getBySlug(req, req.body.slug);
      // Check if there's another Product with the same slug but a different ID
      if (slugExist && share?.id !== slugExist?.id)
        return res.code(BAD_REQUEST).send({
          status: false,
          message: "Share exist with this name!",
        });
    }

    if (req.body.price && share.price !== req.body.price) {
      req.body.share_id = share.id;
      req.body.date = req.body.date
        ? new Date(req.body.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      await table.SharePriceHistoryModel.create(req, { transaction });
    }

    if (!req.body.is_ipo && ipo) {
      await table.IPOModel.deleteById(0, ipo.id, { transaction });
    }

    if (req.body.is_ipo && !ipo) {
      const validateIpo = ipoSchema.parse(req.body);
      await table.IPOModel.create(req, share.id, { transaction });
    }

    if (req.body.is_ipo && ipo && req.body.ipo_price !== ipo.ipo_price) {
      let newReq = { ...req };
      newReq.params.id = ipo.id;
      await table.IPOModel.update(newReq, 0, { transaction });
    }

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

const updatePrice = async (req, res) => {
  const validateData = sharePriceSchema.parse(req.body);

  const transaction = await sequelize.transaction();

  try {
    const record = await table.ShareModel.getByPk(req);
    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Share not found!" });
    }

    const share = await table.ShareModel.update(req, 0, { transaction });
    if (share) {
      console.log({ share });
      req.body.share_id = share.id;
      req.body.date = req.body.date
        ? new Date(req.body.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      await table.SharePriceHistoryModel.create(req, { transaction });
    }

    await transaction.commit();

    res.send({
      status: true,
      message: "Price updated",
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getBySlug = async (req, res) => {
  try {
    const record = await table.ShareModel.getBySlug(req);
    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Share not found!" });
    }

    res.send({
      status: true,
      data: await table.ShareModel.getBySlug(req),
    });
  } catch (error) {
    throw error;
  }
};

const getById = async (req, res) => {
  try {
    const record = await table.ShareModel.getById(req);
    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Share not found!" });
    }

    res.send({ status: true, data: record });
  } catch (error) {
    throw error;
  }
};

const getChartByShareId = async (req, res) => {
  try {
    const record = await table.ShareModel.getChartByShareId(req);
    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Share not found!" });
    }

    res.send({ status: true, data: record });
  } catch (error) {
    throw error;
  }
};

const get = async (req, res) => {
  try {
    const data = await table.ShareModel.get(req);
    res.send({ status: true, data: data, total: data?.[0]?.total });
  } catch (error) {
    throw error;
  }
};

const getNewArrivals = async (req, res) => {
  try {
    const data = await table.ShareModel.getNewArrivals(req);
    res.send({ status: true, data: data });
  } catch (error) {
    throw error;
  }
};

const deleteById = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const record = await table.ShareModel.getByPk(req);
    if (!record)
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Share not found!" });

    const isShareDeleted = await table.ShareModel.deleteById(
      req,
      req.params.id,
      {
        transaction,
      }
    );

    if (isShareDeleted) {
      deleteFile(record?.image);
    }

    await transaction.commit();
    res.send({ status: true, message: "Share deleted." });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

async function getFormattedShareDetails(req, res) {
  // const processRow = async (data) => {
  //   const parsedData = {
  //     fundamentals: JSON.parse(data.fundamentals),
  //     shareholding_patterns: JSON.parse(data.shareholding_patterns),
  //     peer_ratio: parseObj(data.peer_ratio),
  //     financials: JSON.parse(data.financials),
  //     faqs: JSON.parse(data.faqs),
  //     promoters_or_management: JSON.parse(data.promoters_or_management),
  //   };

  //   req.body = { ...parsedData };
  //   await table.ShareModel.update(req);
  // };

  try {
    // const record = await table.ShareModel.getById(req);
    // if (!record) return res.code(404).send({ message: "Share not found!" });

    if (!req.file) {
      return res.code(400).send({ message: "No file uploaded." });
    }

    let results = {};

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", async (data) => {
          for (const [key, value] of Object.entries(data)) {
            if (key && value) {
              console.log({ key, value });
              // results[key] =
              //   key === "peer_ratio" ? parseObj(value) : JSON.parse(value);
            }
          }
        })
        .on("end", () => {
          resolve();
          fs.unlinkSync(req.file.path);
        })
        .on("error", (error) => {
          reject();
          fs.unlinkSync(req.file.path);
        });
    });

    res.send({ message: "Customers imported successfully", data: results });
  } catch (error) {
    console.log(error);
    res.code(500).send({ message: error.message });
  }
}

export default {
  create: create,
  get: get,
  updateById: updateById,
  updatePrice: updatePrice,
  deleteById: deleteById,
  getBySlug: getBySlug,
  getById: getById,
  getChartByShareId: getChartByShareId,
  getNewArrivals: getNewArrivals,
  getFormattedShareDetails: getFormattedShareDetails,
};
