import { IsNotEmpty } from "class-validator"
import {
  BaseEntity,
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm"
import { Transaction } from "./Transaction"
import { Prediction } from "./Prediction"

@Entity()
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  public id!: string

  @Column()
  @IsNotEmpty()
  public name!: string

  @Column({ type: "simple-array", default: "" })
  public keywords!: string[]

  @ManyToMany(() => Transaction, (transaction) => transaction.categories)
  public transactions!: Relation<Transaction[]>

  @OneToMany(() => Prediction, (prediction) => prediction.category)
  public predictions!: Relation<Prediction[]>
}
