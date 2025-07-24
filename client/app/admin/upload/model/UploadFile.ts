import { FormState } from "react-hook-form";

export type UploadFileConfigFormProps = {
  maxLength: number;
  rows: string[][];
  onFormChange: (formState : UploadFileConfigFormState) => void;
};

export type DynamicColumns = {
  [key: `column-${number}`]: string;
};

export type UploadFileConfigFormValues = {
  date: string | FromIndex
  dateFormat?: DateParseFormat;
  description: string | FromIndex
  amount: number | FromIndex
  account: string;
  selectedRow: number | "";
  calculatedTransactionType: boolean;
};

export type UploadFileConfigFormState = Partial<FormState<UploadFileConfigFormValues>> & {values: UploadFileConfigFormValues, name?: string}

export type FromIndex = {fromIndex: number}

export function isFromIndex(value: unknown): value is FromIndex {
  return !!value && typeof value === "object" && !!("fromIndex" in value);
}

export type UploadFileConfigOptions = "date" | "description" | "amount";

export type DateParseFormat = "DDMMYYYY" | "MMDDYYYY" | "YYYYMMDD";

export const dateParseOptions: DateParseFormat[] = [
  "DDMMYYYY",
  "MMDDYYYY",
  "YYYYMMDD",
]


export const columnOptions = [
    { key: "date", label: "Date" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount" },
  ];
