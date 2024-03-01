import { Client } from "pg"

const oldDb = new Client({
  host: "db",
  port: 5432,
  user: "postgres",
  password: "postgres",
  database: "fa_2023",
})

const newDb = new Client({
  host: "db",
  port: 5432,
  user: "postgres",
  password: "postgres",
  database: "playground",
})

;(async () => {
  await oldDb.connect()
  await newDb.connect()

  // Categories
  {
    const categories = await oldDb.query("select * from category")

    await newDb.query("begin")
    await newDb.query("delete from category")

    await Promise.all(
      categories.rows.map(async (c) => {
        await newDb.query(
          "insert into category (id, name, is_meta) values ($1, $2, $3)",
          [c.id, c.name, c.isMeta],
        )
      }),
    )

    await newDb.query("end")
  }

  // Transactions
  {
    const transactions = await oldDb.query("select * from transaction")

    await newDb.query("begin")
    await newDb.query("delete from transaction")

    await Promise.all(
      transactions.rows.map(async (t) => {
        await newDb.query(
          "insert into transaction (id, description, value, date) values ($1, $2, $3, $4)",
          [t.id, t.description, t.value, t.date],
        )
      }),
    )

    await newDb.query("end")
  }

  // Transactions categories
  {
    const entries = await oldDb.query(
      "select * from transaction_categories_category",
    )

    await newDb.query("begin")
    await newDb.query("delete from transactions_categories")

    await Promise.all(
      entries.rows.map(async (e) => {
        await newDb.query(
          "insert into transactions_categories (transaction_id, category_id) values ($1, $2)",
          [e.transactionId, e.categoryId],
        )
      }),
    )

    await newDb.query("end")
  }

  // Budgets
  {
    const budgets = await oldDb.query("select * from prediction")

    await newDb.query("begin")
    await newDb.query("delete from budget")

    await Promise.all(
      budgets.rows.map(async (b) => {
        await newDb.query(
          "insert into budget (id, year, value, category_id) values ($1, $2, $3, $4)",
          [b.id, b.year, b.value, b.categoryId],
        )
      }),
    )

    await newDb.query("end")
  }

  await oldDb.end()
  await newDb.end()
})().then(
  () => process.exit(),
  (error) => {
    console.log(error)
    process.exit()
  },
)
