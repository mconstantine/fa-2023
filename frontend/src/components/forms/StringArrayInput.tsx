import {
  Box,
  IconButton,
  InputAdornment,
  SxProps,
  Tooltip,
  Typography,
} from "@mui/material"
import NonBlankInput from "./inputs/NonBlankInput"
import { KeyboardEvent, useState } from "react"
import { Add, Delete } from "@mui/icons-material"

interface Props {
  title: string
  name: string
  label: string
  value: string[]
  errorMessageWhenBlank: string
  onChange(value: string[]): void
}

const inputStyle: SxProps = { display: "block", mt: 0.5 }

export function StringArrayInput(props: Props) {
  const [insertingValue, setInsertingValue] = useState<string | null>(null)

  function onChange(newValue: string, targetIndex: number): void {
    return props.onChange(
      props.value.map((value, index) => {
        if (index === targetIndex) {
          return newValue
        } else {
          return value
        }
      }),
    )
  }

  function onKeyUp(e: KeyboardEvent<HTMLDivElement>): void {
    if (insertingValue !== null && e.key === "Enter") {
      props.onChange([...props.value, insertingValue])
      setInsertingValue(null)
    }
  }

  function onDeleteButtonClick(targetIndex: number) {
    props.onChange(props.value.filter((_, index) => index !== targetIndex))
  }

  function onAddButtonClick() {
    if (insertingValue !== null) {
      props.onChange([...props.value, insertingValue])
      setInsertingValue(null)
    }
  }

  return (
    <Box>
      <Typography variant="overline">{props.title}</Typography>
      {props.value.map((value, index) => (
        <NonBlankInput
          key={`${index}-${value}`}
          name={`${props.name}-${index}`}
          label={props.label}
          value={value}
          onChange={(newValue) => onChange(newValue, index)}
          errorMessageWhenBlank={props.errorMessageWhenBlank}
          fieldProps={{
            sx: inputStyle,
            InputProps: {
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Remove from the list">
                    <IconButton
                      aria-label="Remove"
                      onClick={() => onDeleteButtonClick(index)}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            },
          }}
        />
      ))}
      <NonBlankInput
        name={props.name}
        label={props.label}
        value={insertingValue}
        onChange={setInsertingValue}
        errorMessageWhenBlank={props.errorMessageWhenBlank}
        fieldProps={{
          onKeyUp,
          sx: inputStyle,
          InputProps: {
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Add to the list (you can also hit Submit)">
                  <IconButton
                    aria-label="Add"
                    onClick={() => onAddButtonClick()}
                  >
                    <Add />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  )
}
