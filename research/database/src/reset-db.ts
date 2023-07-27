import conn from "./connection";
import { data } from "./data";

interface Columns {
  [key: string]: Column;
}

interface Column {
  type: string;
  nullable?: boolean;
  primary?: boolean;
  default?: any;
  unique?: boolean;
}

const createTable = (name: string, cols: Columns = {}) => {
  return conn.schema.createTable(name, (table) => {
    table.increments("id");
    table.string("doc_id").notNullable();
    table.string("publicationState").notNullable().defaultTo("draft");
    table.datetime("published_at").nullable().defaultTo(null);
    table.string("locale").notNullable().defaultTo("en");

    table.unique(["doc_id", "locale", "publicationState"]);

    Object.keys(cols).forEach((colName) => {
      const col = cols[colName];
      let colBuilder = table[col.type](colName);
      if (col.nullable) {
        colBuilder = colBuilder.nullable();
      }
      if (col.primary) {
        colBuilder = colBuilder.primary();
      }
      if (col.unique) {
        colBuilder = colBuilder.unique();
      }
      if (col.default) {
        colBuilder = colBuilder.defaultTo(col.default);
      }
    });
  });
};

const dropTable = (name) => {
  return conn.schema.dropTableIfExists(name);
};

export async function resetDB() {
  await dropTable("article_author");
  await dropTable("article_category");
  await dropTable("article");
  await dropTable("author");
  await dropTable("category");
  await dropTable("homepage");
  await dropTable("homepage_link");
  await dropTable("menu");

  await createTable("article", {
    title: { type: "string" },
  });

  await createTable("author", {
    name: { type: "string" },
  });

  await conn.schema.createTable("article_author", (table) => {
    table.increments("id");
    table.string("article_doc_id").notNullable();
    table.string("author_doc_id").notNullable();

    table.string("pivot_publicationState").notNullable();
    table.string("pivot_locale").notNullable();

    // table.index("article_doc_id");
    // table.index("author_doc_id");
  });

  await createTable("category", {
    name: { type: "string" },
  });

  await conn.schema.createTable("article_category", (table) => {
    table.string("id").primary();
    table.string("article_doc_id").notNullable();
    table.string("category_doc_id").notNullable();

    table.string("pivot_publicationState").notNullable();
    table.string("pivot_locale").notNullable();

    // table.foreign("article_doc_id").references("article.doc_id");
    // table.foreign("category_doc_id").references("category.doc_id");

    table.integer("order").notNullable();
  });

  await createTable("homepage", {
    title: { type: "string" },
  });

  await conn.schema.createTable("homepage_link", (table) => {
    table.string("id").primary();
    table.string("homepage_doc_id").notNullable();
    table.string("item_doc_id").notNullable();
    table.string("item_type").notNullable();

    table.string("pivot_publicationState").notNullable();
    table.string("pivot_locale").notNullable();

    table.integer("order");

    // table.foreign("homepage_id").references("homepage.doc_id");
    // table.foreign("article_id").references("article.doc_id");
  });

  await createTable("menu", {});
}

async function seedDB() {
  for (const tableName of Object.keys(data)) {
    const tableData = data[tableName];
    if (tableData.length === 0) {
      continue;
    }

    await conn(tableName).insert(tableData);
  }
}

export async function setupDB() {
  await resetDB();
  await seedDB();
}
