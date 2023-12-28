import {
  Backdrop,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
import { useCommand, useQuery } from "../../hooks/network"
import Query from "../Query"
import CategoriesList from "./CategoriesList"
import { Category } from "./domain"
import { useState } from "react"
import CategoryForm from "./CategoryForm"
import { NetworkResponse } from "../../network/NetworkResponse"

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

export default function CategoriesPage() {
  const [mode, setMode] = useState<Mode>({ type: "reading" })
  const [fetchResponse, updateCategories] = useQuery<Category[]>("/categories/")

  const [updateResponse, updateCategory] = useCommand<Category, Category>(
    "PUT",
    "/categories/",
  )

  const [creationResponse, createCategory] = useCommand<Category, Category>(
    "POST",
    "/categories/",
  )

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

  function onSubmit(updatedCategory: Category): void {
    switch (mode.type) {
      case "reading":
        return
      case "creating": {
        createCategory(updatedCategory).then((category) => {
          if (category !== null) {
            updateCategories((categories) => [category, ...categories])
            setMode({ type: "reading" })
          }
        })

        return
      }
      case "updating": {
        updateCategory(updatedCategory).then((category) => {
          if (category !== null) {
            updateCategories((categories) =>
              categories.map((category) => {
                if (category.id === updatedCategory.id) {
                  return updatedCategory
                } else {
                  return category
                }
              }),
            )

            setMode({ type: "reading" })
          }
        })
      }
    }
  }

  function cancel() {
    setMode({ type: "reading" })
  }

  return (
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
          response={fetchResponse}
          render={(categories) => (
            <CategoriesList
              categories={categories}
              onEditButtonClick={onCategoryEditButtonClick}
            />
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
                  return creationResponse
                case "updating":
                  return updateResponse
                case "reading":
                  return new NetworkResponse()
              }
            })()}
            cancelAction={cancel}
          />
        </Paper>
      </Backdrop>
    </Container>
  )
}
