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
  columnOptions,
  isFromIndex,
  UploadFileConfigFormProps,
  UploadFileConfigFormState,
  UploadFileConfigFormValues,
  UploadFileConfigOptions,
} from "../model/UploadFile";

export default function UploadFileConfigForm(props: UploadFileConfigFormProps) {
  const { maxLength, onFormChange, rows } = props;
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const toggleSelectedRow = (index: number) => {
    if (selectedRow === index) {
      setSelectedRow(null);
    } else {
      setSelectedRow(index);
    }
  };
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
      const selectedColumns = columnOptions
        .filter(({ key }) =>
          isFromIndex(data[key as keyof UploadFileConfigFormValues])
        )
        .map(({ key }) => {
          const value = data[key as keyof UploadFileConfigFormValues];
          return isFromIndex(value)
            ? { key: key, col: value.fromIndex }
            : { key: key, col: undefined };
        });

      // For each form field, create an options list excluding those selected by other columns
      const updatedFormFields: Record<
        string,
        { key: string; label: string }[]
      > = {};
      for (let i = 0; i < maxLength; i++) {
        updatedFormFields[`column-${i}`] = columnOptions
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
      <form className={classes.form__container}>
        <div>
          <div className={classes.form__column}>
            <div className={classes.form__item}>
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
        </div>
        <div>
          <h2>File Preview</h2>
          <div className={classes.previewContainer}>
            <table className={classes.table}>
              <caption>
                Select the starting row to parse the uploaded file and choose
                how columns should be parsed
              </caption>
              <thead>
                <tr>
                  {Array.from({ length: maxLength }, (_, i) => (
                    <th className={classes.form__item} key={i}>
                      <label htmlFor={`column-${i}`}>Parse as </label>
                      <StyledSelect
                        name={`column-${i}`}
                        options={formFields?.[`column-${i}`] || []}
                        emptyLabel="Ignore"
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
                              setValue(
                                key as keyof UploadFileConfigFormValues,
                                ""
                              );
                            }
                          });
                          if (selectedValue) {
                            setValue(selectedValue, { fromIndex: i });
                          }
                        }}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows &&
                  rows.map((row, index) => (
                    <tr
                      key={index}
                      onClick={() => toggleSelectedRow(index)}
                      className={`${classes.row} ${
                        selectedRow === index ? classes.selectedRow : ""
                      }`}
                    >
                      <td style={{ display: "none" }}>
                        <input
                          type="radio"
                          name="rowSelect"
                          value={index}
                          checked={selectedRow === index}
                          readOnly={true}
                          style={{ display: "none" }}
                        />
                      </td>
                      {row.map((cell: string, cellIndex: number) => (
                        <td key={cellIndex} className="border px-4 py-2">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </form>
    </div>
  );
}
