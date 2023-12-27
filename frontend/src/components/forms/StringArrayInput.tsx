import { Box } from "@mui/material"
import NonBlankInput from "./NonBlankInput"
import { InputProps } from "./validators"

export function StringArrayInput(props: InputProps<string>) {
  return (
    <Box>
      <NonBlankInput {...props} />
    </Box>
  )
}
