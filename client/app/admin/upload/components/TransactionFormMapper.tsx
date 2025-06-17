import { UploadFileConfigFormValues } from "../model/UploadFile";

type TransactionFormMapperProps = {
  fileRows: string[][];
  formValues: UploadFileConfigFormValues;
};
export default function TransactionFormMapper(
  props: TransactionFormMapperProps
) {
  const { fileRows, formValues } = props;
for (let i = formValues.selectedRow as number; i < fileRows.length; i++) {
    console.log("Processing row:", i, fileRows[i]);
    // TODO: implement mapping logic
}
  console.log("TransactionFormMapper Props:", { fileRows, formValues });
  return <>Transaction Mapper Works!</>;
}
