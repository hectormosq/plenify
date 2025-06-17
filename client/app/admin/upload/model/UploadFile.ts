import { FormState } from "react-hook-form";

export type UploadFileConfigFormProps = {
  maxLength: number;
  selectedRow: number | null;
  onFormChange: (formState: FormState<UploadFileConfigFormValues>) => void;
};

export type DynamicColumns = {
  [key: `column-${number}`]: string;
};

export type UploadFileConfigFormValues = {
  [key: `column-${number}`]: string;
  account: string;
  calculatedTransactionType: boolean;
} & DynamicColumns;