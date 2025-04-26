# REST API Plan

This REST API plan is designed to support the getTaste MVP. It is based on the provided PostgreSQL database schema (@db-plan.md), product requirements document (@prd.md), and technology stack (@tech-stack.md). The plan covers main resources, endpoint designs (CRUD and business logic), authentication/authorization, and validation rules.

---

## 1. Resources

The primary resources and their corresponding database tables are:

1. **Users** (table: `Users`)
   - Fields: `id`, `email`, `password_hash`, `nick` (with check constraints on allowed characters and length), `created_at`, `updated_at`, `deleted_at` (soft delete).

2. **User2FA** (table: `User2FA`)
   - Fields: `id`, `user_id` (unique, FK to Users), `verification_code`, `created_at`, `expires_at`, `verified_at`.

3. **Sessions** (table: `Sessions`)
   - Fields: `id`, `token` (unique), `created_at`.

4. **MusicPreferences** (table: `MusicPreferences`)
   - Fields: `user_id` (PK, FK to Users), `genres` (TEXT array), `artists` (TEXT array).

5. **FilmPreferences** (table: `FilmPreferences`)
   - Fields: `user_id` (PK, FK to Users), `genres` (TEXT array), `director`, `cast` (TEXT array), `screenwriter`.

6. **Recommendations** (table: `Recommendations`)
   - Fields: `id`, `user_id` (FK to Users), `type` (must be either 'music' or 'film'), `data` (JSONB for storing recommendation details), `created_at`.

7. **SpotifyData** (table: `SpotifyData`)
   - Fields: `id`, `user_id` (FK to Users), `album_id`, `artist_id`, `data` (JSONB), `created_at`.

*Additional Notes on Schema:*
- Relationships include one-to-one (Users ⇄ User2FA), one-to-(zero or one) for preferences tables, and one-to-many for Recommendations and SpotifyData.
- Unique indices exist on `Users.email`, `Users.nick`, and `Sessions.token`.
- Check constraints in `Users` (for `nick`) and `Recommendations` (for `type`) ensure data validity.
- Row Level Security (RLS) policies are assumed to be in place for enforcing per-user access.

---

## 2. Endpoints

Below are the designed endpoints for each resource and business process.

### 2.1. Authentication & Authorization

Endpoints will use token-based (JWT) authentication, integrated with Supabase's auth service and secured via RLS.

- **POST /auth/register**
  - Description: Register a new user with initial credentials and trigger 2FA setup.
  - Request Payload:
    ```json
    {
      "email": "user@example.com",
      "password": "StrongPassword!",
      "nick": "userNick"
    }
    ```
  - Response: User details with a temporary token to proceed with 2FA verification.
  - Success Codes: 201 Created.
  - Error Codes: 400 Bad Request (validation errors), 409 Conflict (e.g. duplicate email or nick).

- **POST /auth/verify-2fa**
  - Description: Verify the 2FA code for a newly registered user.
  - Request Payload:
    ```json
    {
      "user_id": 123,
      "verification_code": "ABC123"
    }
    ```
  - Response: JWT token upon successful verification.
  - Success Codes: 200 OK.
  - Error Codes: 400 Bad Request, 401 Unauthorized.

- **POST /auth/login**
  - Description: Log in an existing user and initiate 2FA if required.
  - Request Payload:
    ```json
    {
      "email": "user@example.com",
      "password": "StrongPassword!"
    }
    ```
  - Response: Prompt for 2FA if enabled or directly return a JWT token.
  - Success Codes: 200 OK.
  - Error Codes: 400 Bad Request, 401 Unauthorized.

- **GET /auth/me**
  - Description: Retrieve current authenticated user details.
  - Response: JSON object with user profile information.
  - Success Codes: 200 OK.
  - Error Codes: 401 Unauthorized.

### 2.2. User Profile & Preferences

- **GET /users/{id}**
  - Description: Fetch user profile data excluding sensitive fields.
  - URL Parameter: `id` (User identifier)
  - Response: JSON object containing user basic data and links to preferences.
  - Success Codes: 200 OK.
  - Error Codes: 404 Not Found, 401 Unauthorized.

- **PATCH /users/{id}**
  - Description: Update user details (e.g. nick) and/or preferences.
  - URL Parameter: `id`
  - Request Payload: Partial JSON with updated fields.
  - Response: Updated user object.
  - Success Codes: 200 OK.
  - Error Codes: 400 Bad Request, 404 Not Found, 403 Forbidden.

- **GET /users/{id}/preferences**
  - Description: Retrieve a combined view of a user's music and film preferences.
  - Response: JSON object with keys `music` and `film` containing preference details.
  - Success Codes: 200 OK.
  - Error Codes: 404 Not Found, 401 Unauthorized.

- **PATCH /users/{id}/preferences/music**
  - Description: Update music preferences (genres, artists).
  - Request Payload:
    ```json
    {
      "genres": ["rock", "pop"],
      "artists": ["Artist1", "Artist2"]
    }
    ```
  - Success Codes: 200 OK.
  - Error Codes: 400 Bad Request, 404 Not Found.

- **PATCH /users/{id}/preferences/film**
  - Description: Update film preferences (genres, director, cast, screenwriter).
  - Request Payload:
    ```json
    {
      "genres": ["drama", "thriller"],
      "director": "Director Name",
      "cast": ["Actor1", "Actor2"],
      "screenwriter": "Writer Name"
    }
    ```
  - Success Codes: 200 OK.
  - Error Codes: 400 Bad Request, 404 Not Found.

### 2.3. Recommendations

- **GET /users/{id}/recommendations**
  - Description: Retrieve recommendations for a user. Supports filtering by type (music or film) and pagination.
  - Query Parameters: `type` (optional: 'music' or 'film'), `page`, `limit`
  - Response: JSON with an array of recommendation objects and pagination metadata.
  - Success Codes: 200 OK.
  - Error Codes: 400 Bad Request, 401 Unauthorized.

- **POST /users/{id}/recommendations**
  - Description: Trigger generation of new recommendations based on current profile/preferences. This endpoint interfaces with the Openrouter.ai service for AI-generated recommendations.
  - Request Payload:
    ```json
    {
      "type": "music",  // or "film"
      "force_refresh": true
    }
    ```
  - Response: JSON object containing the new recommendations.
  - Success Codes: 201 Created.
  - Error Codes: 400 Bad Request, 500 Internal Server Error.

### 2.4. Spotify Integration

- **POST /spotify/sync**
  - Description: Initiate synchronization with Spotify to update user data (e.g., albums, artists) for recommendation enrichment.
  - Request Payload:
    ```json
    {
      "user_id": 123
    }
    ```
  - Response: Status message confirming sync initiation.
  - Success Codes: 200 OK.
  - Error Codes: 400 Bad Request, 500 Internal Server Error.

- **GET /users/{id}/spotify**
  - Description: Retrieve the latest Spotify data for the user.
  - Response: JSON object containing Spotify data details.
  - Success Codes: 200 OK.
  - Error Codes: 404 Not Found, 401 Unauthorized.

---

## 3. Authentication and Authorization

- **Mechanism:** JWT-based authentication integrated with Supabase's auth system. All endpoints (except registration and login) require a valid token.
- **Row Level Security (RLS):** Database-level policies ensure that users can only access their own records.
- **Role-Based Access:** Certain endpoints (e.g., admin-level changes) may require elevated privileges; middleware will enforce these roles.

---

## 4. Validation and Business Logic

- **Validation Rules (as per the DB Schema):**
  - **Users:**
    - Email must be unique and properly formatted.
    - `nick` must comply with the regex constraint and not exceed 20 characters.
  - **Recommendations:**
    - `type` field must be either 'music' or 'film'.
  - **Preferences:**
    - Ensure arrays for genres, artists, and cast contain valid strings.

- **Business Logic Requirements (from PRD):**
  - **User Registration & 2FA:**
    - Upon registration, a verification code is generated and must be validated via `/auth/verify-2fa`.
    - Both registration and login processes enforce 2FA.
  - **Profile Updates:**
    - Changes to user preferences automatically trigger re-evaluation of recommendations.
  - **Recommendation Generation:**
    - Integration with Openrouter.ai for dynamic recommendations based on profile preferences.
    - Recommendations are refreshed on login and/or explicit request.
  - **Spotify Synchronization:**
    - Backend triggers data sync with Spotify upon user login or via manual endpoint call to keep music data current.

- **Error Handling:**
  - Consistent error responses using standard HTTP status codes (400, 401, 403, 404, 409, 500).
  - Detailed error messages for validation failures.

---

This plan provides a comprehensive blueprint for implementing the REST API for getTaste MVP, ensuring that all CRUD operations, business logic, and security mechanisms are thoroughly addressed in alignment with the provided database schema, product requirements, and technology stack. 