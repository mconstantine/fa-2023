import { useEffect, useState } from "react"
import { PaginatedResponse } from "../../../globalDomain"
import { NetworkResponse } from "../../../network/NetworkResponse"
import { FindTransactionsParams, Transaction } from "../domain"
import { Category, FindCategoryParams } from "../../categories/domain"
import { useLazyQuery } from "../../../hooks/network"
import { useDebounce } from "../../../hooks/useDebounce"
import { Dialog, DialogContent } from "@mui/material"
import TransactionFiltersDialogContent from "./TransactionFiltersDialogContent"

interface Props {
  isOpen: boolean
  onOpenChange(isOpen: boolean): void
  findTransactionsNetworkResponse: NetworkResponse<
    PaginatedResponse<Transaction>
  >
  params: FindTransactionsParams
  onParamsChange(params: FindTransactionsParams): void
}

export default function TransactionFiltersDialog(props: Props) {
  const [categoriesQuery, setCategoriesQuery] = useState("")

  const [categoriesResponse, , fetchCategories] = useLazyQuery<
    Category[],
    FindCategoryParams
  >("/categories")

  const debounceFetchCategories = useDebounce(function search(query: string) {
    fetchCategories(query === "" ? {} : { query })
  }, 500)

  function onCategoriesQueryChange(query: string) {
    setCategoriesQuery(query)
    debounceFetchCategories(query)
  }

  function onFiltersChange(params: FindTransactionsParams): void {
    props.onParamsChange(params)
    props.onOpenChange(false)
  }

  useEffect(() => {
    if (props.isOpen && categoriesResponse.isIdle()) {
      fetchCategories({})
    }
  }, [props.isOpen, categoriesResponse, fetchCategories])

  return (
    <Dialog open={props.isOpen} onClose={() => props.onOpenChange(false)}>
      <DialogContent>
        <TransactionFiltersDialogContent
          params={props.params}
          onFiltersChange={onFiltersChange}
          transactionsNetworkResponse={props.findTransactionsNetworkResponse}
          categoriesNetworkResponse={categoriesResponse}
          categoriesSearchQuery={categoriesQuery}
          onCategoriesSearchQueryChange={onCategoriesQueryChange}
          onCancel={() => props.onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
