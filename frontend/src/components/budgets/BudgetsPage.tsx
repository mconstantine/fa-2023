import * as NetworkResponse from "../../network/NetworkResponse"
import * as S from "@effect/schema/Schema"
import BudgetsTable from "./BudgetsTable"
import {
  Button,
  Container,
  Dialog,
  DialogContent,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
import {
  HttpError,
  useCommand,
  useQuery,
  useRequestData,
} from "../../hooks/network"
import {
  aggregateTransactionsByCategoryRequest,
  deleteBudgetRequest,
  insertBudgetRequest,
  insertBudgetsRequest,
  listBudgetsRequest,
  updateBudgetRequest,
  updateBudgetsRequest,
} from "./api"
import { useMemo, useState } from "react"
import ValidatedSelect from "../forms/inputs/ValidatedSelect"
import { Boolean, Either, Option, pipe } from "effect"
import { constVoid, identity } from "effect/Function"
import Query from "../Query"
import { BudgetWithCategory, InsertBudgetInput } from "./domain"
import { useConfirmation } from "../../hooks/useConfirmation"
import InsertBudgetForm from "./InsertBudgetForm"

export default function BudgetsPage() {
  const [insertDialogIsOpen, setInsertDialogOpen] = useState(false)

  const [filters, setFilters] = useRequestData<typeof listBudgetsRequest>(
    listBudgetsRequest,
    {
      query: {
        year: new Date().getFullYear(),
      },
    },
  )

  const yearBeforeFilters = useMemo(
    () => ({
      query: {
        year: filters.query.year - 1,
      },
    }),
    [filters],
  )

  const [budgets, updateLocalBudgets] = useQuery(listBudgetsRequest, filters)

  const [transactionsByCategory] = useQuery(
    aggregateTransactionsByCategoryRequest,
    yearBeforeFilters,
  )

  const [newBudget, insertBudget] = useCommand(insertBudgetRequest)
  const [newBudgets, insertBudgets] = useCommand(insertBudgetsRequest)
  const [updatedBudget, updateBudget] = useCommand(updateBudgetRequest)
  const [updatedBudgets, updateBudgets] = useCommand(updateBudgetsRequest)
  const [deletedBudget, deleteBudget] = useCommand(deleteBudgetRequest)

  const [onDeleteBudgetButtonClick, deleteBudgetConfirmationDialog] =
    useConfirmation(onBudgetDelete, (budget) => ({
      title: "Are you sure?",
      message: `Are you sure you want to delete the budget for ${pipe(
        budget.category,
        Option.map((category) => `the "${category.name}" category`),
        Option.getOrElse(() => "uncategorized transactions"),
      )}? This cannot be undone!`,
    }))

  const yearOptions: Record<string, string> = useMemo(() => {
    const min = 2023
    const max = new Date().getFullYear()

    const options = new Array(max - min)
      .fill(null)
      .map((_, index) => min + index)

    const labels = options.reduce((result, year) => {
      result[(year + 1).toString(10)] = `${year.toString(10)}/${(
        year + 1
      ).toString(10)}`

      return result
    }, {} as Record<string, string>)

    return labels
  }, [])

  function onYearChange(year: string) {
    pipe(
      year,
      S.decodeOption(S.NumberFromString.pipe(S.int()).pipe(S.positive())),
      Option.match({
        onNone: constVoid,
        onSome: (n) => {
          console.log(n + 1)
          setFilters({
            query: {
              year: n,
            },
          })
        },
      }),
    )

    return Either.right(year)
  }

  async function onBudgetInsert(body: InsertBudgetInput): Promise<void> {
    const result = await insertBudget({ body })

    pipe(
      result,
      Either.match({
        onLeft: constVoid,
        onRight: (newBudget) => {
          updateLocalBudgets((budgets) => [newBudget, ...budgets])
          setInsertDialogOpen(false)
        },
      }),
    )
  }

  async function onBudgetUpdate(
    data: BudgetWithCategory | InsertBudgetInput,
  ): Promise<void> {
    if ("id" in data) {
      const { id, ...body } = data
      const result = await updateBudget({ params: { id }, body })

      pipe(
        result,
        Either.match({
          onLeft: constVoid,
          onRight: (updated) => {
            updateLocalBudgets((budgets) =>
              budgets.map((budget) => {
                if (budget.id === updated.id) {
                  return updated
                } else {
                  return budget
                }
              }),
            )
          },
        }),
      )
    } else {
      return onBudgetInsert(data)
    }
  }

  async function onBudgetsUpdate(
    data: Array<BudgetWithCategory | InsertBudgetInput>,
  ): Promise<void> {
    const created = data.filter(
      (entry) => !("id" in entry),
    ) as InsertBudgetInput[]

    const updated = data.filter(
      (entry) => "id" in entry,
    ) as BudgetWithCategory[]

    const insertionResult: Either.Either<
      HttpError,
      readonly BudgetWithCategory[]
    > = await pipe(
      created.length > 0,
      Boolean.match({
        onFalse: () => Promise.resolve(Either.right([])),
        onTrue: async () => await insertBudgets({ body: created }),
      }),
    )

    if (Either.isLeft(insertionResult)) {
      return
    }

    const updateResult: Either.Either<
      HttpError,
      readonly BudgetWithCategory[]
    > = await pipe(
      updated.length > 0,
      Boolean.match({
        onFalse: () => Promise.resolve(Either.right([])),
        onTrue: async () => await updateBudgets({ body: updated }),
      }),
    )

    return pipe(
      { insertionResult, updateResult },
      Either.all,
      Either.match({
        onLeft: constVoid,
        onRight: ({ insertionResult, updateResult }) => {
          updateLocalBudgets((budgets) => [
            ...insertionResult,
            ...budgets.map((budget) =>
              pipe(
                updateResult.find((updated) => updated.id === budget.id),
                Option.fromNullable,
                Option.match({
                  onNone: () => budget,
                  onSome: identity,
                }),
              ),
            ),
          ])
        },
      }),
    )
  }

  async function onBudgetDelete(deleted: BudgetWithCategory): Promise<void> {
    const result = await deleteBudget({
      params: { id: deleted.id },
    })

    pipe(
      result,
      Either.match({
        onLeft: constVoid,
        onRight: (deleted) =>
          updateLocalBudgets((budgets) =>
            budgets.filter((budget) => budget.id !== deleted.id),
          ),
      }),
    )
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
            <Typography variant="h5">Budgets</Typography>
            <Stack direction="row" spacing={1.5}>
              <Button onClick={() => setInsertDialogOpen(true)}>
                Create budget
              </Button>
              <ValidatedSelect
                name="year"
                value={filters.query.year.toString()}
                options={yearOptions}
                onChange={onYearChange}
                error={Option.none()}
              />
            </Stack>
          </Paper>
          <Query
            response={pipe(
              { budgets, transactionsByCategory },
              NetworkResponse.all,
              NetworkResponse.withErrorFrom(deletedBudget),
              NetworkResponse.withErrorFrom(updatedBudget),
              NetworkResponse.withErrorFrom(newBudgets),
              NetworkResponse.withErrorFrom(updatedBudgets),
            )}
            render={({ budgets, transactionsByCategory }) => (
              <BudgetsTable
                year={filters.query.year}
                budgets={budgets}
                transactionsByCategory={transactionsByCategory}
                onBudgetUpdate={onBudgetUpdate}
                onBudgetsUpdate={onBudgetsUpdate}
                onBudgetDelete={onDeleteBudgetButtonClick}
                isLoading={
                  NetworkResponse.isLoading(newBudget) ||
                  NetworkResponse.isLoading(deletedBudget) ||
                  NetworkResponse.isLoading(updatedBudget)
                }
              />
            )}
          />
        </Stack>
        <Dialog
          open={insertDialogIsOpen}
          onClose={() => setInsertDialogOpen(false)}
        >
          <DialogContent>
            <InsertBudgetForm
              year={filters.query.year}
              networkResponse={newBudget}
              onSubmit={onBudgetInsert}
              onCancel={() => setInsertDialogOpen(false)}
              excludedCategoriesIds={pipe(
                budgets,
                NetworkResponse.map((budgets) =>
                  budgets.map((budget) => Option.getOrNull(budget.category_id)),
                ),
                NetworkResponse.getOrElse(() => []),
              )}
            />
          </DialogContent>
        </Dialog>
      </Container>
      {deleteBudgetConfirmationDialog}
    </>
  )
}
