import * as S from "@effect/schema/Schema"
import { Dialog, DialogContent, Stack, Typography } from "@mui/material"
import {
  NetworkResponse,
  networkResponse,
} from "../../../network/NetworkResponse"
import { TransactionWithCategories, UpdateTransactionsInput } from "../domain"
import { useForm } from "../../../hooks/useForm"
import Form from "../../forms/Form"
import ValidatedSelect from "../../forms/inputs/ValidatedSelect"
import TextInput from "../../forms/inputs/TextInput"

interface Props {
  isOpen: boolean
  onClose(): void
  updateNetworkResponse: NetworkResponse<readonly TransactionWithCategories[]>
  onUpdate(data: Omit<UpdateTransactionsInput, "ids">): Promise<boolean>
}

export default function BulkUpdateTransactionsDialog(props: Props) {
  // const {
  //   categories,
  //   searchQuery,
  //   onSearchQueryChange,
  //   selection,
  //   onSelectionChange,
  // } = useCategorySelect({
  //   visible: props.isOpen,
  //   multiple: true,
  //   creatable: true,
  //   initialValue: [],
  //   categoriesQuery,
  //   createCategoryCommand,
  //   bulkCreateCategoriesCommand,
  // })

  const { inputProps, submit, isValid } = useForm({
    initialValues: {
      description: "",
      categoryUpdateMode: "replace",
    },
    validators: {
      description: S.Trim.pipe(
        S.nonEmpty({ message: () => "The description cannot be empty" }),
      ),
      categoryUpdateMode: S.literal("add", "replace"),
    },
    submit: (data) => {
      /*
      if (data.description !== "" || selection.length > 0) {
        onBulkUpdateSubmit({
          ...(data.description !== ""
            ? {
                description: data.description,
              }
            : {}),
          ...(selection.length > 0
            ? {
                categoryIds: selection.map((category) => category.id),
              }
            : {}),
          categoryUpdateMode: data.categoryUpdateMode,
        })
      } else {
        props.onClose(false)
      }
      */
      console.log("TODO:", { data })
    },
  })

  return (
    <Dialog open={props.isOpen} onClose={props.onClose}>
      <DialogContent>
        <Stack spacing={1.5}>
          <Typography variant="h5">Update transactions</Typography>
          <Form
            onSubmit={submit}
            // TODO:
            networkResponse={networkResponse.make()}
            submitButtonLabel="Save"
            cancelAction={props.onClose}
            isValid={isValid}
          >
            <TextInput {...inputProps("description")} label="Description" />
            {/* <CategorySelect
              creatable
              multiple
              categories={categories}
              searchQuery={searchQuery}
              onSearchQueryChange={onSearchQueryChange}
              selection={selection}
              onSelectionChange={onSelectionChange}
            /> */}
            <ValidatedSelect
              label="Categories update mode"
              {...inputProps("categoryUpdateMode")}
              options={{
                add: "Add categories",
                replace: "Replace categories",
              }}
            />
          </Form>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
