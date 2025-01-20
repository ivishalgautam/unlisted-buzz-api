import jwtVerify from "../../helpers/auth.js";
import userRoutes from "../../api/users/routes.js";
import sectorRoutes from "../../api/sector/routes.js";
import reportRoutes from "../../api/report/routes.js";
import shareRoutes from "../../api/share/routes.js";
import eventRoutes from "../../api/event/routes.js";
import investmentRoutes from "../../api/investment/routes.js";
import transactionRoutes from "../../api/transaction/routes.js";
import blogRoutes from "../../api/blog/routes.js";

export default async function routes(fastify, options) {
  fastify.addHook("onRequest", jwtVerify.verifyToken);
  fastify.addHook("preHandler", async (request, reply) => {
    request.body && console.log("body", request.body);
  });
  fastify.register(userRoutes, { prefix: "users" });
  fastify.register(sectorRoutes, { prefix: "sectors" });
  fastify.register(reportRoutes, { prefix: "reports" });
  fastify.register(shareRoutes, { prefix: "shares" });
  fastify.register(eventRoutes, { prefix: "events" });
  fastify.register(investmentRoutes, { prefix: "investments" });
  fastify.register(transactionRoutes, { prefix: "transactions" });
  fastify.register(blogRoutes, { prefix: "blogs" });
}
