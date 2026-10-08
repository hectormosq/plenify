"use client";

import { useEffect, useState } from "react";
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
import { UploadFileConfigFormState, isFromIndex } from "./model/UploadFile";
import { extractFileSignature, FileSignature } from "./model/fileSignature";
import { parseStatementFile } from "./model/parseFile";
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
  const [fileName, setFileName] = useState("");
  const [fileSignature, setFileSignature] = useState<FileSignature>({ label: "" });
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [fileError, setFileError] = useState("");
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
      // While the "matches an unfinished import" panel is showing, the mapping form isn't
      // rendered, so formState can still hold a previous file's mapping - the only ways
      // forward are Resume and Start over.
      1: () => isParsingFile || !!matchedDraft || !_formIsValid(),
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
    const values = formState.values;
    return (
      formState.isValid &&
      !!values &&
      isFromIndex(values.date) &&
      isFromIndex(values.description) &&
      isFromIndex(values.amount)
    );
  }

  function _missingColumnMapping() {
    const values = formState.values;
    if (!values || values.selectedRow === "") return false;
    return (
      !isFromIndex(values.date) ||
      !isFromIndex(values.description) ||
      !isFromIndex(values.amount)
    );
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
    if (step === 0) {
      setRows([]);
      setMatchedDraft(null);
      setDrafts(listDrafts());
    }
  }, [step]);

  // Reads the picked file and moves to the parser set-up. Goes back to the file step,
  // with the reason, if the file can't be read or has no data.
  const handleFile = async (file: File) => {
    setFileName(file.name);
    setFileError("");
    // The previous file's column mapping must not carry over to this one.
    setFormState({ isValid: false } as UploadFileConfigFormState);
    setIsParsingFile(true);
    setStep(1);
    try {
      const parsed = parseStatementFile(await file.arrayBuffer());
      if (!parsed) {
        setFileError(`${file.name} has no rows to import.`);
        setStep(0);
        return;
      }
      const signature = extractFileSignature(parsed.rows);
      setRows(parsed.rows);
      setMaxLength(parsed.maxLength);
      setFileSignature(signature);
      setMatchedDraft(loadDraft(computeDraftKey(signature, parsed.rows)));
    } catch (error) {
      console.error("Error reading file:", error);
      setFileError(`${file.name} could not be read: ${error instanceof Error ? error.message : String(error)}`);
      setStep(0);
    } finally {
      setIsParsingFile(false);
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
                  // TODO Handle multiple files
                  const file = event.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </Button>
            {fileError && (
              <Typography variant="body2" sx={{ color: "var(--errorColor)" }}>
                {fileError}
              </Typography>
            )}
          </Box>
        </div>
      )}
      {step === 1 && !isParsingFile && !matchedDraft && _missingColumnMapping() && (
        <Box sx={{ textAlign: "center", mb: 1 }}>
          <Typography variant="body2" sx={{ color: "var(--errorColor)" }}>
            Select a column for Date, Description, and Amount before continuing.
          </Typography>
        </Box>
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
