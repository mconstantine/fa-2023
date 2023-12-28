import { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import NonBlankInput from "../../components/input/NonBlankInput"

const meta: Meta<typeof NonBlankInput> = {
  title: "Forms/NonBlankInput",
  component: NonBlankInput,
  parameters: {},
  tags: ["autodocs"],
  argTypes: {
    label: {
      name: "Label",
      type: "string",
      control: "text",
    },
    errorMessageWhenBlank: {
      type: "string",
      name: "Error message for blank fields",
      control: "text",
    },
  },
}

export default meta
type Story = StoryObj<typeof NonBlankInput>

export const Default: Story = {
  args: {
    label: "Label",
    errorMessageWhenBlank: "Error: this field cannot be blank",
  },
  render: function NonBlankInputStory(props) {
    const [value, setValue] = useState("")

    return (
      <NonBlankInput
        name="name"
        label={props.label}
        value={value}
        onChange={setValue}
        errorMessageWhenBlank={props.errorMessageWhenBlank}
      />
    )
  },
}
