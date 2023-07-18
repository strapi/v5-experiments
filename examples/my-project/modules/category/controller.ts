import { CollectionTypeController } from "@strapi/core";

export class CategoryController extends CollectionTypeController {
  constructor() {
    super("category");
  }
}
