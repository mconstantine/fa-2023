import { Stack, Typography } from "@mui/material"
import { useForm } from "../../hooks/useForm"
import { PredictionCreationBody } from "./domain"
import Form from "../forms/Form"
import { networkResponse } from "../../network/NetworkResponse"
import CategorySelect from "../forms/inputs/CategorySelect"
import NumberInput from "../forms/inputs/NumberInput"
import { useEffect, useState } from "react"
import { Category, FindCategoryParams } from "../categories/domain"
import { useLazyQuery } from "../../hooks/network"

interface Props {
  isVisible: boolean
}

export default function PredictionCreationForm(props: Props) {
  const [searchQuery, setSearchQuery] = useState("")

  const [categoriesResponse, , fetchCategories] = useLazyQuery<
    Category[],
    FindCategoryParams
  >("/categories")

  const { inputProps, submit, isValid } = useForm<PredictionCreationBody>(
    {
      // TODO: this should come from props
      year: 2023,
      category: null,
      value: 0,
    },
    (data) => console.log("TODO: create prediction", data),
  )

  function onCategorySearchQueryChange(query: string): void {
    setSearchQuery(query)
    fetchCategories(query === "" ? {} : { query })
  }

  useEffect(() => {
    if (props.isVisible && categoriesResponse.isIdle()) {
      fetchCategories({})
    }
  }, [props.isVisible, categoriesResponse, fetchCategories])

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Create prediction</Typography>
      <Form
        onSubmit={submit}
        isValid={isValid}
        // TODO: this should come from props
        networkResponse={networkResponse.make()}
        submitButtonLabel="Save"
      >
        <CategorySelect
          multiple={false}
          creatable
          networkResponse={categoriesResponse}
          searchQuery={searchQuery}
          onSearchQueryChange={onCategorySearchQueryChange}
          selection={null}
          // TODO:
          onSubmit={() => {}}
        />

        <NumberInput
          {...inputProps("value", 0)}
          label="Value"
          errorMessage="The value of a prediction should be a number"
        />
      </Form>
    </Stack>
  )
}
