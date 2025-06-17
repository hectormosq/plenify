import { Controller, FormState, useForm, useWatch } from "react-hook-form";
import classes from "./UploadFileConfigForm.module.scss";
import { Checkbox, debounce, TextField } from "@mui/material";
import { useEffect, useState, useCallback } from "react";
import { ErrorMessage } from "@hookform/error-message";
import StyledSelect from "@/app/components/inputs/StyledSelect";
import {
  DynamicColumns,
  UploadFileConfigFormProps,
  UploadFileConfigFormValues,
} from "../model/UploadFile";

export default function UploadFileConfigForm(props: UploadFileConfigFormProps) {
  const defaultFormFieldsArray = [
    { key: "date", label: "Date" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount" },
  ];

  const { maxLength, selectedRow, onFormChange } = props;
  const dynamicColumns = _computeDynamicColumns(maxLength);
  const [formFields, setFormFields] =
    useState<Record<string, { key: string; label: string }[]>>();
  const { control, formState, subscribe } =
    useForm<UploadFileConfigFormValues>({
      defaultValues: {
        ...dynamicColumns,
        account: "",
        calculatedTransactionType: true,
      },
      mode: "onChange",
    });



  const watchedData = useWatch({
    control,
  });

  

  const handleUploadPageConfig = useCallback((data: Partial<FormState<UploadFileConfigFormValues>>) => {
    onFormChange(data as FormState<UploadFileConfigFormValues>);
  }, []);

    useEffect(() => {
    const callback = subscribe({
      formState: { values: true, isValid: true },
      callback: (formState) => {
        debounce(() => handleUploadPageConfig(formState), 500)();
      },
    });

    return () => callback();
  }, [subscribe, handleUploadPageConfig]);

  const  _calculateParseColumnOptions = useCallback((data: DynamicColumns) => {
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
  }, [] );

  useEffect(() => {
    _calculateParseColumnOptions(watchedData as DynamicColumns);
  }, [watchedData, _calculateParseColumnOptions]);

  return (
    <div className={classes.form}>
      <p>
        Please, select the starting row to parse the uploaded file, skip
        headers. Headers has to be configured by configuring the parse column
      </p>
      <form
        className={classes.form__container}
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
                <Checkbox {...field} checked={field.value} disabled />
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
