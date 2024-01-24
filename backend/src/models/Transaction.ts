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
import { type Result, result } from "../Result"

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

  @ManyToMany(() => Category, (category) => category.transactions, {
    eager: true,
  })
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

          if (importResult.isFailure()) {
            errors.push(importResult.error)
          } else {
            transactions.push(importResult.value)
          }

          return { transactions, errors }
        },
        { transactions: [], errors: [] },
      )

    if (errors.length > 0) {
      return result.fromFailure(errors)
    } else {
      return result.fromSuccess(transactions)
    }
  }
}
