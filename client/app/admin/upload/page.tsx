"use client";

import { plenifyService } from "@/app/services";
import { useEffect, useState } from "react";
import { read, utils } from "xlsx";
import classes from "./page.module.scss";
import { Button, styled } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import UploadFileConfigForm from "./components/UploadFileConfigForm";
import { UploadFileConfigFormState } from "./model/UploadFile";
import TransactionFormMapper from "./components/TransactionFormMapper";
export default function UploadPage() {
  const [rows, setRows] = useState<string[][]>([]);
  const [maxLength, setMaxLength] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [formState, setFormState] = useState<UploadFileConfigFormState>({isValid: false} as UploadFileConfigFormState)

  const VisuallyHiddenInput = styled("input")({
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 0,
    whiteSpace: "nowrap",
    width: 1,
  });

  const toggleSelectedRow = (index: number) => {
    if (selectedRow === index) {
      setSelectedRow(null);
    } else {
      setSelectedRow(index);
    }
  };

  function _validatePreviousState() {
    if (step > 0) {
      return false; // Allow going back if not on the first step
    }
    return true; // Prevent going back if on the first step
  }
 
 function  _validateNextState() {
  const stepValidation: Record<number, () => boolean> = {
    0: () => true,
    1: () => !_formIsValid()
  }

  return stepValidation[step] ? stepValidation[step]() : true; // Default to true if no validation is defined for the step
 }

  function nextStep() {
    setStep(step + 1);
  }

  function prevStep() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  function handleUpload() {
    plenifyService.downloadDb();
  }

  function _formIsValid() {
    return formState.isValid
  }

  function handleFormChange(formState: UploadFileConfigFormState) {
    setFormState(formState);
  }

  // Initialization of each step
  useEffect(() => {
    const stepInit: Record<number, () => void> = {
      0: () => setRows([]),
      1: async () => {
        // TODO Handle multiple files
        if (!(await handleFile(files[0]))) {
          console.error("Failed to handle file");
          setStep(0);
        }
      },
    };
    stepInit[step]?.();
  }, [step]);

  const handleFile = async (file?: File) => {
    if (!file) return false;

    try {
      return file.arrayBuffer().then((buffer) => {
        const workbook = read(buffer);
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const raw_data: string[][] = utils.sheet_to_json(worksheet, {
            header: 1,
          });
          setRows(raw_data);
          setMaxLength(Math.max(...raw_data.map((arr) => arr.length)));
        });
        return true;
      });
    } catch (error) {
      console.error("Error reading file:", error);
      return false;
    }
  };

  return (
    <div>
      <h1>Upload Page</h1>
      <div>
        <p>Step: {step + 1}</p>
      </div>
      {step === 0 && (
        <Button
          component="label"
          role={undefined}
          variant="contained"
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
        >
          Upload files
          <VisuallyHiddenInput
            type="file"
            onChange={(event) => {
              setFiles(
                event.target.files ? Array.from(event.target.files) : []
              );
              nextStep();
            }}
          />
        </Button>
      )}
      {step === 1 && (
        <div>
          {maxLength && (
            <UploadFileConfigForm
              maxLength={maxLength}
              selectedRow={selectedRow}
              onFormChange={handleFormChange}
            />
          )}
        </div>
      )}
      {step === 2 && (
        <TransactionFormMapper fileRows={rows} formValues={formState.values} />
      )}
      <div>
        <Button onClick={prevStep} disabled={_validatePreviousState()}>Previous</Button>
        <Button onClick={nextStep} disabled={_validateNextState()}>Next</Button>
      </div>

      <h2>File Preview</h2>
      <div className={classes.previewContainer}>
        <table className={classes.table}>
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
      <button
        onClick={handleUpload}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Upload
      </button>
    </div>
  );
}
