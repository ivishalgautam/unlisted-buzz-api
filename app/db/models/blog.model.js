"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, QueryTypes } from "sequelize";

let BlogModel = null;

const init = async (sequelize) => {
  BlogModel = sequelize.define(
    constants.models.BLOG_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      image: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      short_description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      shares: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: [],
      },
      meta_title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      meta_description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      meta_keywords: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      faq: {
        type: DataTypes.JSONB,
        defaultValue: "[]",
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await BlogModel.sync({ alter: true });
};

const create = async (req) => {
  return await BlogModel.create(
    {
      title: req.body.title,
      slug: String(req.body.slug).toLowerCase(),
      image: req.body.image,
      short_description: req.body.short_description,
      content: req.body.content,
      is_active: req.body.is_active,
      shares: req.body.shares,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
      faq: req.body.faq,
    },
    { returning: true, raw: true }
  );
};

const get = async (req) => {
  let whereConditions = [];
  const queryParams = {};

  if (req.query.is_featured) {
    whereConditions.push("b.is_active = true");
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
      COUNT(shr.id) OVER()::integer as total
    FROM ${constants.models.SHARE_TABLE} shr
    LEFT JOIN ${constants.models.SECTOR_TABLE} sct ON sct.id = shr.sector_id
    ${whereClause}
    GROUP BY
        shr.id
    ORDER BY shr.created_at DESC
    `;

  let query = `
  SELECT 
      b.id, b.title, b.image, b.slug, b.short_description, b.created_at, b.updated_at,
      CASE
        WHEN COUNT(shr.id) > 0 THEN json_agg(
            json_build_object(
            'id', shr.id, 
            'name', shr.name,
            'slug', shr.slug
            )
        )
        ELSE '[]'
      END AS shares
    FROM ${constants.models.BLOG_TABLE} b
    LEFT JOIN ${constants.models.SHARE_TABLE} shr ON shr.id = ANY(b.shares)
    ${whereClause}
    GROUP BY
        b.id
    ORDER BY b.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

  const blogs = await BlogModel.sequelize.query(query, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });

  const count = await BlogModel.sequelize.query(countQuery, {
    replacements: { ...queryParams },
    type: QueryTypes.SELECT,
    raw: true,
  });

  return { blogs, total: count?.[0]?.total ?? 0 };
};

const update = async (req, id) => {
  const [rowCount, rows] = await BlogModel.update(
    {
      title: req.body.title,
      slug: String(req.body.slug).toLowerCase(),
      image: req.body.image,
      short_description: req.body.short_description,
      shares: req.body.shares,
      content: req.body.content,
      is_active: req.body.is_active,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
      faq: req.body.faq,
    },
    {
      where: {
        id: req.params.id || id,
      },
      returning: true,
      raw: true,
    }
  );

  return rows[0];
};

const getById = async (req, id) => {
  return await BlogModel.findOne({
    where: {
      id: req.params.id || id,
    },
    raw: true,
  });
};

const getBySlug = async (req, slug) => {
  let query = `
  SELECT 
      b.*,
      CASE
          WHEN COUNT(cat.id) > 0 THEN json_agg(
              json_build_object(
                'id', cat.id, 
                'name', cat.name,
                'slug', cat.slug
              )
          )
          ELSE '[]'
      END AS categories
    FROM
      ${constants.models.BLOG_TABLE} b
    LEFT JOIN categories cat ON cat.id = ANY(b.categories)
    WHERE b.slug = '${req.params.slug || slug}'
    GROUP BY
      b.id
  `;

  return await BlogModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    plain: true,
  });
};

const getRelatedBlogs = async (req, id) => {
  let query = `
 SELECT 
    json_agg(json_build_object(
      'id', b2.id,
      'title', b2.title,
      'short_description', b2.short_description,
      'image', b2.image,
      'slug', b2.slug,
      'created_at', b2.created_at
    )) as blogs
    FROM blogs b1
    JOIN blogs b2 ON b1.id <> b2.id
    WHERE b1.id = '${req.params.id || id}'
      AND (
        SELECT COUNT(*)
        FROM unnest(b1.categories) AS cat1
        JOIN unnest(b2.categories) AS cat2 ON cat1 = cat2
      ) > 0;
  `;

  return await BlogModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
  });
};

const deleteById = async (req, id) => {
  return await BlogModel.destroy({
    where: { id: req.params.id || id },
  });
};

export default {
  init: init,
  create: create,
  get: get,
  update: update,
  getById: getById,
  getBySlug: getBySlug,
  deleteById: deleteById,
  getRelatedBlogs: getRelatedBlogs,
};
