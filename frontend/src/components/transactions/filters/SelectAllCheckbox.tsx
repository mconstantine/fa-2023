import { Checkbox, FormControlLabel, Tooltip } from "@mui/material"
import { ChangeEvent } from "react"

interface Props {
  allIsSelected: boolean
  selectedCount: number
  onSelectAllChange(allIsSelected: boolean): void
}

export default function SelectAllCheckbox(props: Props) {
  function onSelectAllChange(
    _: ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ): void {
    props.onSelectAllChange(checked)
  }

  return (
    <Tooltip title="Select all">
      {props.selectedCount > 0 ? (
        <FormControlLabel
          control={
            <Checkbox
              aria-label="Select all"
              checked={props.allIsSelected}
              onChange={onSelectAllChange}
            />
          }
          label={`${props.selectedCount} selected`}
        />
      ) : (
        <Checkbox
          aria-label="Select all"
          value={props.allIsSelected}
          onChange={onSelectAllChange}
        />
      )}
    </Tooltip>
  )
}
