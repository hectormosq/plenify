import { Controller, useForm } from "react-hook-form";
import classes from "./UploadFileConfigForm.module.scss";
import { Checkbox, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { ErrorMessage } from "@hookform/error-message";
import StyledSelect from "@/app/components/inputs/StyledSelect";

type UploadFileConfigFormProps = {
  maxLength: number;
  selectedRow: number | null;
};

type DynamicColumns = {
  [key: `column-${number}`]: string;
};

type UploadFileConfigFormValues = {
  [key: `column-${number}`]: string;
  account: string;
  calculatedTransactionType: boolean;
} & DynamicColumns;

export default function UploadFileConfigForm(props: UploadFileConfigFormProps) {
  const defaultFormFieldsArray = [
    { key: "date", label: "Date" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount" },
  ];

  const { maxLength, selectedRow } = props;
  const dynamicColumns = _computeDynamicColumns(maxLength);
  const [formFields, setFormFields] =
    useState<Record<string, { key: string; label: string }[]>>();
  const { control, handleSubmit, formState } =
    useForm<UploadFileConfigFormValues>({
      defaultValues: {
        ...dynamicColumns,
        account: "",
        calculatedTransactionType: true,
      },
      mode: "onChange",
    });

  useEffect(() => {
    _calculateParseColumnOptions(dynamicColumns);
  }, []);

  //

  function handleUploadPageConfig(data: UploadFileConfigFormValues) {
    console.log("handleUploadPageConfig", data);
    _calculateParseColumnOptions(data);
  }

  function _calculateParseColumnOptions(data: DynamicColumns) {
    const selectedColumns = Object.entries(data)
      .filter(([key, val]) => key.startsWith("column-") && val)
      .map(([_, val]) => val);

    // For each form field, create an options list excluding those selected by other columns
    const updatedFormFields: Record<string, { key: string; label: string }[]> =
      {};
    for (let i = 0; i < maxLength; i++) {
      updatedFormFields[`column-${i}`] = defaultFormFieldsArray
        .filter(
          ({ key }) =>
            !selectedColumns.includes(key) || key === data[`column-${i}`]
        )
        .map(({ key, label }) => ({ key, label }));
    }

    setFormFields(updatedFormFields);
  }

  return (
    <div className={classes.form}>
      <p>
        Please, select the starting row to parse the uploaded file, skip
        headers. Headers has to be configured by configuring the parse column
      </p>
      <form
        className={classes.form__container}
        onChange={handleSubmit(handleUploadPageConfig)}
      >
        <div className={classes.form__column}>
          <div className={classes.form__item}>
            <label>Start from Row</label>
            <div>{selectedRow}</div>
          </div>
          <div>
            {Array.from({ length: maxLength }, (_, i) => (
              <div className={classes.form__item} key={i}>
                <label htmlFor={`column-${i}`}>Parse Column {i} as </label>
                <Controller
                  name={`column-${i}`}
                  control={control}
                  render={({ field }) => (
                    <StyledSelect
                      {...field}
                      options={formFields?.[`column-${i}`] || []}
                    />
                  )}
                />
              </div>
            ))}
          </div>
        </div>
        <div className={classes.form__column}>
          <div className={classes.form__item}>
            <label htmlFor="account">Account</label>
            <Controller
              name="account"
              control={control}
              render={({ field }) => (
                <TextField
                  className={classes.form__input}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                  }}
                />
              )}
            />
            <ErrorMessage
              errors={formState.errors}
              name="account"
              render={(error) => (
                <div className="form__error">{error.message}</div>
              )}
            />
          </div>
          <div>
            <label htmlFor="calculatedTransactionType">
              Transaction type from amount sign
            </label>
            <Controller
              name="calculatedTransactionType"
              control={control}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                  }}
                  disabled
                />
              )}
            />
          </div>
        </div>
      </form>
    </div>
  );
}

function _computeDynamicColumns(maxLength: number) {
  const computedColums: Record<string, string> = {};

  for (let i = 0; i < maxLength; i++) {
    computedColums[`column-${i}`] = "";
  }
  return computedColums;
}
