import conn, { destroy } from "./connection";
import { setupDB } from "./reset-db";

interface Options {
  publicationState?: "draft" | null;
  locale?: "en" | "fr";
}

async function findMany({ publicationState, locale }: Options = {}) {
  // either we should group by / have all necessary fitlers / use limited joins
  const query = conn
    .select("*")
    .from("article")
    .where({ locale, publicationState });

  return query;
}

async function findPublishedVersion(docId: string, { locale }) {
  const query = conn
    .select("id", "locale", "doc_id", "published_at")
    .from("article")
    .where({ doc_id: docId, locale, publicationState: "published" })
    .first();

  return query;
}

async function findDraftVersion(docId: string, { locale }) {
  const query = conn
    .select("id", "locale", "doc_id", "published_at")
    .from("article")
    .where({ doc_id: docId, locale, publicationState: "draft" })
    .first();

  return query;
}

async function logData(msg) {
  console.log("---", msg, "---");
  console.log(await conn.select().from("article"));
  console.log(await conn.select().from("article_author"));
}

async function main() {
  await setupDB();

  let results;

  // conn.raw(/* sql */ `
  //   SELECT a.title, a.doc_id, a.version_id, au.name
  //   FROM article as a
  //   JOIN article_author as aa ON (
  //     a.doc_id = aa.article_doc_id
  //     AND (
  //       a.locale = aa.pivot_locale
  //       OR aa.pivot_locale IS NULL
  //     )
  //     AND a.version_id = aa.pivot_version_id)
  //   JOIN author as au ON aa.author_doc_id = au.doc_id;
  // `);

  await conn
    .insert([
      {
        name: "My author",
        doc_id: "my-author",
        published_at: new Date(),
        publicationState: "published",
        locale: "en",
      },
      {
        name: "My second author",
        doc_id: "my-second-author",
        published_at: new Date(),
        publicationState: "published",
        locale: "en",
      },
    ])
    .into("author");

  await logData("Start");

  //- Create a draft article (en)
  await conn
    .insert({
      title: "My article",
      doc_id: "my-article",
      locale: "en",
      publicationState: "draft",
    })
    .into("article");

  await conn
    .insert({
      article_doc_id: "my-article",
      author_doc_id: "my-author",
      pivot_publicationState: "draft",
      pivot_locale: "en",
    })
    .into("article_author");

  await logData("After en draft creation");

  // create another draft in another locale
  await conn
    .insert({
      title: "Mon article",
      doc_id: "my-article",
      locale: "fr",
    })
    .into("article");

  // duplicate relation across locales with pivot

  await conn
    .into(
      conn.raw(
        "article_author (article_doc_id, author_doc_id, pivot_publicationState, pivot_locale)"
      )
    )
    .insert(
      conn
        .select([
          "article_doc_id",
          "author_doc_id",
          "pivot_publicationState",
          conn.raw("'fr' as pivot_locale"),
        ])
        .from("article_author")
        .where({
          article_doc_id: "my-article",
          pivot_locale: "en",
          pivot_publicationState: "draft",
        })
    );

  await logData("After fr draft creation");

  /****************
   *  Publish that new locale
   ****************/

  const docId = "my-article";

  const version = await findPublishedVersion(docId, { locale: "fr" });

  if (!version) {
    // move draft to published
    await conn("article")
      .update({
        published_at: new Date(),
        publicationState: "published",
      })
      .where({ doc_id: docId, locale: "fr", publicationState: "draft" });

    // clear relations of the published version
    await conn("article_author").delete().where({
      article_doc_id: docId,
      pivot_publicationState: "published",
    });

    // move relations to published
    await conn
      .into(
        conn.raw(
          "article_author (article_doc_id, author_doc_id, pivot_publicationState, pivot_locale)"
        )
      )
      .insert(
        conn
          .select([
            "article_doc_id",
            "author_doc_id",
            conn.raw("'published' as pivot_publicationState"),
            conn.raw("t.locale as pivot_locale"),
          ])
          .from("article_author")
          .crossJoin(
            // @ts-ignore
            conn
              .select()
              .distinct("locale")
              .from("article")
              .where({
                doc_id: docId,
                publicationState: "published",
              })
              .as("t")
          )
          .where({
            article_doc_id: docId,
            pivot_locale: "fr",
            pivot_publicationState: "draft",
          })
      );

    // clear locale relations
    await conn("article_author").delete().where({
      article_doc_id: docId,
      pivot_publicationState: "draft",
      pivot_locale: "fr",
    });
  } else {
    /***¨*************
     * Publish a new entry when there are others are already published
     ****************/
    // delete or merge then published data ?
    // then do the same sync process of relations as above
  }

  await logData("After fr publication");

  /****************
   * Update relation of the published version
   ****************/

  await conn("article_author")
    .update({
      author_doc_id: "my-second-author",
    })
    .where({
      article_doc_id: "my-article",
      pivot_publicationState: "published",
      pivot_locale: "fr",
    });

  await logData("After fr relation update");

  /****************
   * Unpublish one locale with no drafts
   ****************/

  const draft = await findDraftVersion(docId, { locale: "fr" });

  if (!draft) {
    // move published version to draft
    await conn("article")
      .update({
        published_at: null,
        publicationState: "draft",
      })
      .where({ doc_id: docId, locale: "fr", publicationState: "published" });

    // clear draft relations for all locales
    await conn("article_author").delete().where({
      article_doc_id: docId,
      pivot_publicationState: "draft",
    });

    // copy from the published to all the draft locales
    await conn
      .into(
        conn.raw(
          "article_author (article_doc_id, author_doc_id, pivot_publicationState, pivot_locale)"
        )
      )
      .insert(
        conn
          .select([
            "article_doc_id",
            "author_doc_id",
            conn.raw("'draft' as pivot_publicationState"),
            conn.raw("t.locale as pivot_locale"),
          ])
          .from("article_author")
          .crossJoin(
            // @ts-ignore
            conn
              .select()
              .distinct("locale")
              .from("article")
              .where({
                doc_id: docId,
                publicationState: "draft",
              })
              .as("t")
          )
          .where({
            article_doc_id: docId,
            pivot_locale: "fr",
            pivot_publicationState: "published",
          })
      );

    // clear relations of the previously published locale version
    await conn("article_author").delete().where({
      article_doc_id: docId,
      pivot_publicationState: "published",
      pivot_locale: "fr",
    });
  } else {
    ///
  }

  await logData("After fr unpublication");

  /*
    1. Set `published_at` NULL in the article table for a specific locale
    2. Create a new draft version
    3. Clone the relation in the `article_author` table using the draft version
    4. Cleanup left over relation if necessary (empty published left)
- Unpublish one locale over an existing draft
    - draft doesn’t have the same locale
        - Same as unpublishing over no draft
        - For relations replace if exists in the draft
    - draft has the same locale
        - Override the existing draft locale
        - Replace relations of that draft
- Unpublish all locales
    - Override the draft data & relations
    - Clearing all the published data & associated relations
- Delete locale entry
    - If the entry is published:
        - Remove relation if there are no more published entries
    - If the entry is in draft:
        - Remove relation if there are no more draft entries
    - Remove entry
- Remove localized sync relations

*/

  await destroy();
}

main().catch(console.dir);
