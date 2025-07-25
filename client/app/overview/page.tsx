"use client";

import Loader from "../components/loader";
import { usePlenifyState } from "../hooks/usePlenifyState";
import dayjs from "dayjs";
import { plenifyService } from "../services";
import OverviewService from "../services/overview";
import pageClasses from "./page.module.scss";
import GrandTotalCard from "../components/Card/GrandTotalCard";
import CategoryTag from "../components/categories/CategoryTag";
import { useState } from "react";
import {
  hashItem,
  TotalsByYearMonth,
  TransactionMonthDetails,
  YearMonthRecord,
} from "../models/transaction";
import CompactTransactionList from "../components/transactions/CompactTransactionList";
import { Formats } from "../services/formats";

// TODO this variables should be dependent on the current year
const monthsCount = dayjs().month() + 1;
const today = dayjs();
const year = today.year();
const firstDayOfYear = today.startOf("year").toISOString();
const lastDayOfYear = today.endOf("year").toISOString();

export default function TransactionListPage() {
  const [openGroups, setOpenGroups] = useState(() => {
    const state: Record<number, boolean> = {};
    return state;
  });

  const [openDetails, setOpenDetails] = useState(() => {
    const state: Record<string, boolean> = {};
    return state;
  });

  const toggleGroup = (index: number) => {
    setOpenGroups((prev) => ({ ...prev, [index]: !prev[index] }));
  };
  const toggleDetails = (index: string) => {
    setOpenDetails((prev) => ({ ...prev, [index]: !prev[index] }));
  };
  const { loading } = usePlenifyState();

  const yearTransactions = plenifyService.getTransactionsByRangeDate(
    firstDayOfYear,
    lastDayOfYear
  );
  const overviewService = new OverviewService(yearTransactions.ALL);
  const transactionsByMonth = overviewService.getTransactionsByMonth();
  const transactionsByCategoryAndMonth =
    overviewService.getTransactionsByCategoryAndMonth();

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div>
          <h1>Overview for {year}</h1>
          <h2 className={pageClasses.subHeading}>Yearly Summary</h2>
          <div className={pageClasses.summary}>
            <GrandTotalCard
              title="Total Income"
              description={Formats.amount(overviewService.getTotalIncome())}
            />
            <GrandTotalCard
              title="Total Expense"
              description={Formats.amount(overviewService.getTotalExpense())}
            />
          </div>

          <h2 className={pageClasses.subHeading}>Monthly Breakdown</h2>
          <div className={pageClasses.tableContainer}>
            <table className={pageClasses.table}>
              <thead>
                <tr>
                  <th className={pageClasses.table__fixed}>Category</th>

                  {Array.from({ length: 12 }, (_, i) => {
                    const month = dayjs().month(i).format("MM");
                    const monthName = dayjs().month(i).format("MMM");
                    const key = `${year}${month}`;
                    return (
                      <th className={pageClasses.table__fixed} key={key}>
                        <div>{monthName}</div>
                      </th>
                    );
                  })}
                  <th >Total YTD</th>
                  <th >
                    Avg YTD
                  </th>
                  <th >Avg / 12</th>
                </tr>
              </thead>
              <tfoot>
                <tr>
                  <td className={pageClasses.table__fixed}>Total Income</td>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = dayjs().month(i).format("MM");
                    const key = `${year}${month}`;
                    const total = transactionsByMonth[key]?.totalIncome || 0;
                    return (
                      <td key={key}>
                        <div>{total !== 0 ? Formats.amount(total) : ""}</div>
                      </td>
                    );
                  })}
                  {totalsAvg(transactionsByMonth, "totalIncome")}
                </tr>
                <tr>
                  <td className={pageClasses.table__fixed}>Total Expense</td>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = dayjs().month(i).format("MM");
                    const key = `${year}${month}`;
                    const total = transactionsByMonth[key]?.totalExpense || 0;
                    return (
                      <td key={key}>
                        <div>{total !== 0 ? Formats.amount(total) : ""}</div>
                      </td>
                    );
                  })}
                  {totalsAvg(transactionsByMonth, "totalExpense")}
                </tr>
                <tr>
                  <td className={pageClasses.table__fixed}>Total</td>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = dayjs().month(i).format("MM");
                    const key = `${year}${month}`;
                    const total = transactionsByMonth[key]?.total || 0;
                    return (
                      <td key={key}>
                        <div>
                          <span
                            className={
                              total >= 0
                                ? pageClasses.positive
                                : pageClasses.negative
                            }
                          >
                            {total !== 0 ? Formats.amount(total) : ""}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                  {totalsAvg(transactionsByMonth, "total")}
                </tr>
              </tfoot>
              {Object.keys(transactionsByCategoryAndMonth).map(
                (categoryKey, idx) => {
                  const transactionCategory =
                    transactionsByCategoryAndMonth[categoryKey];

                  return (
                    <tbody key={categoryKey} role="rowgroup">
                      <OverviewRow
                        handleRowClick={() => toggleGroup(idx)}
                        handleColumnClick={toggleDetails}
                        columnState={openDetails}
                        categoryKey={categoryKey}
                        year={year}
                        transaction={transactionCategory}
                        rowKey={`${categoryKey}`}
                        classes={pageClasses.groupHeader}
                      />

                      {openGroups[idx] &&
                        transactionCategory?.children &&
                        Object.keys(transactionCategory.children).map(
                          (childCategoryKey, idx) => {
                            const rowKey = `${categoryKey}-${idx}`;
                            const childTransaction =
                              transactionCategory.children[childCategoryKey];
                            return (
                              <OverviewRow
                                key={rowKey}
                                categoryKey={childCategoryKey}
                                handleColumnClick={toggleDetails}
                                columnState={openDetails}
                                year={year}
                                transaction={childTransaction}
                                rowKey={rowKey}
                                classes={pageClasses.groupItem}
                              />
                            );
                          }
                        )}
                    </tbody>
                  );
                }
              )}
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function totalsAvg(
  transactionsByMonth: TotalsByYearMonth,
  totalType: "total" | "totalExpense" | "totalIncome"
) {
  const monthValues = Object.values(transactionsByMonth);
  // Calculate total income for each month
  const total = monthValues.reduce(
    (acc, month) => acc + (month[totalType] || 0),
    0
  );

  return printTotalColumns(total);
}

function totalsPerCategory(yearMonth: YearMonthRecord) {
  const monthValues = Object.values(yearMonth);

  if (!monthValues.length) return "0.00";
  const total = monthValues.reduce(
    (acc, month) => acc + (month.amount || 0),
    0
  );
  return printTotalColumns(total);
}

function printTotalColumns(total: number) {
   return (
    <>
      <td className={`${pageClasses.overviewColumn}`}>{Formats.amount(total)}</td>
      <td className={`${pageClasses.overviewColumn}`}>{Formats.amount(total / monthsCount)}</td>
      <td className={`${pageClasses.overviewColumn}`}>{Formats.amount(total / 12)}</td>
    </>
  );
}

function OverviewRow(props: {
  categoryKey: string;
  year: number;
  transaction: TransactionMonthDetails;
  rowKey: string;
  columnState: Record<string, boolean>;
  handleRowClick?: () => void;
  handleColumnClick?: (id: string) => void;
  classes?: string;
}) {
  const {
    categoryKey,
    year,
    transaction: childTransaction,
    rowKey,
    handleRowClick: handleRowClick,
    handleColumnClick: handleColumnClick,
    columnState: columnState,
    classes,
  } = props;
  return (
    <>
      <tr key={rowKey} onClick={handleRowClick} className={`${pageClasses.overviewRow} ${classes || ""}`}>
        <td className={pageClasses.table__fixed}>
          <CategoryTag id={categoryKey} />
        </td>
        {OverviewColumn(
          year,
          childTransaction,
          rowKey,
          columnState,
          handleColumnClick
        )}
        {totalsPerCategory(childTransaction.month)}
      </tr>
      {/* TODO Implement row expansion for further details*/}
      {/*_validateColumnState(rowKey, columnState, childTransaction)*/}
    </>
  );
}

/*
function _validateColumnState(
  rowKey: string,
  columnState: Record<string, boolean>,
  childTransaction: TransactionMonthDetails
) {
  const columns = Object.keys(columnState).filter(
    (key) => key.startsWith(rowKey) && columnState[key]
  );

  if (!!columns.length) {
    return (
      <tr>
        <td colSpan={13}>Hay Data!</td>
      </tr>
    );
  }
}
  */

function OverviewColumn(
  year: number,
  transactionCategory: TransactionMonthDetails,
  rowKey: string,
  isDetailsVisible?: Record<string, boolean>,
  handleToggleDetails?: (id: string) => void
) {
  return Array.from({ length: 12 }, (_, colId) => {
    const month = dayjs().month(colId).format("MM");
    const key = `${year}${month}`;
    const transaction = transactionCategory?.month?.[key];
    const colKey = `${rowKey}-${colId}`;
    const expandedClass = isDetailsVisible?.[colKey]
      ? pageClasses.overviewColumn__expanded
      : "";
    // TODO Fix key
    return (
      <td
        key={colKey}
        className={`${pageClasses.overviewColumn} ${expandedClass}`}
      >
        <span
          className={`${pageClasses.transactionAmount}`}
          onClick={(e) => {
            if (handleToggleDetails) handleToggleDetails(colKey);
            // Prevent the click from propagating to the row
            e.stopPropagation();
          }}
        >
          {amountFormat(transaction)}
        </span>
        {isDetailsVisible && isDetailsVisible[colKey] && (
          <div className={pageClasses.transactionDetails}>
            <CompactTransactionList
              transactionList={transaction?.transactionsByType.ALL}
            />
          </div>
        )}
      </td>
    );
  });
}

function amountFormat(transaction: hashItem) {
  return transaction ? Formats.amount(transaction.amount) : "";
}
