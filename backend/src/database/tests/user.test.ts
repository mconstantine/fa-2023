import * as db from "../db"
import * as S from "@effect/schema/Schema"
import { insertUser } from "../functions/user/insert_user"
import { User } from "../functions/user/domain"
import { loginUser } from "../functions/user/login_user"
import { updateUser } from "../functions/user/update_user"

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

    it("should break if the user does not exist (i.e.: wrong email)", async () => {
      await expect(
        async () =>
          await loginUser({
            email: "some.other.email@example.com",
            password,
          }),
      ).rejects.toBeTruthy()
    })

    it("should break if the password is wrong", async () => {
      await expect(
        async () =>
          await loginUser({
            email,
            password: "Invalid password",
          }),
      ).rejects.toBeTruthy()
    })
  })

  describe("update user", () => {
    it("should work and encrypt the new password", async () => {
      const user = await insertUser({
        name: "Update User Test",
        email: "update.user.test@example.com",
        password: "Upd4t3!",
      })

      const result = await updateUser(user.id, {
        name: "Updated User Test",
        email: "updated.user.test@example.com",
        password: "Upd4t3d!",
      })

      expect(result.id).toBe(user.id)
      expect(result.name).toBe("Updated User Test")
      expect(result.email).toEqual("updated.user.test@example.com")

      const loginResult = await loginUser({
        email: "updated.user.test@example.com",
        password: "Upd4t3d!",
      })

      expect(loginResult.id).toBe(user.id)
    })

    it("should allow to not update the password", async () => {
      const user = await insertUser({
        name: "Update User Test No Password",
        email: "update.user.test.no.password@example.com",
        password: "Upd4t3!",
      })

      const result = await updateUser(user.id, {
        email: "updated.user.test.no.password@example.com",
      })

      const loginResult = await loginUser({
        email: "updated.user.test.no.password@example.com",
        password: "Upd4t3!",
      })

      expect(loginResult.id).toBe(result.id)
    })

    it("should break if email uniqueness is broken", async () => {
      await insertUser({
        name: "Same Email Update User Test 1",
        email: "same.email.update.user.test1@example.com",
        password: "P4ssw0rd!1",
      })

      const suspicious = await insertUser({
        name: "Same Email Update User Test 2",
        email: "same.email.update.user.test2@example.com",
        password: "P4ssw0rd!2",
      })

      await expect(
        async () =>
          await updateUser(suspicious.id, {
            email: "same.email.update.user.test1@example.com",
          }),
      ).rejects.toBeTruthy()
    })
  })

  describe("delete user", () => {
    it.todo("should work")
  })
})
