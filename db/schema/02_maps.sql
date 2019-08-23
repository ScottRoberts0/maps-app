-- Drop and recreate Maps table (Example)

DROP TABLE IF EXISTS maps CASCADE;
CREATE TABLE maps (
  id SERIAL PRIMARY KEY NOT NULL,
  lat DECIMAL(10,6) NOT NULL,
  long DECIMAL(10,6) NOT NULL,
  city VARCHAR(255),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);
