import { routes } from "@strapi/strapi";

export default () => {
  routes.collectionType("category");
  // Router.singleType("category");

  routes.get("/sth", "category.find", {
    policies: ["isAuthenticated"],
    validation: {
      // query: yup.object().shape({}),
      // params,
      // body,
    },
    auth: {},
  });

  routes.get("posts/:id", "PostsController.show").where("id", {
    match: /^[0-9]+$/,
    cast: (id) => Number(id),
  });
};
