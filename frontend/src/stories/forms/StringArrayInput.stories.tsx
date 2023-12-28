import { Meta, StoryObj } from "@storybook/react"
import { StringArrayInput } from "../../components/forms/inputs/StringArrayInput"
import { useState } from "react"

const meta: Meta<typeof StringArrayInput> = {
  title: "Forms/StringArrayInput",
  component: StringArrayInput,
  parameters: {},
  tags: ["autodocs"],
  argTypes: {
    title: {
      type: "string",
      control: "text",
    },
    label: {
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
type Story = StoryObj<typeof StringArrayInput>

export const Default: Story = {
  args: {
    title: "List of strings",
    label: "Label",
    errorMessageWhenBlank: "Error: this field cannot be blank",
  },
  render: function StringArrayInputStory(props) {
    const [value, setValue] = useState<string[]>(["a list", "of strings"])

    return (
      <StringArrayInput
        title={props.title}
        name="name"
        label={props.label}
        value={value}
        onChange={setValue}
        errorMessageWhenBlank={props.errorMessageWhenBlank}
      />
    )
  },
}
