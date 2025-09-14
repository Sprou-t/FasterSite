Purpose
Provide exact API steps, the fields to capture, and restate the temporary genre decision.

Content to paste:

Auth header: Authorization: Client-ID YOUR_ACCESS_KEY.

Search 10 photos: GET https://api.unsplash.com/search/photos?query={QUERY}&per_page=10. Response: { total, total_pages, results[] }.

Register download: For each selected results[i], GET results[i].links.download_location with the same header. This logs the download; do not use links.download for API calls.

Fetch bytes for S3: Use results[i].urls.small (~400 px) or build from urls.raw with &w=400&dpr=2&q=80, preserving existing ixid params.

Fields to persist per photo:

id, slug, description, alt_description, width, height, color, blur_hash, created_at, updated_at, likes, user.id, urls JSON, links JSON.

S3: s3_bucket, s3_key_small, small_bytes, small_content_type after upload.

Temporary genre/type rule:

Set photos.genre_label = QUERY used for fetching (e.g., “office”).

Leave photos.genre_id null unless a genres row is created. After sampling tags/topic_submissions from these results, revisit this choice.

Postman quick test:

Search: GET /search/photos?query=office&per_page=10 with Authorization header.

Register: GET links.download_location for one item with same header (expect 200 JSON).

Fetch: GET urls.small (no auth) to confirm image retrieval
