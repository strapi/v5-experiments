import conn, { destroy } from "./connection";
import { setupDB } from "./reset-db";

async function main() {
  await setupDB();

  conn.raw(/* sql */`
    SELECT a.title, a.doc_id, a.version_id, au.name
    FROM article as a
    JOIN article_author as aa ON (
      a.doc_id = aa.article_doc_id 
      AND (
        a.locale = aa.pivot_locale 
        OR aa.pivot_locale IS NULL
      ) 
      AND a.version_id = aa.pivot_version_id)
    JOIN author as au ON aa.author_doc_id = au.doc_id;
  `);

  await destroy();
}

main().catch(console.dir);
