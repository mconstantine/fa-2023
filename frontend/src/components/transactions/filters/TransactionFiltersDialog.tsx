import { useState } from "react"
import { NetworkResponse } from "../../../network/NetworkResponse"
import { useLazyQuery } from "../../../hooks/network"
import { useDebounce } from "../../../hooks/useDebounce"
import { Dialog, DialogContent } from "@mui/material"
import TransactionFiltersDialogContent from "./TransactionFiltersDialogContent"
import { PaginationResponse } from "../../../globalDomain"
import { listCategoriesRequest } from "../../categories/api"
import { ListTransactionsInput, TransactionWithCategories } from "../domain"

interface Props {
  isOpen: boolean
  onClose(): void
  listTransactionsResponse: NetworkResponse<
    PaginationResponse<TransactionWithCategories>
  >
  filters: ListTransactionsInput
  onFiltersChange(filters: ListTransactionsInput): void
}

export default function TransactionFiltersDialog(props: Props) {
  const [categoriesQuery, setCategoriesQuery] = useState("")

  const [categories, fetchCategories] = useLazyQuery(listCategoriesRequest)

  const debounceFetchCategories = useDebounce(function search(query: string) {
    fetchCategories({
      query: {
        direction: "forward",
        count: 25,
        ...(query === "" ? {} : { search_query: query }),
      },
    })
  }, 500)

  function onCategoriesQueryChange(query: string) {
    setCategoriesQuery(query)
    debounceFetchCategories(query)
  }

  function onFiltersChange(filters: ListTransactionsInput): void {
    props.onFiltersChange(filters)
    props.onClose()
  }

  // TODO: maybe useless?
  // useEffect(() => {
  //   if (props.isOpen && categories.isIdle()) {
  //     fetchCategories({
  //       query: {
  //         direction: "forward",
  //         count: 100,
  //       },
  //     })
  //   }
  // }, [props.isOpen, categories, fetchCategories])

  return (
    <Dialog open={props.isOpen} onClose={() => props.onClose()}>
      <DialogContent>
        <TransactionFiltersDialogContent
          filters={props.filters}
          onFiltersChange={onFiltersChange}
          listTransactionsResponse={props.listTransactionsResponse}
          listCategoriesResponse={categories}
          categoriesSearchQuery={categoriesQuery}
          onCategoriesSearchQueryChange={onCategoriesQueryChange}
          onCancel={() => props.onClose()}
        />
      </DialogContent>
    </Dialog>
  )
}
