-- Backfill empty user names from their GitHub username.
-- github_url is always of the form https://github.com/<login>, so the
-- username is the first path segment after "github.com/". The LIKE guard
-- with "_" requires at least one character after "github.com/", which
-- also excludes URLs like "https://github.com/" that have no username.
UPDATE users
SET name = SUBSTRING_INDEX(
    SUBSTRING_INDEX(github_url, 'github.com/', -1),
    '/',
    1
)
WHERE (name IS NULL OR TRIM(name) = '')
  AND github_url LIKE 'https://github.com/_%';
