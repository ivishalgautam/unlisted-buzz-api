"use strict";

import multer from "fastify-multer";
import controller from "./controller.js";
import path from "path";
import { fileURLToPath } from "url";

// Set up multer storage and file filter if needed
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(
      null,
      path.resolve(fileURLToPath(import.meta.url), "../../../../", "uploads")
    );
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

export default async function routes(fastify, opt) {
  fastify.post("/", {}, controller.create);
  fastify.post("/:id/update-price", {}, controller.updatePrice);
  fastify.put("/:id", {}, controller.updateById);
  fastify.post(
    "/get-formatted-share-details",
    { preHandler: upload.single("file") },
    controller.getFormattedShareDetails
  );
  fastify.get("/getById/:id", {}, controller.getById);
  fastify.delete("/:id", {}, controller.deleteById);
}

export async function sharePublicRoutes(fastify, opts) {
  fastify.get("/:slug", {}, controller.getBySlug);
  fastify.get("/chart/:id", {}, controller.getChartByShareId);
  fastify.get("/", {}, controller.get);
  fastify.get("/new-arrivals", {}, controller.getNewArrivals);
}
