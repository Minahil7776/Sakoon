import fs from "node:fs";
import pg from "pg";
import bcrypt from "bcryptjs";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(fs.readFileSync("db/schema.sql", "utf8"));
console.log("Tables are ready.");

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const res = await client.query(
    `insert into users (full_name, email, password_hash, role, email_verified)
     values ($1, $2, $3, 'admin', true)
     on conflict (lower(email)) do nothing`,
    [ADMIN_NAME || "Platform Admin", ADMIN_EMAIL, hash]
  );
  console.log(res.rowCount ? "Admin account created." : "Admin already exists.");
}
await client.end();
