import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
try {
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;");
  await db.exec(await readFile("docs/sql/finance-journal.sql", "utf8"));
  await db.exec("INSERT INTO luvipro_finance_accounts VALUES ('1000','Synthetic asset','asset'),('4000','Synthetic revenue','income')");
  const post = (reference, lines, reversal = null) => db.query(
    "SELECT luvipro_finance_post('2026-01-15', $1, 'Synthetic test', $2::jsonb, $3::uuid) AS id",
    [reference, JSON.stringify(lines), reversal],
  );
  const lines = [{ account: "1000", debit: 1234, credit: 0 }, { account: "4000", debit: 0, credit: 1234 }];
  await db.exec("SET ROLE anon");
  await assert.rejects(post("forbidden", lines), /permission denied/);
  await assert.rejects(db.query("SELECT * FROM luvipro_finance_journal"), /permission denied/);
  await db.exec("RESET ROLE; SET ROLE service_role");
  const { rows: [{ id }] } = await post("original", lines);
  await assert.rejects(post("original", lines), /duplicate key/);
  await assert.rejects(post("unbalanced", [lines[0], { ...lines[1], credit: 1233 }]), /Unbalanced entry/);
  await assert.rejects(post("unknown-account", [lines[0], { ...lines[1], account: "9999" }]), /foreign key/);
  await assert.rejects(db.exec("DELETE FROM luvipro_finance_journal"), /permission denied/);
  await post("reversal", [], id);
  await assert.rejects(post("reversal-again", [], id), /duplicate key/);
  const { rows: [totals] } = await db.query(
    "SELECT count(*)::int AS entries, sum(debit_cents-credit_cents)::int AS balance FROM luvipro_finance_lines WHERE account='1000'",
  );
  assert.deepEqual(totals, { entries: 2, balance: 0 });
  const { rows } = await db.query("SELECT reference FROM luvipro_finance_journal ORDER BY reference");
  assert.deepEqual(rows, [{ reference: "original" }, { reference: "reversal" }]);
  console.log("PostgreSQL journal: privileges, balancing, rollback, duplicate prevention and reversal passed.");
} finally {
  await db.close();
}
