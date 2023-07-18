import knex from "knex";

const conn = knex({
  client: "better-sqlite3",
  connection: {
    filename: "./mydb.sqlite",
  },
  useNullAsDefault: true,
});

export async function destroy() {
  await conn.destroy();
}

export default conn;