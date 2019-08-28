-- Drop and recreate Markers table (Example)

DROP TABLE IF EXISTS markers CASCADE;
CREATE TABLE markers (
  id SERIAL PRIMARY KEY NOT NULL,
  lat DECIMAL(10,6) NOT NULL,
  long DECIMAL(10,6) NOT NULL,
  title VARCHAR(255),
  description VARCHAR(255),
  img VARCHAR(255),
  address VARCHAR(255),
  map_id INTEGER REFERENCES maps(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);
