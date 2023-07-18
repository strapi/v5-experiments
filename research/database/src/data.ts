export const data = {
  article: [
    {
      id: 1,
      title: "Article 1",
      doc_id: "article-1",
      version_id: "article-1-draft",
      locale: "en",
    },
    {
      id: 2,
      title: "Article 1",
      doc_id: "article-1",
      version_id: "article-1-published",
      published_at: new Date().toISOString(),
      locale: "en",
    },
  ],

  author: [
    {
      id: 1,
      name: "Author 1",
      doc_id: "author-1",
      version_id: "author-1-draft",
      locale: "en",
    },
    {
      id: 2,
      name: "Author 2",
      doc_id: "author-2",
      version_id: "author-2-draft",
      locale: "en",
    },
  ],

  article_author: [
    {
      id: 1,
      article_doc_id: "article-1",
      pivot_version_id: "article-1-draft",
      // pivot_locale: "en", // | null,
      // pivot_channel: "web",
      author_doc_id: "author-1",
    },
    {
      id: 2,
      article_doc_id: "article-1",
      pivot_version_id: "article-1-published",
      // add a pivot local column to localize the relationship avoids having to jungle with ids
      // pivot_locale: "en", // | null,
      author_doc_id: "author-2",
    },
  ],
};
