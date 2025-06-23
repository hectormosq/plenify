import { Controller, useForm, useWatch } from "react-hook-form";
import classes from "./UploadFileConfigForm.module.scss";
import {
  Checkbox,
  debounce,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import { useEffect, useState, useCallback } from "react";
import { ErrorMessage } from "@hookform/error-message";
import StyledSelect from "@/app/components/inputs/StyledSelect";
import {
  defaultFormFieldsArray,
  FromIndex,
  isFromIndex,
  UploadFileConfigFormProps,
  UploadFileConfigFormState,
  UploadFileConfigFormValues,
  UploadFileConfigOptions,
} from "../model/UploadFile";

export default function UploadFileConfigForm(props: UploadFileConfigFormProps) {
  const { maxLength, selectedRow, onFormChange } = props;
  const [formFields, setFormFields] =
    useState<Record<string, { key: string; label: string }[]>>();

  const { control, formState, subscribe, setValue, getValues } =
    useForm<UploadFileConfigFormValues>({
      defaultValues: {
        selectedRow: selectedRow ?? "",
        account: "",
        calculatedTransactionType: true,
      },
      mode: "onChange",
    });

  const watchedData = useWatch({
    control,
  });

  const handleUploadPageConfig = useCallback(
    (data: UploadFileConfigFormState) => {
      onFormChange(data);
    },
    []
  );

  useEffect(() => {
    const callback = subscribe({
      formState: { values: true, isValid: true },
      callback: (formState) => {
        debounce(() => handleUploadPageConfig(formState), 500)();
      },
    });

    return () => callback();
  }, [subscribe, handleUploadPageConfig]);

  const _calculateParseColumnOptions = useCallback(
    (data: UploadFileConfigFormValues) => {
      const selectedColumns = Object.entries(data)
        .filter(([_, val]) => isFromIndex(val))
        .map(([key, val]) => {
          return { key: key, col: (val as FromIndex).fromIndex };
        });

      // For each form field, create an options list excluding those selected by other columns
      const updatedFormFields: Record<
        string,
        { key: string; label: string }[]
      > = {};
      for (let i = 0; i < maxLength; i++) {
        updatedFormFields[`column-${i}`] = defaultFormFieldsArray
          .filter(({ key }) => {
            if (!selectedColumns.length) {
              return true;
            }
            // Only filter out keys that are selected in other columns (col !== i)
            return !selectedColumns.some(
              (col) => col.key === key && col.col !== i
            );
          })
          .map(({ key, label }) => ({ key, label }));
      }

      setFormFields(updatedFormFields);
    },
    []
  );

  useEffect(() => {
    setValue("selectedRow", selectedRow ?? "");
  }, [selectedRow, setValue]);

  useEffect(() => {
    _calculateParseColumnOptions(watchedData as UploadFileConfigFormValues);
  }, [watchedData, _calculateParseColumnOptions]);

  return (
    <div className={classes.form}>
      <p>
        Please, select the starting row to parse the uploaded file, skip
        headers. Headers has to be configured by configuring the parse column
      </p>
      <form className={classes.form__container}>
        <div className={classes.form__column}>
          <div className={classes.form__item}>
            <label>Start from Row</label>
            <div className={classes.form__item}>
              <label htmlFor="selectedRow">Parse Starting Row</label>
              <Controller
                name="selectedRow"
                control={control}
                rules={{ required: "Select Starting row to parse file" }}
                render={({ field }) => (
                  <TextField
                    className={classes.form__input}
                    disabled={true}
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
          </div>
          <div>
            {Array.from({ length: maxLength }, (_, i) => (
              <div className={classes.form__item} key={i}>
                <label htmlFor={`column-${i}`}>Parse Column {i} as </label>
                <StyledSelect
                  name={`column-${i}`}
                  options={formFields?.[`column-${i}`] || []}
                  onChange={(event: SelectChangeEvent<unknown>) => {
                    const selectedValue = event.target
                      .value as UploadFileConfigOptions;
                    // Remove any previous selection that had { fromIndex: i }
                    const currentFormValue: UploadFileConfigFormValues =
                      getValues();
                    Object.keys(currentFormValue).forEach((key) => {
                      const currentValue =
                        currentFormValue[
                          key as keyof UploadFileConfigFormValues
                        ];
                      if (
                        isFromIndex(currentValue) &&
                        currentValue.fromIndex === i
                      ) {
                        setValue(key as keyof UploadFileConfigFormValues, "");
                      }
                    });
                    if (selectedValue) {
                      setValue(selectedValue, { fromIndex: i });
                    }
                  }}
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
