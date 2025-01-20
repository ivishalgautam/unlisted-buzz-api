"use strict";
import controller from "./controller.js";

export default async function routes(fastify, options) {
  fastify.get("/:id", {}, controller.getById);
  fastify.delete("/:id", {}, controller.deleteById);
  fastify.get("/", {}, controller.get);
}

export async function queryPublicRoutes(fastify, opt) {
  fastify.post("/", {}, controller.create);
}
