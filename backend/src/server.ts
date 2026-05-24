import { app } from "./app.js";
import { ensureDatabaseResilienceIndexes } from "./config/databaseIndexes.js";
import { env } from "./config/env.js";

await ensureDatabaseResilienceIndexes();

app.listen(env.port, () => {
  console.log(`ApplianSys backend running on http://localhost:${env.port}`);
});
