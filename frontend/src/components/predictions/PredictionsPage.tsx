import { useState } from "react"
import { useQuery } from "../../hooks/network"
import { CategoriesAggregation, CategoriesAggregationParams } from "./domain"
import { Container } from "@mui/material"
import Query from "../Query"
import PredictionsTable from "./PredictionsTable"

export default function PredictionsPage() {
  const [params] = useState<CategoriesAggregationParams>({
    year: new Date().getFullYear() - 1,
  })

  const [categoriesAggregation] = useQuery<
    CategoriesAggregationParams,
    CategoriesAggregation[]
  >("/transactions/categories/", params)

  return (
    <Container>
      <Query
        response={categoriesAggregation}
        render={(categoriesAggregation) => (
          <PredictionsTable categoriesAggregation={categoriesAggregation} />
        )}
      />
    </Container>
  )
}
