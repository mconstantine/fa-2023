import { IsNotEmpty } from "class-validator"
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm"
import { Category } from "./Category"
import { Source } from "../adapters/Source"
import {
  BankAdapter,
  BankAdapterError,
  BankAdapterErrorType,
} from "../adapters/BankAdapter"
import { PayPalAdapter } from "../adapters/PayPalAdapter"

interface ImportFileResults {
  result: Transaction[]
  errors: string[]
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

  @ManyToOne(() => Category, {
    nullable: true,
    onDelete: "SET NULL",
    onUpdate: "NO ACTION",
  })
  public category: Relation<Category> | null = null

  static async importFile(
    csvFileContent: string,
    source: Source,
  ): Promise<ImportFileResults> {
    const adapter = (() => {
      switch (source) {
        case Source.BANK:
          return BankAdapter
        case Source.PAYPAL:
          return PayPalAdapter
      }
    })()

    return csvFileContent
      .split("\n")
      .slice(1)
      .filter((row) => row !== "")
      .reduce<ImportFileResults>(
        ({ result, errors }, row) => {
          try {
            result.push(adapter.fromString(row))
          } catch (e) {
            if (e instanceof BankAdapterError) {
              errors.push(
                (() => {
                  switch (e.type) {
                    case BankAdapterErrorType.INVALID_ROW:
                      return `Inavlid row: ${row}`
                    case BankAdapterErrorType.INVALID_DATE:
                      return `Invalid date: ${row}`
                    case BankAdapterErrorType.NO_VALUE:
                      return `No value: ${row}`
                  }
                })(),
              )
            } else {
              throw e
            }
          }

          return { result, errors }
        },
        { result: [], errors: [] },
      )
  }
}
