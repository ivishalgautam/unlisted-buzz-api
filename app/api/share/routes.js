"use strict";

import controller from "./controller.js";

export default async function routes(fastify, opt) {
  fastify.post("/", {}, controller.create);
  fastify.post("/:id/update-price", {}, controller.updatePrice);
  fastify.put("/:id", {}, controller.updateById);
  fastify.get("/getById/:id", {}, controller.getById);
  fastify.delete("/:id", {}, controller.deleteById);
}

export async function sharePublicRoutes(fastify, opts) {
  fastify.get("/:slug", {}, controller.getBySlug);
  fastify.get("/chart/:id", {}, controller.getChartByShareId);
  fastify.get("/", {}, controller.get);
  fastify.get("/new-arrivals", {}, controller.getNewArrivals);
}
