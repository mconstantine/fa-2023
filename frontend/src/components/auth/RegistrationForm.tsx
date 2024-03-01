import * as S from "@effect/schema/Schema"
import { useAuthContext } from "../../contexts/AuthContext"
import { useForm } from "../../hooks/useForm"
import Form from "../forms/Form"
import { Email } from "../../../../backend/src/database/domain"
import { constTrue } from "effect/Function"
import { Either } from "effect"
import TextInput from "../forms/inputs/TextInput"

export default function RegistrationForm() {
  const authContext = useAuthContext()

  const { inputProps, submit, isValid, formError } = useForm({
    initialValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirmation: "",
    },
    validators: {
      name: S.Trim.pipe(
        S.nonEmpty({ message: () => "The name cannot be empty" }),
      ),
      email: S.Trim.pipe(Email).pipe(
        S.filter(constTrue, {
          message: () => "This is not a valid email address",
        }),
      ),
      password: S.Trim.pipe(
        S.nonEmpty({ message: () => "The password cannot be empty" }),
      ),
    },
    formValidator: (data) => {
      if (data.password === data.passwordConfirmation) {
        return Either.right(data)
      } else {
        return Either.left("The passwords don't match")
      }
    },
    submit: (data) => {
      switch (authContext.type) {
        case "Authenticated":
          return
        case "Anonymous":
          authContext.register(data)
      }
    },
  })

  switch (authContext.type) {
    case "Authenticated":
      return null
    case "Anonymous":
      return (
        <Form
          onSubmit={submit}
          isValid={isValid}
          networkResponse={authContext.networkResponse}
          submitButtonLabel="Submit"
          formError={formError}
        >
          <TextInput {...inputProps("name")} label="Your full name" />
          <TextInput
            {...inputProps("email")}
            label="Your email address"
            fieldProps={{ type: "email" }}
          />
          <TextInput
            {...inputProps("password")}
            label="Your password"
            fieldProps={{ type: "password" }}
          />
          <TextInput
            {...inputProps("passwordConfirmation")}
            label="Confirm your password"
            fieldProps={{ type: "password" }}
          />
        </Form>
      )
  }
}
