import { blogPublicRoutes } from "../../api/blog/routes.js";
import { commentPublicRoutes } from "../../api/comment/routes.js";
import { queryPublicRoutes } from "../../api/query/routes.js";
import { sectorPublicRoutes } from "../../api/sector/routes.js";
import { sharePublicRoutes } from "../../api/share/routes.js";

export default async function publcRoutes(fastify, opt) {
  fastify.register(sectorPublicRoutes, { prefix: "sectors" });
  fastify.register(sharePublicRoutes, { prefix: "shares" });
  fastify.register(blogPublicRoutes, { prefix: "blogs" });
  fastify.register(queryPublicRoutes, { prefix: "queries" });
  fastify.register(commentPublicRoutes, { prefix: "comments" });
}
