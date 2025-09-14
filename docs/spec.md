Purpose
Capture today’s scope and the temporary rule for genre/type so implementation is deferred until research is complete.

Content to paste:

Today’s scope: Produce two research artifacts only—nextfaster-findings and unsplash-notes. No page coding.

Data source: Unsplash API using Access Key with Authorization: Client-ID for read-only calls.

Compliance: When selecting a photo for ingestion, call links.download_location once before fetching bytes.

Temporary genre/type rule:

Status: Undecided. Unsplash has no single “genre” field. Candidates include the search query term, topic_submissions (e.g., business-work), or tags.

Default for seeding: Set genre/type to the exact search query used (e.g., “office”). This value is stored in photos.genre_label.

Future decision: After inspecting tags and topic_submissions from the 10-photo sample, propose whether to keep query-as-genre or switch to topics/tags; do not hard‑code taxonomy yet.

Output of tomorrow’s ingest: Store a small rendition in S3 and write one row per photo in the photos table with S3 pointer and genre_label, optionally linking to a genres row if created.
