"use strict";
import controller from "./controller.js";

export default async function routes(fastify, options) {
  fastify.post("/", {}, controller.create);
  fastify.put("/:id", {}, controller.update);
  fastify.get("/getById/:id", {}, controller.getById);
  fastify.delete("/:id", {}, controller.deleteById);
}

export async function blogPublicRoutes(fastify, options) {
  fastify.get("/", {}, controller.get);
  fastify.get("/:slug", {}, controller.getBySlug);
}
