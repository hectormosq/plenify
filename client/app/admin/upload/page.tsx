"use client";

import { useEffect, useState } from "react";
import { read, utils } from "xlsx";
import classes from "./page.module.scss";
import {
  Box,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Step,
  StepLabel,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import UploadFileConfigForm from "./components/UploadFileConfigForm";
import { UploadFileConfigFormState } from "./model/UploadFile";
import { extractFileSignature, FileSignature } from "./model/fileSignature";
import {
  UploadDraft,
  clearDraft,
  computeDraftKey,
  listDrafts,
  loadDraft,
} from "./model/uploadDraft";
import { StyledStepper } from "@/app/components/Stepper/StyledStepper";
import TransactionFormMapper from "./components/TransactionFormMapper";
export default function UploadPage() {
  const [rows, setRows] = useState<string[][]>([]);
  const [maxLength, setMaxLength] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [fileName, setFileName] = useState("");
  const [fileSignature, setFileSignature] = useState<FileSignature>({ label: "" });
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [drafts, setDrafts] = useState<UploadDraft[]>([]);
  const [matchedDraft, setMatchedDraft] = useState<UploadDraft | null>(null);

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

  function resumeDraft(draft: UploadDraft) {
    setRows(draft.rows);
    setMaxLength(draft.maxLength);
    setFormState({ isValid: true, values: draft.formValues } as UploadFileConfigFormState);
    setFileSignature(extractFileSignature(draft.rows));
    setFileName(draft.fileName);
    setMatchedDraft(null);
    setStep(2);
  }

  function discardDraft(draft: UploadDraft) {
    clearDraft(draft.draftKey);
    setDrafts((prev) => prev.filter((d) => d.draftKey !== draft.draftKey));
    setMatchedDraft((current) =>
      current?.draftKey === draft.draftKey ? null : current
    );
  }

  // Initialization of each step
  useEffect(() => {
    const stepInit: Record<number, () => void> = {
      0: () => {
        setRows([]);
        setDrafts(listDrafts());
      },
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

    setIsParsingFile(true);
    try {
      return file
        .arrayBuffer()
        .then((buffer) => {
          const workbook = read(buffer, { raw: true, cellDates: true });
          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const raw_data: string[][] = utils.sheet_to_json(worksheet, {
              header: 1,
            });
            const clearData = raw_data.filter((arr) => arr.length > 0);
            const signature = extractFileSignature(clearData);
            setRows(clearData);
            setMaxLength(Math.max(...clearData.map((arr) => arr.length)));
            setFileSignature(signature);
            setMatchedDraft(loadDraft(computeDraftKey(signature, clearData)));
          });
          return true;
        })
        .finally(() => setIsParsingFile(false));
    } catch (error) {
      console.error("Error reading file:", error);
      setIsParsingFile(false);
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

      {step !== 2 && (
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
      )}

      {step === 0 && (
        <div className={classes.stepContainer}>
          <Box display="flex" flexDirection="column" alignItems="center" gap={3} width="100%">
            {drafts.length > 0 && (
              <Box width="100%" maxWidth={480}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Resume an unfinished import
                </Typography>
                <List>
                  {drafts.map((draft) => {
                    const total = draft.rows.length - (draft.formValues.selectedRow as number);
                    const reviewed = Object.keys(draft.rowStates).length;
                    return (
                      <ListItem
                        key={draft.draftKey}
                        secondaryAction={
                          <Box display="flex" gap={1}>
                            <Button size="small" variant="contained" onClick={() => resumeDraft(draft)}>
                              Resume
                            </Button>
                            <Button size="small" onClick={() => discardDraft(draft)}>
                              Discard
                            </Button>
                          </Box>
                        }
                      >
                        <ListItemText primary={draft.label} secondary={`${reviewed}/${total} reviewed`} />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}
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
                  const selected = event.target.files ? Array.from(event.target.files) : [];
                  setFiles(selected);
                  setFileName(selected[0]?.name ?? "");
                  nextStep();
                }}
              />
            </Button>
          </Box>
        </div>
      )}
      {step === 1 && (
        <div className={classes.stepContainer}>
          {isParsingFile ? (
            <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={4}>
              <CircularProgress />
              <Typography variant="body2">Parsing file...</Typography>
            </Box>
          ) : matchedDraft ? (
            <Box display="flex" flexDirection="column" alignItems="center" gap={2} maxWidth={480}>
              <Typography variant="body1" textAlign="center">
                This file matches an unfinished import: {matchedDraft.label} (
                {Object.keys(matchedDraft.rowStates).length}/
                {matchedDraft.rows.length - (matchedDraft.formValues.selectedRow as number)} reviewed).
              </Typography>
              <Box display="flex" gap={1}>
                <Button variant="contained" onClick={() => resumeDraft(matchedDraft)}>
                  Resume
                </Button>
                <Button onClick={() => discardDraft(matchedDraft)}>Start over</Button>
              </Box>
            </Box>
          ) : (
            maxLength ? (
              <UploadFileConfigForm
                maxLength={maxLength}
                rows={rows}
                onFormChange={handleFormChange}
              />
            ) : null
          )}
        </div>
      )}
      {step === 2 && (
        <div className={classes.stepContainer}>
          <TransactionFormMapper
            fileRows={rows}
            formValues={formState.values}
            maxLength={maxLength}
            fileName={fileName}
            fileSignature={fileSignature}
          />
        </div>
      )}
    </div>
  );
}
