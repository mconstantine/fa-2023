import { JsonController, Post, UploadedFiles } from "routing-controllers"
import { type Transaction } from "../models/Transaction"

@JsonController("/transactions")
export class TransactionController {
  @Post("/import")
  public async import(
    @UploadedFiles("files") files: Express.Multer.File[],
  ): Promise<Transaction[]> {
    console.log(files)
    return []
  }
}
