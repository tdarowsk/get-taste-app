-- migration: 20250501000100_sample_test_data.sql
-- description: inserts additional sample test data into the database for development purposes
-- author: ai assistant
-- date: 2025-05-01

-- Sample users with different UUIDs
insert into users (id, email, password_hash, nick, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000003', 'alex.wilson@example.com', 'hashed_password_3', 'alexw', now() - interval '20 days', now() - interval '20 days'),
  ('00000000-0000-0000-0000-000000000004', 'maria.garcia@example.com', 'hashed_password_4', 'mariag', now() - interval '15 days', now() - interval '15 days'),
  ('00000000-0000-0000-0000-000000000005', 'david.kim@example.com', 'hashed_password_5', 'davidk', now() - interval '10 days', now() - interval '10 days');

-- Additional music preferences
insert into music_preferences (user_id, genres, artists)
values
  ('00000000-0000-0000-0000-000000000003', array['hip hop', 'rap', 'trap'], array['Kendrick Lamar', 'J. Cole', 'Travis Scott']),
  ('00000000-0000-0000-0000-000000000004', array['latin', 'reggaeton', 'pop'], array['Bad Bunny', 'J Balvin', 'Shakira']),
  ('00000000-0000-0000-0000-000000000005', array['electronic', 'house', 'techno'], array['Daft Punk', 'Chemical Brothers', 'Aphex Twin']);

-- Additional film preferences
insert into film_preferences (user_id, genres, director, "cast", screenwriter)
values
  ('00000000-0000-0000-0000-000000000003', array['action', 'adventure', 'fantasy'], 'James Cameron', array['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver'], 'James Cameron'),
  ('00000000-0000-0000-0000-000000000004', array['horror', 'thriller', 'mystery'], 'Jordan Peele', array['Daniel Kaluuya', 'Lupita Nyong''o', 'Elisabeth Moss'], 'Jordan Peele'),
  ('00000000-0000-0000-0000-000000000005', array['documentary', 'biography', 'history'], 'Ken Burns', array['Tom Hanks', 'Meryl Streep', 'Morgan Freeman'], null);

-- Additional music recommendations
insert into recommendations (user_id, type, data, created_at)
values
  ('00000000-0000-0000-0000-000000000003', 'music', '{
    "title": "Hip Hop Essentials",
    "description": "Essential tracks from hip hop artists you might enjoy",
    "items": [
      {
        "id": "song-5",
        "name": "DNA.",
        "type": "song",
        "details": {
          "artist": "Kendrick Lamar",
          "album": "DAMN.",
          "year": 2017,
          "genres": ["hip hop", "rap", "conscious hip hop"]
        }
      },
      {
        "id": "song-6",
        "name": "SICKO MODE",
        "type": "song",
        "details": {
          "artist": "Travis Scott",
          "album": "ASTROWORLD",
          "year": 2018,
          "genres": ["hip hop", "trap"]
        }
      }
    ]
  }'::jsonb, now() - interval '10 days');

-- Additional film recommendations
insert into recommendations (user_id, type, data, created_at)
values
  ('00000000-0000-0000-0000-000000000004', 'film', '{
    "title": "Modern Horror Classics",
    "description": "Contemporary horror films that redefine the genre",
    "items": [
      {
        "id": "movie-7",
        "name": "Get Out",
        "type": "movie",
        "details": {
          "director": "Jordan Peele",
          "year": 2017,
          "genres": ["horror", "thriller", "mystery"],
          "duration": 104
        }
      },
      {
        "id": "movie-8",
        "name": "Hereditary",
        "type": "movie",
        "details": {
          "director": "Ari Aster",
          "year": 2018,
          "genres": ["horror", "mystery", "thriller"],
          "duration": 127
        }
      }
    ]
  }'::jsonb, now() - interval '8 days');

-- Additional spotify data
insert into spotify_data (user_id, album_id, artist_id, data, created_at)
values
  ('00000000-0000-0000-0000-000000000003', 'album345', 'artist678', '{
    "album_name": "DAMN.",
    "artist_name": "Kendrick Lamar",
    "genres": ["hip hop", "rap", "west coast hip hop"],
    "popularity": 89,
    "release_date": "2017-04-14",
    "tracks": [
      {
        "id": "track005",
        "name": "DNA.",
        "duration_ms": 185000,
        "explicit": true,
        "preview_url": "https://example.com/preview/track005"
      },
      {
        "id": "track006",
        "name": "HUMBLE.",
        "duration_ms": 177000,
        "explicit": true,
        "preview_url": "https://example.com/preview/track006"
      }
    ]
  }'::jsonb, now() - interval '15 days');

-- Additional recommendation feedback
insert into recommendations_feedback (recommendation_id, user_id, feedback_type, created_at)
values 
  -- Feedback for user 3's music recommendation (ID should be 3)
  (3, '00000000-0000-0000-0000-000000000003', 'like', now() - interval '9 days'),
  
  -- Feedback for user 4's film recommendation (ID should be 4)
  (4, '00000000-0000-0000-0000-000000000004', 'like', now() - interval '7 days'); 