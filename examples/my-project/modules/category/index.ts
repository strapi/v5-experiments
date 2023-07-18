import { Module } from "@strapi/core";
import { CategoryController } from "./controller";

export class CategoryModule extends Module {
  constructor() {
    const opts = {
      controllers: [CategoryController],
    };

    super("category", opts);
  }

  register() {}

  bootstrap() {}

  destroy() {}
}

export default 