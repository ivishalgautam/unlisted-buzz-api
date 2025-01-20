"use strict";

import controller from "./controller.js";

export default async function routes(fastify, opt) {
  fastify.get("/", {}, controller.get);
  fastify.post("/", {}, controller.create);
  fastify.put("/:id", {}, controller.updateById);
  fastify.get("/portfolio", {}, controller.getPortfolio);
  fastify.get("/:id", {}, controller.getById);
  fastify.delete("/:id", {}, controller.deleteById);
}
