"use strict";
import slugify from "slugify";
import table from "../../db/models.js";

const trim = (str) => {
  return String(str).substring(0, 70);
};

const create = async (req, res) => {
  try {
    const slug = slugify(req.body.slug ? req.body.slug : req.body.title, {
      lower: true,
      strict: true,
      remove: /['"]/g, // Remove apostrophes and quotes
    });
    req.body.slug = trim(slug);
    res.send(await table.BlogModel.create(req));
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const update = async (req, res) => {
  try {
    const record = await table.BlogModel.getById(req);
    if (!record) return res.code(404).send({ message: "Blog not found!" });

    const slug = slugify(req.body.slug ? req.body.slug : req.body.title, {
      lower: true,
      strict: true,
      remove: /['"]/g, // Remove apostrophes and quotes
    });
    req.body.slug = trim(slug);
    res.send(await table.BlogModel.update(req));
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getById = async (req, res) => {
  try {
    const record = await table.BlogModel.getById(req);
    if (!record) return res.code(404).send({ message: "Blog not found!" });

    res.send(record);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getBySlug = async (req, res) => {
  try {
    const record = await table.BlogModel.getBySlug(req);
    if (!record) return res.code(404).send({ message: "Blog not found!" });

    res.send(record);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getRelatedBlogs = async (req, res) => {
  try {
    const record = await table.BlogModel.getById(req);
    if (!record) return res.code(404).send({ message: "Blog not found!" });

    console.log({ blogs: await table.BlogModel.getRelatedBlogs(req) });

    res.send(await table.BlogModel.getRelatedBlogs(req));
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const deleteById = async (req, res) => {
  try {
    const record = await table.BlogModel.getById(req);
    if (!record) return res.code(404).send({ message: "Blog not found!" });

    res.send(await table.BlogModel.deleteById(req));
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const get = async (req, res) => {
  try {
    const data = await table.BlogModel.get(req);
    res.send({ status: true, data: data, total: data?.[0]?.total });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export default {
  create: create,
  update: update,
  getById: getById,
  getBySlug: getBySlug,
  deleteById: deleteById,
  get: get,
  getRelatedBlogs: getRelatedBlogs,
};
