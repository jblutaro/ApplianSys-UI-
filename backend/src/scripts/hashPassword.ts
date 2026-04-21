import { hashPassword } from "../auth/password.js";

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.error("Usage: npm run hash:password -- <plain-text-password>");
    process.exit(1);
  }

  const hash = await hashPassword(password);
  console.log(hash);
}

main().catch((error) => {
  console.error("Could not hash password:", error);
  process.exit(1);
});
