import dotenv from "dotenv"

export default async function setupTests(): Promise<void> {
  dotenv.config({ path: ".env.test" })
  // @ts-expect-error it's testing and it works
  const { initDatabase } = await import("./database/init.ts")
  await initDatabase()
}
