-- users: core identity + auth
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- location_permissions: explicit, revocable consent — never assume consent
CREATE TABLE location_permissions (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  sharing_enabled BOOLEAN NOT NULL DEFAULT false,
  visible_to TEXT NOT NULL DEFAULT 'friends', -- 'friends' | 'everyone' | 'nobody'
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- sessions: supports multi-device login (subtopic 9)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_label TEXT,             -- e.g. "Chrome on iPhone"
  socket_id TEXT,                 -- current live socket.io connection id, null if offline
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- friendships: who can see whom
CREATE TABLE friendships (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted'
  PRIMARY KEY (user_id, friend_id)
);

-- locations: latest known position per session (not a full history log — see note below)
CREATE TABLE locations (
  session_id UUID PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  geom GEOGRAPHY(POINT, 4326) NOT NULL,
  sequence_number BIGINT NOT NULL,   -- see Part 6: out-of-order protection
  recorded_at TIMESTAMPTZ NOT NULL,  -- client-reported timestamp
  received_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX locations_geom_idx ON locations USING GIST (geom);