"use strict";
import table from "../../db/models.js";
import { enquirySchema } from "../../validation-schemas/Enquiry.schema.js";

const create = async (req, res) => {
  try {
    const validateData = enquirySchema.parse(req.body);
    res.send(await table.EnquiryModel.create(req));
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getById = async (req, res) => {
  try {
    const record = await table.EnquiryModel.getById(req);
    if (!record) return res.code(404).send({ message: "Enquiry not found!" });

    res.send(record);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const deleteById = async (req, res) => {
  try {
    const record = await table.EnquiryModel.getById(req);
    if (!record) return res.code(404).send({ message: "Enquiry not found!" });

    res.send(await table.EnquiryModel.deleteById(req));
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const get = async (req, res) => {
  try {
    const data = await table.EnquiryModel.get(req);
    res.send({ status: true, data: data, total: data?.[0]?.total });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export default {
  create: create,
  getById: getById,
  deleteById: deleteById,
  get: get,
};
