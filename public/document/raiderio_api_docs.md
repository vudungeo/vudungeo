# Raider.IO Developer API (v1) - Documentation Summary

This document summarizes the official Raider.IO API (v1) methods, parameters, and purposes. The primary source is the [Raider.IO Developer Portal](https://raider.io/api).

**Base URL**: `https://raider.io/api/v1`

---

## 1. Character APIs
Endpoints for retrieving data about individual World of Warcraft characters.

### `GET /characters/profile`
**Purpose**: The primary endpoint for character data. Fetches profile info, gear, covenants, raid progression, and Mythic+ scores/runs.
- **Parameters**: `region`, `realm`, `name`, `fields` (e.g., `gear`, `guild`, `mythic_plus_scores_by_season:current`, `mythic_plus_best_runs`).

---

## 2. Guild APIs
Endpoints for retrieving data about World of Warcraft guilds.

### `GET /guilds/profile`
**Purpose**: Fetches guild-wide data, including profile info and raid progression.
- **Parameters**: `region`, `realm`, `name`, `fields` (e.g., `raid_progression`, `raid_rankings`).

### `GET /guilds/boss-kill`
**Purpose**: Retrieves details about a guild's specific boss kills in a raid.

---

## 3. Mythic+ APIs
Endpoints for retrieving Mythic+ dungeon-specific data.

### `GET /mythic-plus/affixes`
**Purpose**: Returns the current, previous, and next weekly affixes for a region.
- **Parameters**: `region`, `locale`.

### `GET /mythic-plus/runs`
**Purpose**: Fetches top Mythic+ runs matching specific criteria (e.g., season, dungeon, character).

### `GET /mythic-plus/run-details`
**Purpose**: Provides in-depth details for a single Mythic+ run by its ID.

### `GET /mythic-plus/static-data`
**Purpose**: Returns static data for Mythic+ seasons and dungeons (slugs, names, IDs) for an expansion.

### `GET /mythic-plus/season-cutoffs`
**Purpose**: Returns the current score cutoffs for Mythic+ achievement tiers (e.g., Title, Master, Hero).

### `GET /mythic-plus/leaderboard-capacity`
**Purpose**: Returns the current capacity of Mythic+ leaderboards for a region.

### `GET /mythic-plus/score-tiers`
**Purpose**: Fetches the color-coded score tiers used for visual feedback in a season.

---

## 4. Raiding APIs
Endpoints for retrieving raid-specific data and rankings.

### `GET /raiding/boss-rankings`
**Purpose**: Returns boss rankings for a given raid, region, and difficulty.

### `GET /raiding/static-data`
**Purpose**: Returns static data for raids and bosses within a specific expansion.

---

## 5. General APIs

### `GET /periods`
**Purpose**: Returns reset cycle data (current, previous, next period IDs and date ranges) for a region.

---

## Usage & Rate Limits
To ensure service stability, Raider.IO implements rate limiting based on your application's authentication status.

### 1. Unauthenticated Requests
- **Limit**: **300 requests per minute**.
- **Best For**: Personal projects, low-traffic dashboards, or local testing.
- **Identification**: Requests are tracked by IP address.

### 2. Authenticated / Registered Applications
- **Limit**: **Significantly Higher** (unlocked after registration).
- **Registration**: Visit the [Raider.IO Developer Portal](https://raider.io/api) to register your app and obtain a client secret/token.

### 3. Rate Limit Headers
The API typically returns headers to help you manage your request volume:
- `X-RateLimit-Limit`: The total number of requests allowed in the current window.
- `X-RateLimit-Remaining`: The number of requests remaining in the current window.
- `X-Retry-After`: If rate limited (HTTP 429), this indicates how many seconds to wait before retrying.

---

## Best Practices
- **Realms**: Always use "slug" format (e.g., `twisting-nether`) for better reliability.
- **Fields**: The `fields` parameter is powerful; chain multiple data points (e.g., `fields=gear,raid_progression`) to minimize the total number of API calls and stay within your rate limits.
- **Caching**: Implement local caching (like the SQLite backbone in this project) to reduce redundant calls to the live API.
