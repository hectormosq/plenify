"use client";

import { memo, useEffect, useMemo, useState } from "react";
import {
  Box,
  IconButton,
  InputAdornment,
  List,
  MenuItem,
  Pagination,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { TabsContainer } from "@/app/components/Tabs/Tabs";
import { TransactionType } from "@/app/models/transaction";
import { computeRowStatus } from "../model/reviewQueue";
import { RowState } from "../model/uploadDraft";
import QueueListItem from "./QueueListItem";
import classes from "./ReviewQueueSidebar.module.scss";

export type RowSummary = {
  index: number;
  description: string;
  amount: number;
  transactionType: TransactionType;
  date: Date;
  tags: string[];
};

type SortOption = "file" | "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const PAGE_SIZE = 10;

type ReviewQueueSidebarProps = {
  rows: RowSummary[];
  rowStates: Record<number, RowState>;
  activeIndex: number;
  onSelect: (index: number) => void;
};

function ReviewQueueSidebar({
  rows,
  rowStates,
  activeIndex,
  onSelect,
}: ReviewQueueSidebarProps) {
  const [tab, setTab] = useState(0);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<SortOption>("file");
  const [page, setPage] = useState(1);
  const [locateRequest, setLocateRequest] = useState(0);

  // "decision" ignores which row is currently open - it's the underlying saved/skipped/
  // pending state used for tab counts and filtering. The "active" row still needs to
  // show up under its real decision's tab, not vanish into a fourth bucket.
  const decisions = useMemo(
    () => rows.map((row) => computeRowStatus(rowStates[row.index], false)),
    [rows, rowStates]
  );

  const counts = useMemo(() => {
    let saved = 0;
    let skipped = 0;
    let pending = 0;
    decisions.forEach((status) => {
      if (status === "saved") saved += 1;
      else if (status === "skipped") skipped += 1;
      else pending += 1;
    });
    return { all: rows.length, saved, skipped, pending };
  }, [decisions, rows.length]);

  const filtered = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return rows
      .map((row, i) => ({ row, decision: decisions[i] }))
      .filter(({ decision }) => {
        if (tab === 1) return decision === "saved";
        if (tab === 2) return decision === "skipped";
        if (tab === 3) return decision === "pending";
        return true;
      })
      .filter(({ row }) => {
        if (!term) return true;
        return (
          row.description.toLowerCase().includes(term) ||
          String(row.amount).includes(term)
        );
      })
      .sort((a, b) => {
        switch (sort) {
          // Same order as the statement, so the list matches "Row N of M" and
          // Save & Next moves down it.
          case "file":
            return a.row.index - b.row.index;
          case "date-asc":
            return a.row.date.getTime() - b.row.date.getTime();
          case "amount-desc":
            return b.row.amount - a.row.amount;
          case "amount-asc":
            return a.row.amount - b.row.amount;
          case "date-desc":
            return b.row.date.getTime() - a.row.date.getTime();
          default:
            return a.row.index - b.row.index;
        }
      });
  }, [rows, decisions, tab, filter, sort]);

  // Show the page holding the open row: on resume, after Save & Next / Skip, and when
  // "go to current" is pressed. Not on every change to the list, or paging and
  // filtering by hand would keep snapping back.
  useEffect(() => {
    const position = filtered.findIndex(({ row }) => row.index === activeIndex);
    if (position >= 0) setPage(Math.floor(position / PAGE_SIZE) + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, locateRequest]);

  // Clears whatever is hiding the open row, then lets the effect above page to it.
  function goToCurrent() {
    if (!filtered.some(({ row }) => row.index === activeIndex)) {
      setTab(0);
      setFilter("");
    }
    setLocateRequest((request) => request + 1);
  }

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <Box className={classes.sidebar}>
      <TabsContainer
        tabs={[
          `All ${counts.all}`,
          `Saved ${counts.saved}`,
          `Skipped ${counts.skipped}`,
          `Pending ${counts.pending}`,
        ]}
        value={tab}
        onChange={(_, value: number) => {
          setTab(value);
          setPage(1);
        }}
        variant="fullWidth"
        // Four labels with counts don't fit the sidebar at MUI's default tab size.
        sx={{ "& .MuiTab-root": { minWidth: 0, px: 0.5, fontSize: "0.75rem" } }}
      />
      <TextField
        className={classes.filterInput}
        size="small"
        placeholder="Filter queue (merchant, amount...)"
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value);
          setPage(1);
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "var(--inputLabel)" }} />
              </InputAdornment>
            ),
          },
        }}
      />
      <Box className={classes.sortRow}>
        <Select
          className={classes.sortSelect}
          size="small"
          value={sort}
          onChange={(e: SelectChangeEvent) => setSort(e.target.value as SortOption)}
        >
          <MenuItem value="file">File order</MenuItem>
          <MenuItem value="date-desc">Date (Newest)</MenuItem>
          <MenuItem value="date-asc">Date (Oldest)</MenuItem>
          <MenuItem value="amount-desc">Amount (Highest)</MenuItem>
          <MenuItem value="amount-asc">Amount (Lowest)</MenuItem>
        </Select>
        <IconButton
          size="small"
          aria-label="Go to current transaction"
          title="Go to current transaction"
          onClick={goToCurrent}
        >
          <MyLocationIcon fontSize="small" sx={{ color: "var(--foreground)" }} />
        </IconButton>
      </Box>
      <List className={classes.list}>
        {pageItems.length === 0 ? (
          <Typography variant="body2" className={classes.emptyState}>
            No transactions match.
          </Typography>
        ) : (
          pageItems.map(({ row, decision }) => (
            <QueueListItem
              key={row.index}
              index={row.index}
              description={row.description}
              amount={row.amount}
              transactionType={row.transactionType}
              date={row.date}
              tags={row.tags}
              status={row.index === activeIndex ? "active" : decision}
              onSelect={onSelect}
            />
          ))
        )}
      </List>
      {pageCount > 1 && (
        <Box className={classes.pagination}>
          <Pagination
            count={pageCount}
            page={currentPage}
            onChange={(_, value) => setPage(value)}
            size="small"
          />
        </Box>
      )}
    </Box>
  );
}

export default memo(ReviewQueueSidebar);
