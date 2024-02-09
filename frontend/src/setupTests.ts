import dotenv from "dotenv"

export default function setupTests() {
  dotenv.config({ path: ".env.test" })
}
