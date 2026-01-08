"use client";

import { useEffect, useState } from "react";
import { read, utils } from "xlsx";
import classes from "./page.module.scss";
import { Button, Step, StepLabel } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import UploadFileConfigForm from "./components/UploadFileConfigForm";
import { UploadFileConfigFormState } from "./model/UploadFile";
import TransactionFormMapper from "./components/TransactionFormMapper";
import { StyledStepper } from "@/app/components/Stepper/StyledStepper";
export default function UploadPage() {
  const [rows, setRows] = useState<string[][]>([]);
  const [maxLength, setMaxLength] = useState(0);
  const [files, setFiles] = useState<File[]>([]);

  const [step, setStep] = useState(0);
  const [formState, setFormState] = useState<UploadFileConfigFormState>({
    isValid: false,
  } as UploadFileConfigFormState);

  const steps = [
    { title: "Upload File" },
    { title: "Set-Up Parser" },
    { title: "Review Transactions" },
  ];

  function _validatePreviousState() {
    if (step > 0) {
      return false; // Allow going back if not on the first step
    }
    return true; // Prevent going back if on the first step
  }

  function _validateNextState() {
    const stepValidation: Record<number, () => boolean> = {
      0: () => true,
      1: () => !_formIsValid(),
    };

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

  function _formIsValid() {
    return formState.isValid;
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
        const workbook = read(buffer, { raw: true, cellDates: true });
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
      <div className={classes.stepper}>
        <StyledStepper activeStep={step} alternativeLabel>
          {steps.map((step) => (
            <Step key={step.title}>
              <StepLabel>{step.title}</StepLabel>
            </Step>
          ))}
        </StyledStepper>
      </div>

      <div className={classes.buttonContainer}>
        <Button
          onClick={prevStep}
          disabled={_validatePreviousState()}>
          Previous
        </Button>
        <Button variant="outlined"
          onClick={nextStep}
          disabled={_validateNextState()}>
          Next
        </Button>
      </div>

      {step === 0 && (
        <div className={classes.stepContainer}>
          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
          >
            Upload files
            <input
              hidden
              type="file"
              onChange={(event) => {
                setFiles(
                  event.target.files ? Array.from(event.target.files) : []
                );
                nextStep();
              }}
            />
          </Button>
        </div>
      )}
      {step === 1 && (
        <div className={classes.stepContainer}>
          {maxLength && (
            <UploadFileConfigForm
              maxLength={maxLength}
              rows={rows}
              onFormChange={handleFormChange}
            />
          )}
        </div>
      )}
      {step === 2 && (
        <div className={classes.stepContainer}>
          <TransactionFormMapper
            fileRows={rows}
            formValues={formState.values}
          />
        </div>
      )}
    </div>
  );
}
