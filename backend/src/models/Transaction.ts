import { IsNotEmpty } from "class-validator"
import {
  BaseEntity,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm"
import { Category } from "./Category"
import { Source } from "../adapters/Source"
import { BankAdapter } from "../adapters/BankAdapter"
import { PayPalAdapter } from "../adapters/PayPalAdapter"
import { type ImportError } from "../adapters/Adapter"
import { Result } from "../Result"

interface ImportFileResults {
  transactions: Transaction[]
  errors: ImportError[]
}

@Entity()
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  public id!: string

  @Column()
  @IsNotEmpty()
  public description!: string

  @Column({
    type: "int",
    transformer: {
      from(n: number) {
        return n / 100
      },
      to(n: number) {
        return Math.floor(n * 100)
      },
    },
  })
  public value!: number

  @Column("date")
  public date!: Date

  @ManyToMany(() => Category, (category) => category.transactions)
  @JoinTable()
  public categories!: Relation<Category[]>

  static importFile(
    csvFileContent: string,
    source: Source,
  ): Result<ImportError[], Transaction[]> {
    const adapter = (() => {
      switch (source) {
        case Source.BANK:
          return BankAdapter
        case Source.PAYPAL:
          return PayPalAdapter
      }
    })()

    const { transactions, errors } = csvFileContent
      .split("\n")
      .slice(1)
      .filter((row) => row !== "")
      .reduce<ImportFileResults>(
        ({ transactions, errors }, row) => {
          const importResult = adapter.fromString(row)

          importResult.match(
            (error) => {
              errors.push(error)
            },
            (transaction) => {
              transactions.push(transaction)
            },
          )

          return { transactions, errors }
        },
        { transactions: [], errors: [] },
      )

    if (errors.length > 0) {
      return Result.fromFailure(errors)
    } else {
      return Result.fromSuccess(transactions)
    }
  }
}
