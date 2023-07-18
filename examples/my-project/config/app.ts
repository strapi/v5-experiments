import { ServerConfig, AdminConfig } from "@strapi/core"; // or env from @strapi/env
import { env } from "@strapi/strapi"; // or env from @strapi/env

const server: ServerConfig = {
  port: 2012,
  host: env.get("HOST"),
};

const admin: AdminConfig = {
  url: "azda",
};

export default {
  admin,
  server,
};
