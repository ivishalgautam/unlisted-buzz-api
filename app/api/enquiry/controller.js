"use strict";
import { z } from "zod";
import table from "../../db/models.js";

const enquirySchema = z.object({
  transaction_type: z.enum(["buy", "sell"], {
    required_error: "You need to select a transaction type.",
  }),
  share_id: z.string().nonempty("Please select a share."),
  quantity: z
    .number({
      required_error: "Quantity is required.",
      invalid_type_error: "Quantity must be a number.",
    })
    .positive("Quantity must be positive."),
  price_per_share: z
    .number({
      required_error: "Price is required.",
      invalid_type_error: "Price must be a number.",
    })
    .positive("Price must be positive."),
  message: z
    .string()
    .max(500, "Details must not exceed 500 characters.")
    .optional(),
});

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
