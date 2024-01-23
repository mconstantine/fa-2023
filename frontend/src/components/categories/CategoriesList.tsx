import {
  Backdrop,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
import CategoryCard from "./CategoryCard"
import { Category } from "./domain"
import { useState } from "react"
import { NetworkResponse, networkResponse } from "../../network/NetworkResponse"
import Query from "../Query"
import CategoryForm from "./CategoryForm"
import { useConfirmation } from "../../hooks/useConfirmation"

interface ReadingMode {
  type: "reading"
}

interface CreatingMode {
  type: "creating"
}

interface UpdatingMode {
  type: "updating"
  category: Category
}

type Mode = ReadingMode | CreatingMode | UpdatingMode

interface Props {
  readingResponse: NetworkResponse<Category[]>
  creationResponse: NetworkResponse<Category>
  updateResponse: NetworkResponse<Category>
  deletionResponse: NetworkResponse<Category>
  onCategoryCreate(category: Category): Promise<boolean>
  onCategoryUpdate(category: Category): Promise<boolean>
  onCategoryDelete(category: Category): Promise<boolean>
}

export default function CategoriesList(props: Props) {
  const [mode, setMode] = useState<Mode>({ type: "reading" })
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  )

  const [onCategoryDeleteButtonClick, deleteConfirmationDialog] =
    useConfirmation(onCategoryDelete, (category) => ({
      title: "Warning! One way decision",
      message: `Are you sure you want delete category "${category.name}"? The category will be lost forever!`,
    }))

  const isBackdropOpen: boolean = (() => {
    switch (mode.type) {
      case "reading":
        return false
      case "creating":
      case "updating":
        return true
    }
  })()

  function onAddCategoryButtonClick() {
    setMode({ type: "creating" })
  }

  function onCategoryEditButtonClick(category: Category): void {
    setMode({ type: "updating", category })
  }

  function cancel() {
    setMode({ type: "reading" })
  }

  function onSubmit(category: Category): void {
    switch (mode.type) {
      case "creating":
        props.onCategoryCreate(category).then((result) => {
          if (result) {
            setMode({ type: "reading" })
          }
        })
        return
      case "updating":
        props.onCategoryUpdate(category).then((result) => {
          if (result) {
            setMode({ type: "reading" })
          }
        })
        return
      case "reading":
        return
    }
  }

  function onCategoryDelete(category: Category) {
    setDeletingCategory(category)
    props.onCategoryDelete(category)
  }

  return (
    <>
      <Container>
        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          <Paper
            sx={{
              mt: 1.5,
              p: 1.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h5">Categories</Typography>
            <Button onClick={onAddCategoryButtonClick}>Add category</Button>
          </Paper>
          <Query
            response={props.readingResponse}
            render={(categories) => (
              <Stack spacing={1.5}>
                {categories.map((category) => {
                  const card = (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onEditButtonClick={() =>
                        onCategoryEditButtonClick(category)
                      }
                      onDeleteButtonClick={() =>
                        onCategoryDeleteButtonClick(category)
                      }
                    />
                  )

                  if (
                    deletingCategory !== null &&
                    deletingCategory.id === category.id
                  ) {
                    return (
                      <Query
                        key={category.id}
                        response={props.deletionResponse}
                        render={() => card}
                      />
                    )
                  } else {
                    return card
                  }
                })}
              </Stack>
            )}
          />
        </Stack>
        <Backdrop open={isBackdropOpen}>
          <Paper sx={{ pt: 3, pb: 3, pl: 1.5, pr: 1.5 }}>
            <CategoryForm
              key={mode.type}
              category={(() => {
                switch (mode.type) {
                  case "reading":
                  case "creating":
                    return null
                  case "updating":
                    return mode.category
                }
              })()}
              onSubmit={onSubmit}
              networkResponse={(() => {
                switch (mode.type) {
                  case "creating":
                    return props.creationResponse
                  case "updating":
                    return props.updateResponse
                  case "reading":
                    return networkResponse.make()
                }
              })()}
              cancelAction={cancel}
            />
          </Paper>
        </Backdrop>
      </Container>
      {deleteConfirmationDialog}
    </>
  )
}
