import { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import { InputProps, NonBlankString } from "../components/forms/validators"
import NonBlankInput from "../components/forms/NonBlankInput"

const meta: Meta<typeof NonBlankInput> = {
  title: "Forms/NonBlankInput",
  component: NonBlankInput,
  parameters: {},
  tags: ["autodocs"],
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof NonBlankInput>

export const Default: Story = {
  args: {},
  render: function NonBlankInputStory() {
    const [inputProps, setInputProps] = useState<InputProps<string>>({
      type: "untouched",
      name: "name",
      label: "Label",
      validator: NonBlankString.withErrorMessage("Error!"),
      input: "",
      onChange,
    })

    function onChange(input: string) {
      setInputProps((inputProps) => {
        const validation = inputProps.validator.validate(input)

        return validation.match<InputProps<string>>(
          () => ({
            ...inputProps,
            input,
            type: "invalid",
            error: inputProps.validator.errorMessage,
          }),
          (value) => ({
            ...inputProps,
            input,
            type: "valid",
            value,
          }),
        )
      })
    }

    return <NonBlankInput {...inputProps} />
  },
}
