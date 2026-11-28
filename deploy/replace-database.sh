#!/usr/bin/env bash
set -euo pipefail
umask 077
[[ ${CONFIRM_REPLACE:-} == 'REPLACE ALL PRODUCTION DATA' ]] || exit 1
id=${1:?Numeric operation ID required}
[[ "$id" =~ ^[0-9]+$ ]] || exit 1
base=/opt/spectech
work="$base/replace-$id"
stage="spectech_stage_$id"
old="spectech_before_$id"
stopped=false
renamed=false
switched=false
photos=false
success=false
psql_admin() { runuser -u postgres -- psql -X -v ON_ERROR_STOP=1 -d postgres -c "$1" >/dev/null; }
finish() {
  code=$?
  trap - EXIT
  if [[ "$success" != true && "$stopped" == true ]]; then
    systemctl stop spectech || true
    if [[ "$switched" == true ]]; then
      psql_admin "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='spectech';" || true
      psql_admin "ALTER DATABASE spectech RENAME TO $stage;" || exit 1
    fi
    if [[ "$renamed" == true ]]; then
      psql_admin "ALTER DATABASE $old RENAME TO spectech;" || exit 1
    fi
    if [[ "$photos" == true ]]; then
      mv "$base/shared/uploads" "$work/failed-uploads" || exit 1
    fi
    if [[ -d "$base/shared/uploads-before-$id" ]]; then
      mv "$base/shared/uploads-before-$id" "$base/shared/uploads" || exit 1
    fi
    systemctl start spectech || true
  fi
  rm -f "$base/replacement.enc" "$base/replacement.key"
  exit "$code"
}
trap finish EXIT
mkdir "$work"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in "$base/replacement.enc" -pass "file:$base/replacement.key" | tar -xz -C "$work"
cd "$work"
sha256sum -c files.sha256 > /dev/null
runuser -u postgres -- createdb -O spectech "$stage"
# Restore into an isolated database; production remains untouched until verification succeeds.
runuser -u postgres -- pg_restore --exit-on-error --no-owner --no-privileges --role=spectech -d "$stage" < database.dump
runuser -u postgres -- psql -X -v ON_ERROR_STOP=1 -At -d "$stage" < verify.sql > actual.txt
diff -u expected.txt actual.txt
chown -R spectech:spectech uploads
find uploads -type d -exec chmod 750 {} +
find uploads -type f -exec chmod 640 {} +
systemctl stop spectech
stopped=true
runuser -u postgres -- pg_dump -Fc spectech > "$base/backups/before-replace-$id.dump"
tar -czf "$base/backups/uploads-before-replace-$id.tar.gz" -C "$base/shared" uploads
psql_admin "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='spectech';"
psql_admin "ALTER DATABASE spectech RENAME TO $old;"
renamed=true
psql_admin "ALTER DATABASE $stage RENAME TO spectech;"
switched=true
mv "$base/shared/uploads" "$base/shared/uploads-before-$id"
mv uploads "$base/shared/uploads"
photos=true
systemctl start spectech
ok=false
for attempt in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3000/api/home >/dev/null && curl -fsS http://127.0.0.1:3000/api/services >/dev/null; then ok=true; break; fi
  sleep 2
done
[[ "$ok" == true ]]
runuser -u postgres -- psql -X -v ON_ERROR_STOP=1 -At -d spectech < verify.sql > actual.txt
diff -u expected.txt actual.txt
success=true
rm -f database.dump
echo "Replacement verified. Previous database: $old; backups: $base/backups/*replace-$id*"