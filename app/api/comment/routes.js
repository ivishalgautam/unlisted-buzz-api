"use strict";

import controller from "./controller.js";

export default async function routes(fastify, opt) {
  fastify.post("/", {}, controller.create);
  fastify.put("/:id", {}, controller.updateById);
  fastify.get("/:id", {}, controller.getById);
  fastify.get("/", {}, controller.get);
  fastify.delete("/:id", {}, controller.deleteById);
}

export async function commentPublicRoutes(fastify, opts) {
  fastify.get("/getByShareId/:id", {}, controller.getByShareId);
}
