# Leaderboard SQLite Schema

This folder stores the persistent SQLite schema for cloud leaderboard records.

Default server initialization:

```bash
cd /var/www/henry_games
git pull origin main
sudo apt install -y sqlite3
./scripts/init-leaderboard-db.sh
node scripts/migrate-account-db.mjs
node scripts/migrate-student-points-db.mjs
```

The default database path is:

```text
/var/www/henry_games_api/data/leaderboard.sqlite
```

To use a custom path:

```bash
LEADERBOARD_DB_PATH=/custom/path/leaderboard.sqlite ./scripts/init-leaderboard-db.sh
```

## Import Browser Local Scores

Open the website in the browser that has the local records, then run this in DevTools Console:

```js
copy(localStorage.getItem('cognitive-games-best-scores') || '{}')
```

Save the copied JSON on the server, for example:

```bash
nano /tmp/local-scores.json
```

Import it into the default leaderboard database:

```bash
cd /var/www/henry_games
node scripts/migrate-account-db.mjs
node scripts/migrate-student-points-db.mjs
node scripts/import-local-scores-to-sqlite.mjs /tmp/local-scores.json
```

Verify imported records:

```bash
sqlite3 /var/www/henry_games_api/data/leaderboard.sqlite "SELECT * FROM challenge_leaderboard;"
sqlite3 /var/www/henry_games_api/data/leaderboard.sqlite "SELECT * FROM fixed_leaderboard;"
```
