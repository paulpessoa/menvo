-- Snapshot of the /mentors filters active when the search returned no results
ALTER TABLE mentor_suggestions ADD COLUMN IF NOT EXISTS context JSONB;
