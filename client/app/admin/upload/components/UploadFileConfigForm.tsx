import { Controller, FormState, useForm, useWatch } from "react-hook-form";
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
  const [selectedRow, setSelectedRow] = useState<number | "">("");

  const [formFields, setFormFields] =
    useState<Record<string, { key: string; label: string }[]>>();

  const { control, formState, subscribe, setValue, getValues } =
    useForm<UploadFileConfigFormValues>({
      defaultValues: {
        selectedRow: "",
        account: "",
        calculatedTransactionType: true,
      },
    });

  const watchedData = useWatch({
    control,
  });

  const toggleSelectedRow = (index: number) => {
    let selection: "" | number;
    if (selectedRow === index) {
      selection = "";
    } else {
      selection = index;
    }

    setSelectedRow(selection);
    setValue("selectedRow", selection, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  useEffect(() => {}, [selectedRow, setValue]);

  const handleUploadPageConfig = useCallback(
    (
      data: Partial<FormState<UploadFileConfigFormValues>> & {
        values: UploadFileConfigFormValues;
      }
    ) => {
      onFormChange(data);
    },
    [onFormChange]
  );

  useEffect(() => {
    const callback = subscribe({
      formState: { values: true, isValid: true },
      callback: (formState: UploadFileConfigFormState) => {
        const debounceTime = formState.name === "selectedRow" ? 0 : 500;
        debounce(() => handleUploadPageConfig(formState), debounceTime)();
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
    _calculateParseColumnOptions(watchedData as UploadFileConfigFormValues);
  }, [watchedData, _calculateParseColumnOptions]);

  return (
    <div className={classes.form}>
      <form className={classes.form__container}>
        <div className={classes.form__row}>
          <div className={classes.form__item}>
            <label>Parse Starting Row</label>
            <Controller
              name="selectedRow"
              control={control}
              rules={{
                required: "You have to select starting row from table",
              }}
              render={({ field }) => (
                <TextField
                  className={classes.form__input}
                  disabled={true}
                  {...field}
                />
              )}
            />
            <ErrorMessage
              errors={formState.errors}
              name="selectedRow"
              render={(error) => (
                <div className="form__error">{error.message}</div>
              )}
            />
          </div>
          <div className={classes.form__item}>
            <label>Account</label>
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
          <div className={classes.form__item}>
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
        <div>
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
                      <label>Parse as </label>
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
                      className={`${classes.row} ${
                        selectedRow === index ? classes.selectedRow : ""
                      }`}
                    >
                      {row.map((cell: string, cellIndex: number) => (
                        <td key={cellIndex} className="border px-4 py-2">
                          <div onClick={() => toggleSelectedRow(index)}>
                            {cell}
                          </div>
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
