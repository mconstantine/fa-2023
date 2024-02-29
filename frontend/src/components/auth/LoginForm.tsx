import * as S from "@effect/schema/Schema"
import { useAuthContext } from "../../contexts/AuthContext"
import { useForm } from "../../hooks/useForm"
import Form from "../forms/Form"
import { Email } from "../../../../backend/src/database/domain"
import { constTrue } from "effect/Function"
import TextInput from "../forms/inputs/TextInput"

export default function LoginForm() {
  const authContext = useAuthContext()

  const { inputProps, submit, isValid } = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validators: {
      email: S.Trim.pipe(Email).pipe(
        S.filter(constTrue, {
          message: () => "This is not a valid email address",
        }),
      ),
      password: S.Trim.pipe(
        S.nonEmpty({ message: () => "The password cannot be empty" }),
      ),
    },
    submit: (data) => {
      switch (authContext.type) {
        case "Authenticated":
          return
        case "Anonymous":
          authContext.login(data)
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
        >
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
        </Form>
      )
  }
}
