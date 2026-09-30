"use client";

import { useMemo, useState } from "react";
import {
  Box,
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

type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const PAGE_SIZE = 10;

type ReviewQueueSidebarProps = {
  rows: RowSummary[];
  rowStates: Record<number, RowState>;
  activeIndex: number;
  onSelect: (index: number) => void;
};

export default function ReviewQueueSidebar({
  rows,
  rowStates,
  activeIndex,
  onSelect,
}: ReviewQueueSidebarProps) {
  const [tab, setTab] = useState(0);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<SortOption>("date-desc");
  const [page, setPage] = useState(1);

  // "decision" ignores which row is currently open - it's the underlying saved/skipped/
  // pending state used for tab counts and filtering. The "active" row still needs to
  // show up under its real decision's tab, not vanish into a fourth bucket.
  const decisions = useMemo(
    () => rows.map((row) => computeRowStatus(rowStates[row.index], false)),
    [rows, rowStates]
  );

  const counts = useMemo(() => {
    let saved = 0;
    let pending = 0;
    decisions.forEach((status) => {
      if (status === "saved" || status === "skipped") saved += 1;
      else pending += 1;
    });
    return { all: rows.length, saved, pending };
  }, [decisions, rows.length]);

  const filtered = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return rows
      .map((row, i) => ({ row, decision: decisions[i] }))
      .filter(({ decision }) => {
        if (tab === 1) return decision === "saved" || decision === "skipped";
        if (tab === 2) return decision === "pending";
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
          case "date-asc":
            return a.row.date.getTime() - b.row.date.getTime();
          case "amount-desc":
            return b.row.amount - a.row.amount;
          case "amount-asc":
            return a.row.amount - b.row.amount;
          case "date-desc":
          default:
            return b.row.date.getTime() - a.row.date.getTime();
        }
      });
  }, [rows, decisions, tab, filter, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <Box className={classes.sidebar}>
      <TabsContainer
        tabs={[`All ${counts.all}`, `Saved ${counts.saved}`, `Pending ${counts.pending}`]}
        value={tab}
        onChange={(_, value: number) => {
          setTab(value);
          setPage(1);
        }}
        variant="fullWidth"
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
      <Select
        className={classes.sortSelect}
        size="small"
        value={sort}
        onChange={(e: SelectChangeEvent) => setSort(e.target.value as SortOption)}
      >
        <MenuItem value="date-desc">Date (Newest)</MenuItem>
        <MenuItem value="date-asc">Date (Oldest)</MenuItem>
        <MenuItem value="amount-desc">Amount (Highest)</MenuItem>
        <MenuItem value="amount-asc">Amount (Lowest)</MenuItem>
      </Select>
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
