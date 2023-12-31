import { Transaction } from "../models/Transaction"
import { Adapter, Source } from "./Adapter"

export class PayPalAdapter extends Adapter {
  public override readonly name = Source.PAYPAL

  public static override fromString(_input: string): Transaction {
    return new Transaction()
  }
}
