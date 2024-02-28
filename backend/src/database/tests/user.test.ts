import * as db from "../db"
import * as S from "@effect/schema/Schema"
import { insertUser } from "../functions/user/insert_user"
import { User } from "../functions/user/domain"
import { loginUser } from "../functions/user/login_user"

describe("database user functions", () => {
  afterAll(async () => {
    await db.query('delete from "user"')
  })

  describe("insert user", () => {
    it("should work and encrypt password", async () => {
      const result = await insertUser({
        name: "Insert User Test",
        email: "insert.user.test@example.com",
        password: "P4ssw0rd!",
      })

      expect(S.is(User)(result)).toBe(true)

      const rawUser = await db.query('select * from "user" where id = $1', [
        result.id,
      ])

      expect(rawUser.rows[0].password).not.toBe("P4ssw0rd!")
    })

    it("should break if email uniqueness is broken", async () => {
      await insertUser({
        name: "Same Email Insert User Test 1",
        email: "same.email.insert.user.test@example.com",
        password: "P4ssw0rd!1",
      })

      await expect(
        async () =>
          await insertUser({
            name: "Same Email Insert User Test 2",
            email: "same.email.insert.user.test@example.com",
            password: "P4ssw0rd!2",
          }),
      ).rejects.toBeTruthy()
    })
  })

  describe("login user", () => {
    const email = "login.user.test@example.com"
    const password = "L0g1nUs3r!"
    let user: User

    beforeAll(async () => {
      user = await insertUser({
        name: "Login User Test",
        email,
        password,
      })
    })

    it("should work and return a user", async () => {
      const result = await loginUser({ email, password })
      expect(result?.id).toBe(user.id)
    })

    it("should return null if the user does not exist (i.e.: wrong email)", async () => {
      const result = await loginUser({
        email: "some.other.email@example.com",
        password,
      })

      expect(result).toBeNull()
    })

    it("should return null if the password is wrong", async () => {
      const result = await loginUser({
        email,
        password: "Invalid password",
      })

      expect(result).toBeNull()
    })
  })

  describe("update user", () => {
    it.todo("should work")
    it.todo("should break if email uniqueness is broken")
  })

  describe("delete user", () => {
    it.todo("should work")
  })
})
