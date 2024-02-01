import dotenv from "dotenv"

export default function setupTests(): void {
  dotenv.config({
    path: ".env.test",
  })
}
