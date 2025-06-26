import { FormState } from "react-hook-form";

export type UploadFileConfigFormProps = {
  maxLength: number;
  selectedRow: number | null;
  onFormChange: (formState: UploadFileConfigFormState) => void;
};

export type DynamicColumns = {
  [key: `column-${number}`]: string;
};

export type UploadFileConfigFormValues = {
  date: string | FromIndex
  description: string | FromIndex
  amount: number | FromIndex
  account: string;
  selectedRow: number | "";
  calculatedTransactionType: boolean;
};

export type UploadFileConfigFormState = Partial<
  FormState<UploadFileConfigFormValues>
> & {
  values: UploadFileConfigFormValues;
};

export type FromIndex = {fromIndex: number}

export function isFromIndex(value: unknown): value is FromIndex {
  return !!value && typeof value === "object" && !!("fromIndex" in value);
}

export type UploadFileConfigOptions = "date" | "description" | "amount";

export const columnOptions = [
    { key: "date", label: "Date" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount" },
  ];
