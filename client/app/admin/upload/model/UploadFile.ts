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
  [key: `column-${number}`]: string;
  account: string;
  selectedRow: number | "";
  calculatedTransactionType: boolean;
} & DynamicColumns;

export type UploadFileConfigFormState = Partial<
  FormState<UploadFileConfigFormValues>
> & {
  values: UploadFileConfigFormValues;
};
