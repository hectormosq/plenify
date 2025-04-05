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
import CategoryTag from "./CategoryTag";
import TagIcon from "@mui/icons-material/Tag";
import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import { useState } from "react";
import { usePlenifyState } from "@/app/hooks/usePlenifyState";

interface PopperComponentProps {
  anchorEl?: unknown;
  disablePortal?: boolean;
  open: boolean;
}

export default function CategorySelector({
  selectedCategories,
  onSelectCategory,
}: {
  selectedCategories: string[];
  onSelectCategory: (category: string[]) => void;
}) {
  const { categories } = usePlenifyState();
  const [pendingValue, setPendingValue] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const maxCategories = 2;
  const open = Boolean(anchorEl);

  const handleDeleteCategory = (category: string) => {
    onSelectCategory(selectedCategories.filter((value) => value !== category));
  };
  const handleClose = () => {
    onSelectCategory(pendingValue);
    if (anchorEl) {
      anchorEl.focus();
    }
    setAnchorEl(null);
  };

  const handleSelectTag = (event: React.MouseEvent<HTMLElement>) => {
    setPendingValue(selectedCategories);
    setAnchorEl(event.currentTarget);
  };

  return (
    <>
      <div style={{ display: "flex" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {selectedCategories.map((value) => (
            <CategoryTag
              key={value}
              id={value}
              handleDeleteCategory={() => handleDeleteCategory(value)}
            />
          ))}
        </div>
        <Button
          disableRipple
          onClick={handleSelectTag}
          disabled={selectedCategories.length >= maxCategories}
        >
          <TagIcon />
        </Button>
      </div>
      <StyledPopper
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
                      color: 'var(--background)',
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
                      color: 'var(--background)',
                    }}
                  />
                </li>
              );
            }}
            options={[...Object.keys(categories)].sort((a, b) => {
              // Display the selected labels first.
              let ai = selectedCategories.indexOf(a);
              ai =
                ai === -1
                  ? selectedCategories.length +
                    Object.keys(categories).indexOf(a)
                  : ai;
              let bi = selectedCategories.indexOf(b);
              bi =
                bi === -1
                  ? selectedCategories.length +
                    Object.keys(categories).indexOf(b)
                  : bi;
              return ai - bi;
            })}
            getOptionLabel={(option) => categories[option].name}
            renderInput={(params) => (
              <StyledInput
                ref={params.InputProps.ref}
                inputProps={params.inputProps}
                autoFocus
                placeholder="Filter Categories"
              />
            )}
            slots={{
              popper: PopperComponent,
            }}
          />
        </ClickAwayListener>
      </StyledPopper>
    </>
  );
}

const StyledPopper = styled(Popper)(({ theme }) => ({
    border: '1px solid var(--border)',
    backgroundColor: 'var(--background)',
    boxShadow: `0 8px 24px ${'rgba(149, 157, 165, 0.2)'}`,
    color: '#24292e',
    borderRadius: 6,
    width: 300,
    zIndex: theme.zIndex.modal,
    fontSize: 13,
    ...theme.applyStyles('dark', {
      border: '1px solid #30363d',
      boxShadow: '0 8px 24px rgb(1, 4, 9)',
      color: '#c9d1d9',
      backgroundColor: '#1c2128',
    }),
  }));

const StyledInput = styled(InputBase)(({ theme }) => ({
    padding: 10,
    width: '100%',
    borderBottom: '1px solid var(--foreground)',
    ...theme.applyStyles('dark', {
      borderBottom: '1px solid #30363d',
    }),
    '& input': {
      borderRadius: 4,
      padding: 8,
      transition: theme.transitions.create(['border-color', 'box-shadow']),
      color: 'var(--foreground)',
      backgroundColor: 'var(--inputBackground)',
      border: '1px solid #30363d',
      ...theme.applyStyles('dark', {
        backgroundColor: '#0d1117',
        border: '1px solid #eaecef',
      }),
      '&:focus': {
        boxShadow: '0px 0px 0px 3px rgba(3, 102, 214, 0.3)',
        borderColor: '#0366d6',
        ...theme.applyStyles('dark', {
          boxShadow: '0px 0px 0px 3px rgb(12, 45, 107)',
          borderColor: '#388bfd',
        }),
      },
    },
  }));

const StyledAutocompletePopper = styled("div")(({ theme }) => ({
  [`& .${autocompleteClasses.paper}`]: {
    boxShadow: "none",
    margin: 0,
    color: "inherit",
    fontSize: 13,
  },
  [`& .${autocompleteClasses.listbox}`]: {
    padding: 0,
    backgroundColor: 'var(--background)',
    ...theme.applyStyles("dark", {
      backgroundColor: "#1c2128",
    }),
    [`& .${autocompleteClasses.option}`]: {
      minHeight: "auto",
      alignItems: "flex-start",
      padding: "1rem",
      borderBottom: "1px solid var(--border)",
      ...theme.applyStyles("dark", {
        borderBottom: "1px solid #30363d",
      }),
      '&[aria-selected="true"]': {
        backgroundColor: "var(--inputBackground)",
      },
      [`&.${autocompleteClasses.focused}, &.${autocompleteClasses.focused}[aria-selected="true"]`]:
        {
          backgroundColor: 'var(--foreground)',
        },
    },
  },
  [`&.${autocompleteClasses.popperDisablePortal}`]: {
    position: "relative",
  },
}));

function PopperComponent(props: PopperComponentProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { disablePortal, anchorEl, open, ...other } = props;
  return <StyledAutocompletePopper {...other} />;
}
