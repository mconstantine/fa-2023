import { initDatabase } from "./database/init"

// -------------------------------------------------------------------------------------------------------
;(async () => {
  await initDatabase()
})()
  .then(() => {})
  .catch(console.log)
