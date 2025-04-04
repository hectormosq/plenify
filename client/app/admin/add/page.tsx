"use client";

import { usePlenifyState } from "@/app/hooks/usePlenifyState";
import TagIcon from "@mui/icons-material/Tag";
import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import classes from "./page.module.css";
import {
  Autocomplete,
  autocompleteClasses,
  AutocompleteCloseReason,
  Box,
  Button,
  ClickAwayListener,
  InputBase,
  Popper,
  styled,
} from "@mui/material";
import { useState } from "react";
import CategoryTag from "@/app/components/categories/category";

interface PopperComponentProps {
  anchorEl?: unknown;
  disablePortal?: boolean;
  open: boolean;
}

export default function AdminPage() {
  const { categories } = usePlenifyState();
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [pendingValue, setPendingValue] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleSelectTag = (event: React.MouseEvent<HTMLElement>) => {
    setPendingValue(categoryList);
    setAnchorEl(event.currentTarget);
  };

  const handleDeleteCategory = (category: string) => {
    setCategoryList(categoryList.filter((value) => value !== category));
  };

  const handleClose = () => {
    setCategoryList(pendingValue);
    if (anchorEl) {
      anchorEl.focus();
    }
    setAnchorEl(null);
  };

  const StyledAutocompletePopper = styled("div")(({ theme }) => ({
    [`& .${autocompleteClasses.paper}`]: {
      boxShadow: "none",
      margin: 0,
      color: "inherit",
      fontSize: 13,
    },
    [`& .${autocompleteClasses.listbox}`]: {
      padding: 0,
      backgroundColor: "#fff",
      ...theme.applyStyles("dark", {
        backgroundColor: "#1c2128",
      }),
      [`& .${autocompleteClasses.option}`]: {
        minHeight: "auto",
        alignItems: "flex-start",
        padding: 8,
        borderBottom: "1px solid #eaecef",
        ...theme.applyStyles("dark", {
          borderBottom: "1px solid #30363d",
        }),
        '&[aria-selected="true"]': {
          backgroundColor: "transparent",
        },
        [`&.${autocompleteClasses.focused}, &.${autocompleteClasses.focused}[aria-selected="true"]`]:
          {
            backgroundColor: theme.palette.action.hover,
          },
      },
    },
    [`&.${autocompleteClasses.popperDisablePortal}`]: {
      position: "relative",
    },
  }));

  function PopperComponent(props: PopperComponentProps) {
    const { disablePortal, anchorEl, open, ...other } = props;
    return <StyledAutocompletePopper {...other} />;
  }

  return (
    <div>
      <form className={classes.form}>
        <div className={classes.row}>
          <p>
            <label htmlFor="amount">Amount</label>
            <input
              type="number"
              id="amount"
              name="amount"
              step="0.01"
              required
            />
          </p>
          <p>
            <label htmlFor="operation_date">Date</label>
            <input
              type="date"
              id="operation_date"
              name="operation_date"
              required
            />
          </p>
        </div>
        <div className={classes.row}>
          <p>
            <label htmlFor="concept">Description</label>
            <input type="text" id="description" name="description" required />
          </p>
        </div>
        <div className={classes.row}>
          <div>
            <label htmlFor="category_list">Categories</label>

            <div className={classes.row}>
              <div className={classes.chips}>
                {categoryList.map((value) => (
                  <CategoryTag
                    key={value}
                    id={value}
                    handleDeleteCategory={() => handleDeleteCategory(value)}
                  />
                ))}
              </div>
              <Button disableRipple onClick={handleSelectTag}>
                <TagIcon />
              </Button>
            </div>
            <Popper
              id="tag-selector"
              open={open}
              anchorEl={anchorEl}
              placement="bottom-start"
            >
              <ClickAwayListener onClickAway={handleClose}>
                <Autocomplete
                  open
                  multiple
                  onClose={(
                    event: React.ChangeEvent<unknown>,
                    reason: AutocompleteCloseReason
                  ) => {
                    console.log("onClose", event, reason);
                    if (reason === "escape") {
                      handleClose();
                    }
                  }}
                  value={pendingValue}
                  onChange={(event, newValue, reason) => {
                    if (
                      event.type === "keydown" &&
                      ((event as React.KeyboardEvent).key === "Backspace" ||
                        (event as React.KeyboardEvent).key === "Delete") &&
                      reason === "removeOption"
                    ) {
                      return;
                    }
                    setPendingValue(newValue);
                  }}
                  disableCloseOnSelect
                  renderTags={() => null}
                  noOptionsText="No labels"
                  renderOption={(props, option, { selected }) => {
                    const { key, ...optionProps } = props;
                    return (
                      <li key={key} {...optionProps}>
                        <Box
                          component={DoneIcon}
                          sx={{ width: 17, height: 17, mr: "5px", ml: "-2px" }}
                          style={{
                            visibility: selected ? "visible" : "hidden",
                          }}
                        />
                        <Box
                          component="span"
                          sx={{
                            width: 14,
                            height: 14,
                            flexShrink: 0,
                            borderRadius: "3px",
                            mr: 1,
                            mt: "2px",
                          }}
                          style={{ backgroundColor: categories[option].color }}
                        />
                        <Box
                          sx={(t) => ({
                            flexGrow: 1,
                            "& span": {
                              color: "#8b949e",
                              ...t.applyStyles("light", {
                                color: "#586069",
                              }),
                            },
                          })}
                        >
                          <span>{categories[option].name}</span>
                        </Box>
                        <Box
                          component={CloseIcon}
                          sx={{ opacity: 0.6, width: 18, height: 18 }}
                          style={{
                            visibility: selected ? "visible" : "hidden",
                          }}
                        />
                      </li>
                    );
                  }}
                  options={[...Object.keys(categories)].sort((a, b) => {
                    // Display the selected labels first.
                    let ai = categoryList.indexOf(a);
                    ai =
                      ai === -1
                        ? categoryList.length +
                          Object.keys(categories).indexOf(a)
                        : ai;
                    let bi = categoryList.indexOf(b);
                    bi =
                      bi === -1
                        ? categoryList.length +
                          Object.keys(categories).indexOf(b)
                        : bi;
                    return ai - bi;
                  })}
                  getOptionLabel={(option) => categories[option].name}
                  renderInput={(params) => (
                    <InputBase
                      ref={params.InputProps.ref}
                      inputProps={params.inputProps}
                      autoFocus
                      placeholder="Filter labels"
                    />
                  )}
                  slots={{
                    popper: PopperComponent,
                  }}
                />
              </ClickAwayListener>
            </Popper>
          </div>
        </div>
        <p className={classes.actions}>
          <button type="submit">Submit</button>
        </p>
      </form>
    </div>
  );
}
