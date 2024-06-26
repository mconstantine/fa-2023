import {
  Box,
  Button,
  CircularProgress,
  Stack,
  SxProps,
  Typography,
} from "@mui/material"
import { FormEvent, PropsWithChildren } from "react"
import * as NetworkResponse from "../../network/NetworkResponse"
import { green, red } from "@mui/material/colors"
import { Option, pipe } from "effect"
import { constNull } from "effect/Function"
import { HttpError } from "../../hooks/network"

interface Props {
  onSubmit(): void
  isValid(): boolean
  formError?: Option.Option<string>
  submitButtonLabel: string
  networkResponse: NetworkResponse.NetworkResponse<HttpError, unknown>
  cancelAction?: (() => void) | undefined
}

const successButtonSx: SxProps = {
  bgcolor: green[500],
  "&:hover": {
    bgcolor: green[700],
  },
}

const errorButtonSx: SxProps = {
  bgcolor: red[500],
  "&:hover": {
    bgcolor: red[700],
  },
}

function getButtonSx(
  response: NetworkResponse.NetworkResponse<unknown, unknown>,
): SxProps {
  return pipe(
    response,
    NetworkResponse.match({
      onIdle: () => ({}),
      onLoading: () => ({}),
      onFailure: () => errorButtonSx,
      onSuccess: () => successButtonSx,
    }),
  )
}

export default function Form(props: PropsWithChildren<Props>) {
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    props.onSubmit()
  }

  return (
    <form onSubmit={onSubmit}>
      <Stack spacing={3}>
        {props.children}
        <Box>
          {NetworkResponse.isFailure(props.networkResponse) ? (
            <Typography variant="body2" color="error" sx={{ mb: 1.5 }}>
              {props.networkResponse.error.message} (status{" "}
              {props.networkResponse.error.code})
            </Typography>
          ) : null}
          {typeof props.formError !== "undefined"
            ? pipe(
                props.formError,
                Option.match({
                  onNone: constNull,
                  onSome: (error) => (
                    <Typography color="error" variant="body2" sx={{ mb: 1.5 }}>
                      {error}
                    </Typography>
                  ),
                }),
              )
            : null}
          <Stack direction="row" spacing={1}>
            <Box sx={{ position: "relative", width: "fit-content" }}>
              <Button
                type="submit"
                variant="contained"
                sx={getButtonSx(props.networkResponse)}
                disabled={
                  !props.isValid() ||
                  NetworkResponse.isLoading(props.networkResponse)
                }
              >
                {props.submitButtonLabel}
              </Button>
              {NetworkResponse.isLoading(props.networkResponse) ? (
                <CircularProgress
                  size={24}
                  sx={{
                    display: "block",
                    color: green[500],
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    margin: "auto",
                  }}
                />
              ) : null}
            </Box>
            {(() => {
              if (typeof props.cancelAction !== "undefined") {
                return <Button onClick={props.cancelAction}>Cancel</Button>
              } else {
                return null
              }
            })()}
          </Stack>
        </Box>
      </Stack>
    </form>
  )
}
