import { NonBlankString } from "./validators"

describe("validators", () => {
  describe("NonBlankString", () => {
    it("should work", () => {
      const testValidator = NonBlankString.withErrorMessage("error")
      const emptyStringValidation = testValidator.validate("")
      const blankStringValidation = testValidator.validate("  ")
      const nonBlankStringValidation = testValidator.validate("Hello!")

      expect(emptyStringValidation.isSuccessful()).toBe(false)
      expect(blankStringValidation.isSuccessful()).toBe(false)
      expect(nonBlankStringValidation.isSuccessful()).toBe(true)
    })
  })
})
