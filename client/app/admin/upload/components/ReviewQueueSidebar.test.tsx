import { fireEvent, render, screen } from "@testing-library/react";
import ReviewQueueSidebar, { RowSummary } from "./ReviewQueueSidebar";
import { RowState } from "../model/uploadDraft";
import { TransactionType } from "@/app/models/transaction";

jest.mock("@/app/hooks/usePlenifyState", () => ({
  usePlenifyState: () => ({ categories: {} }),
}));

// 25 rows in file order, dated newest-last, so "File order" and "Date (Newest)" differ.
const rows: RowSummary[] = Array.from({ length: 25 }, (_, index) => ({
  index,
  description: `Row ${index + 1}`,
  amount: index + 1,
  transactionType: TransactionType.EXPENSE,
  date: new Date(2026, 8, index + 1),
  tags: [],
}));

const saved: RowState = { skip: false, tags: [], notes: "", transactionId: "t" };

function renderSidebar(activeIndex: number, rowStates: Record<number, RowState> = {}) {
  const props = { rows, rowStates, onSelect: jest.fn() };
  const view = render(<ReviewQueueSidebar {...props} activeIndex={activeIndex} />);
  return {
    setActive: (index: number) =>
      view.rerender(<ReviewQueueSidebar {...props} activeIndex={index} />),
  };
}

function visibleRows() {
  return screen.getAllByText(/^Row \d+$/).map((el) => el.textContent);
}

describe("ReviewQueueSidebar", () => {
  it("lists rows in file order by default", () => {
    renderSidebar(0);
    expect(visibleRows()).toEqual(
      Array.from({ length: 10 }, (_, i) => `Row ${i + 1}`)
    );
  });

  it("opens on the page of the row being reviewed", () => {
    renderSidebar(14);
    expect(visibleRows()).toContain("Row 15");
    expect(visibleRows()).not.toContain("Row 1");
  });

  it("follows the open row to another page", () => {
    const { setActive } = renderSidebar(9);
    expect(visibleRows()).toContain("Row 10");

    setActive(10);
    expect(visibleRows()).toContain("Row 11");
    expect(visibleRows()).not.toContain("Row 10");
  });

  it("stays on a page chosen by hand until asked to go to the current row", () => {
    renderSidebar(0);
    fireEvent.click(screen.getByRole("button", { name: "Go to page 3" }));
    expect(visibleRows()).toContain("Row 21");

    fireEvent.click(screen.getByRole("button", { name: "Go to current transaction" }));
    expect(visibleRows()).toContain("Row 1");
  });

  it("clears the tab and filter when they hide the current row", () => {
    renderSidebar(14, { 14: saved });
    fireEvent.click(screen.getByRole("tab", { name: "Pending 24" }));
    fireEvent.change(screen.getByPlaceholderText("Filter queue (merchant, amount...)"), {
      target: { value: "Row 2" },
    });
    expect(visibleRows()).not.toContain("Row 15");

    fireEvent.click(screen.getByRole("button", { name: "Go to current transaction" }));

    expect(visibleRows()).toContain("Row 15");
    expect(screen.getByRole("tab", { name: "All 25" }).getAttribute("aria-selected")).toBe("true");
  });
});
