import {
  HttpError,
  JsonController,
  Post,
  UploadedFiles,
} from "routing-controllers"
import { Transaction } from "../models/Transaction"
import { Source } from "../adapters/Source"
import { Result } from "../Result"
import { type ImportError } from "../adapters/Adapter"

interface ImportResponse {
  errors: string[]
}

@JsonController("/transactions")
export class TransactionController {
  @Post("/import")
  public async import(
    @UploadedFiles("files", { required: true }) files: Express.Multer.File[],
  ): Promise<ImportResponse> {
    const bankFile = files.find(
      (file) => file.originalname.toLowerCase() === "bank.csv",
    )

    const paypalFile = files.find(
      (file) => file.originalname.toLowerCase() === "paypal.csv",
    )

    if (typeof bankFile === "undefined" || typeof paypalFile === "undefined") {
      throw new HttpError(
        422,
        "The files should be named bank.csv and paypal.csv",
      )
    }

    const bankFileContent = (() => {
      try {
        return bankFile.buffer.toString("utf8")
      } catch (e) {
        throw new HttpError(
          400,
          "The file bank.csv is not properly encoded to UTF-8",
        )
      }
    })()

    const paypalFileContent = (() => {
      try {
        return paypalFile.buffer.toString("utf-8")
      } catch (e) {
        throw new HttpError(
          400,
          "The file paypal.csv is not properly encoded to UTF-8",
        )
      }
    })()

    const results = {
      bank: Transaction.importFile(bankFileContent, Source.BANK),
      paypal: Transaction.importFile(paypalFileContent, Source.PAYPAL),
    }

    const importResult = Result.merge<ImportError[], typeof results>(results)

    if (importResult.isFailure()) {
      return {
        errors: importResult.error.map(
          (error) => `${error.type}: ${error.subject}`,
        ),
      }
    }

    const result = importResult.unsafeGetValue()
    console.log(result)

    return { errors: [] }
  }
}
