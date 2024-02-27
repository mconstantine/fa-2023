import {
  IconButton,
  InputAdornment,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material"
import { KeyboardEvent, useState } from "react"
import { Add, Delete } from "@mui/icons-material"
import { InputProps } from "../../../hooks/useForm"
import TextInput from "./TextInput"
import { Either, Option, pipe } from "effect"

interface Props extends InputProps<readonly string[], readonly string[]> {
  title: string
  label: string
}

export function StringArrayInput(props: Props) {
  const [insertingValue, setInsertingValue] = useState<string | null>(null)

  function onChange(
    newValue: string,
    targetIndex: number,
  ): Either.Either<string, readonly string[]> {
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

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>): void {
    if (insertingValue !== null && e.key === "Enter") {
      e.preventDefault()
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
    <Stack spacing={1.5}>
      <Typography variant="overline">{props.title}</Typography>
      {props.value.map((value, index) => (
        <TextInput
          key={index}
          name={`${props.name}-${index}`}
          label={props.label}
          value={value}
          onChange={(newValue) => onChange(newValue, index)}
          error={pipe(
            props.error,
            Option.map(() => ""),
          )}
          fieldProps={{
            sx: { display: "block" },
            onKeyDown,
            InputProps: {
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Remove from the list">
                    <span>
                      <IconButton
                        aria-label="Remove"
                        onClick={() => onDeleteButtonClick(index)}
                      >
                        <Delete />
                      </IconButton>
                    </span>
                  </Tooltip>
                </InputAdornment>
              ),
            },
          }}
        />
      ))}
      <TextInput
        name={props.name}
        label={props.label}
        value={insertingValue ?? ""}
        onChange={(value) => {
          setInsertingValue(value)
          return Either.right(value)
        }}
        error={Option.none()}
        fieldProps={{
          sx: { display: "block" },
          onKeyDown,
          InputProps: {
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Add to the list (you can also hit Submit)">
                  <span>
                    <IconButton
                      aria-label="Add"
                      onClick={() => onAddButtonClick()}
                      disabled={Option.isSome(props.error)}
                    >
                      <Add />
                    </IconButton>
                  </span>
                </Tooltip>
              </InputAdornment>
            ),
          },
        }}
      />
    </Stack>
  )
}
