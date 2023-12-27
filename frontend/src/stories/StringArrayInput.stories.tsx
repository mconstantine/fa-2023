import { Meta, StoryObj } from "@storybook/react"
import { StringArrayInput } from "../components/forms/StringArrayInput"

const meta: Meta<typeof StringArrayInput> = {
  title: "Forms/StringArrayInput",
  component: StringArrayInput,
  parameters: {},
  tags: ["autodocs"],
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof StringArrayInput>

export const Default: Story = {
  args: {},
  render: () => <StringArrayInput />,
}
