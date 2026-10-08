import { fireEvent, render, screen } from "@testing-library/react";
import TransactionFormMapper from "./TransactionFormMapper";
import { UploadFileConfigFormValues } from "../model/UploadFile";
import { computeDraftKey, loadDraft, saveDraft } from "../model/uploadDraft";
import { TransactionType } from "@/app/models/transaction";

const mockPush = jest.fn();
const mockService = {
  getTransactionByProps: jest.fn(),
  addTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  updateTransactionAccount: jest.fn(),
  deleteTransaction: jest.fn(),
};

jest.mock("@/app/services", () => ({
  get plenifyService() {
    return mockService;
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/app/hooks/usePlenifyState", () => ({
  usePlenifyState: () => ({ categories: {} }),
}));

jest.mock("@/app/components/categories/CategorySelector", () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) => (
    <button onClick={() => onChange([...value, "cat-added"])}>add category</button>
  ),
}));

jest.mock("./ReviewQueueSidebar", () => ({
  __esModule: true,
  default: ({ rows, onSelect }: { rows: { index: number }[]; onSelect: (index: number) => void }) => (
    <div>
      {rows.map((row) => (
        <button key={row.index} onClick={() => onSelect(row.index)}>
          jump to {row.index}
        </button>
      ))}
    </div>
  ),
}));

const fileRows = [
  ["Date", "Description", "Amount"],
  ["01/09/2026", "Shop A", "-10"],
  ["02/09/2026", "Shop B", "-20"],
  ["03/09/2026", "Salary", "300"],
];

const formValues: UploadFileConfigFormValues = {
  date: { fromIndex: 0 },
  dateFormat: "DDMMYYYY",
  description: { fromIndex: 1 },
  amount: { fromIndex: 2 },
  account: "",
  selectedRow: 1,
  calculatedTransactionType: true,
};

const fileSignature = { label: "Unlabeled import" };
const draftKey = computeDraftKey(fileSignature, fileRows);

const existingMatch = {
  id: "existing-1",
  account: "Old account",
  transactionType: TransactionType.EXPENSE,
  date: new Date(2026, 8, 1),
  description: "Existing shop entry",
  notes: "old note",
  amount: 10,
  tags: ["cat-existing"],
};

function renderMapper() {
  return render(
    <TransactionFormMapper
      fileRows={fileRows}
      formValues={formValues}
      maxLength={3}
      fileName="statement.csv"
      fileSignature={fileSignature}
    />
  );
}

function click(name: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function withMatches() {
  mockService.getTransactionByProps.mockReturnValue({ ALL: [existingMatch] });
}

describe("TransactionFormMapper", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
    let created = 0;
    mockService.getTransactionByProps.mockReturnValue({ ALL: [] });
    mockService.updateTransactionAccount.mockReturnValue(true);
    mockService.addTransaction.mockImplementation(() => {
      created += 1;
      return { [`new-${created}`]: {} };
    });
  });

  it("saves a new transaction and advances to the next row", () => {
    renderMapper();
    screen.getByText(/Row 1 of 3/);

    fireEvent.change(screen.getByPlaceholderText("Add notes..."), {
      target: { value: "my note" },
    });
    click("add category");
    click("Save & Next");

    expect(mockService.addTransaction).toHaveBeenCalledTimes(1);
    expect(mockService.addTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Shop A",
        amount: 10,
        transactionType: TransactionType.EXPENSE,
        notes: "my note",
        tags: ["cat-added"],
      })
    );
    screen.getByText(/Row 2 of 3/);

    const draft = loadDraft(draftKey);
    expect(draft?.currentIndex).toBe(1);
    expect(draft?.rowStates[0]).toEqual({
      skip: false,
      tags: ["cat-added"],
      notes: "my note",
      transactionId: "new-1",
      linked: false,
    });
  });

  it("updates in place when a saved row is edited after Previous", () => {
    renderMapper();
    click("Save & Next");
    click("Previous");
    screen.getByText(/Row 1 of 3/);

    fireEvent.change(screen.getByPlaceholderText("Add notes..."), {
      target: { value: "edited" },
    });
    click("Save & Next");

    expect(mockService.addTransaction).toHaveBeenCalledTimes(1);
    expect(mockService.updateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "new-1", notes: "edited", description: "Shop A" })
    );
  });

  it("deletes the created transaction when a saved row is skipped", () => {
    renderMapper();
    click("Save & Next");
    click("Previous");

    click("Remove & skip");

    expect(mockService.deleteTransaction).toHaveBeenCalledWith("new-1");
    const state = loadDraft(draftKey)?.rowStates[0];
    expect(state?.skip).toBe(true);
    expect(state?.transactionId).toBeUndefined();
    screen.getByText(/Row 2 of 3/);
  });

  it("saves a skipped row when it is reopened and saved", () => {
    renderMapper();
    click("Skip");
    expect(mockService.addTransaction).not.toHaveBeenCalled();

    click("Previous");
    screen.getByText("Skipped");
    click("Save & Next");

    expect(mockService.addTransaction).toHaveBeenCalledTimes(1);
    expect(loadDraft(draftKey)?.rowStates[0]).toEqual(
      expect.objectContaining({ skip: false, transactionId: "new-1" })
    );
  });

  it("saves nothing when a row with possible matches is skipped", () => {
    withMatches();
    renderMapper();

    click("Skip");

    expect(mockService.addTransaction).not.toHaveBeenCalled();
    expect(mockService.updateTransaction).not.toHaveBeenCalled();
    expect(mockService.deleteTransaction).not.toHaveBeenCalled();
    expect(loadDraft(draftKey)?.rowStates[0]?.skip).toBe(true);
  });

  it("adds a new transaction when a row with possible matches is saved as new", () => {
    withMatches();
    renderMapper();

    click("Save as new & Next");

    expect(mockService.addTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Shop A" })
    );
  });

  it("links to an existing transaction and updates it instead of adding", () => {
    withMatches();
    renderMapper();

    click("This is the same transaction");
    screen.getByRole("button", { name: "Linked (click to unlink)" });
    click("Save & Next");

    expect(mockService.addTransaction).not.toHaveBeenCalled();
    expect(mockService.updateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "existing-1",
        description: "Shop A",
        tags: ["cat-existing"],
        notes: "old note",
      })
    );
    expect(loadDraft(draftKey)?.rowStates[0]).toEqual(
      expect.objectContaining({ transactionId: "existing-1", linked: true, skip: false })
    );
  });

  it("removes the copy this import created when the row is linked afterwards", () => {
    withMatches();
    renderMapper();

    click("Save as new & Next");
    expect(mockService.addTransaction).toHaveBeenCalledTimes(1);

    click("Previous");
    click("This is the same transaction");
    click("Save & Next");

    expect(mockService.updateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "existing-1" })
    );
    expect(mockService.deleteTransaction).toHaveBeenCalledWith("new-1");
    expect(mockService.addTransaction).toHaveBeenCalledTimes(1);
  });

  it("adds a new transaction after unlinking, keeping the copied categories", () => {
    withMatches();
    renderMapper();

    click("This is the same transaction");
    click("Linked (click to unlink)");
    click("Save as new & Next");

    expect(mockService.updateTransaction).not.toHaveBeenCalled();
    expect(mockService.addTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Shop A", tags: ["cat-existing"] })
    );
    expect(loadDraft(draftKey)?.rowStates[0]).toEqual(
      expect.objectContaining({ transactionId: "new-1", linked: false })
    );
  });

  it("leaves a linked transaction untouched when the row is skipped", () => {
    withMatches();
    renderMapper();

    click("This is the same transaction");
    click("Skip");

    expect(mockService.addTransaction).not.toHaveBeenCalled();
    expect(mockService.updateTransaction).not.toHaveBeenCalled();
    expect(mockService.deleteTransaction).not.toHaveBeenCalled();
    expect(loadDraft(draftKey)?.rowStates[0]?.linked).toBe(false);
  });

  function renameAccount(value: string) {
    click("Edit account");
    const input = screen.getByPlaceholderText("e.g. Santander Credit Card");
    fireEvent.change(input, { target: { value } });
    fireEvent.blur(input);
  }

  it("applies an account rename to transactions already saved, changing only the account", () => {
    renderMapper();
    click("Save & Next");

    renameAccount("My Bank");

    expect(mockService.updateTransactionAccount).toHaveBeenCalledTimes(1);
    expect(mockService.updateTransactionAccount).toHaveBeenCalledWith("new-1", "My Bank");
    expect(mockService.updateTransaction).not.toHaveBeenCalled();
    screen.getByText("Updated account for 1 already-saved transaction");
    expect(loadDraft(draftKey)?.formValues.account).toBe("My Bank");
  });

  it("applies an account rename to a linked transaction without rewriting it", () => {
    withMatches();
    renderMapper();
    click("This is the same transaction");
    click("Save & Next");
    mockService.updateTransaction.mockClear();

    renameAccount("My Bank");

    expect(mockService.updateTransactionAccount).toHaveBeenCalledWith("existing-1", "My Bank");
    expect(mockService.updateTransaction).not.toHaveBeenCalled();
  });

  it("shows the error and retries on the next blur when the account rename fails", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    renderMapper();
    click("Save & Next");
    mockService.updateTransactionAccount.mockImplementationOnce(() => {
      throw new Error("store unavailable");
    });

    renameAccount("My Bank");
    screen.getByText(
      "Could not update the account on saved transactions: store unavailable"
    );
    expect(loadDraft(draftKey)?.formValues.account).toBe("");

    click("Edit account");
    fireEvent.blur(screen.getByPlaceholderText("e.g. Santander Credit Card"));
    expect(mockService.updateTransactionAccount).toHaveBeenCalledTimes(2);
    expect(loadDraft(draftKey)?.formValues.account).toBe("My Bank");
    consoleError.mockRestore();
  });

  it("keeps unsaved notes and categories while the account is edited", () => {
    renderMapper();
    fireEvent.change(screen.getByPlaceholderText("Add notes..."), {
      target: { value: "unsaved note" },
    });
    click("add category");

    click("Edit account");
    const input = screen.getByPlaceholderText("e.g. Santander Credit Card");
    fireEvent.change(input, { target: { value: "My Bank" } });
    fireEvent.blur(input);

    expect(
      (screen.getByPlaceholderText("Add notes...") as HTMLInputElement).value
    ).toBe("unsaved note");
    click("Save & Next");
    expect(mockService.addTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        account: "My Bank",
        notes: "unsaved note",
        tags: ["cat-added"],
      })
    );
  });

  it("resumes a saved draft at its row with its decisions", () => {
    saveDraft({
      draftKey,
      label: fileSignature.label,
      createdAt: 1,
      fileName: "statement.csv",
      rows: fileRows,
      maxLength: 3,
      formValues,
      currentIndex: 1,
      rowStates: {
        0: { skip: false, tags: ["cat-a"], notes: "kept", transactionId: "saved-1", linked: false },
      },
    });
    renderMapper();
    screen.getByText(/Row 2 of 3/);

    click("Previous");
    expect(
      (screen.getByPlaceholderText("Add notes...") as HTMLInputElement).value
    ).toBe("kept");
    click("Save & Next");

    expect(mockService.updateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "saved-1", tags: ["cat-a"], notes: "kept" })
    );
    expect(mockService.addTransaction).not.toHaveBeenCalled();
  });

  it("jumps to a row picked in the sidebar", () => {
    renderMapper();
    click("jump to 2");
    screen.getByText(/Row 3 of 3/);
  });

  it("offers to finish after the last row when nothing is pending", () => {
    renderMapper();
    click("Save & Next");
    click("Save & Next");
    click("Save & Next");

    screen.getByText("All 3 transactions are reviewed.");
    expect(mockService.addTransaction).toHaveBeenCalledTimes(3);
    expect(loadDraft(draftKey)).not.toBeNull();
    expect(mockPush).not.toHaveBeenCalled();

    click("Finish");
    expect(loadDraft(draftKey)).toBeNull();
    expect(mockPush).toHaveBeenCalledWith("/overview");
  });

  it("goes to the first pending row instead of finishing when rows were jumped over", () => {
    renderMapper();
    click("jump to 2");
    click("Save & Next");

    screen.getByText(/Row 1 of 3/);
    screen.getByText("2 transactions still pending");
    screen.getByText(/1 of 3 reviewed/);
    expect(loadDraft(draftKey)?.currentIndex).toBe(0);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("warns about pending rows before finishing from the menu", () => {
    renderMapper();
    click("Save & Next");
    click("Import actions");
    fireEvent.click(screen.getByRole("menuitem", { name: "Finish import" }));

    screen.getByText(
      "2 transactions of 3 have not been reviewed. If you finish now, they will not be imported."
    );
    click("Finish");

    expect(loadDraft(draftKey)).toBeNull();
    expect(mockPush).toHaveBeenCalledWith("/overview");
  });

  it("can leave with pending rows and keep the draft for later", () => {
    renderMapper();
    click("Save & Next");
    click("Import actions");
    fireEvent.click(screen.getByRole("menuitem", { name: "Finish import" }));
    click("Leave and resume later");

    expect(loadDraft(draftKey)?.currentIndex).toBe(1);
    expect(mockPush).toHaveBeenCalledWith("/overview");
  });

  it("mentions unsaved edits on the open row in the finish dialog", () => {
    renderMapper();
    fireEvent.change(screen.getByPlaceholderText("Add notes..."), {
      target: { value: "not saved" },
    });
    click("Import actions");
    fireEvent.click(screen.getByRole("menuitem", { name: "Finish import" }));

    screen.getByText("The open transaction has changes that are not saved yet.");
  });

  it("discard clears the draft and keeps saved transactions by default", () => {
    renderMapper();
    click("Save & Next");
    click("Import actions");
    fireEvent.click(screen.getByRole("menuitem", { name: "Discard import…" }));
    click("Discard");

    expect(loadDraft(draftKey)).toBeNull();
    expect(mockService.deleteTransaction).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/overview");
  });

  it("discard can also remove what the import created, but never linked transactions", () => {
    mockService.getTransactionByProps
      .mockReturnValueOnce({ ALL: [existingMatch] })
      .mockReturnValue({ ALL: [] });
    renderMapper();
    click("This is the same transaction");
    click("Save & Next");
    click("Save & Next");

    click("Import actions");
    fireEvent.click(screen.getByRole("menuitem", { name: "Discard import…" }));
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Also remove the 1 transaction this import created" })
    );
    click("Discard");

    expect(mockService.deleteTransaction).toHaveBeenCalledTimes(1);
    expect(mockService.deleteTransaction).toHaveBeenCalledWith("new-1");
    expect(loadDraft(draftKey)).toBeNull();
  });

  it("stays on the row and reports when saving fails", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockService.addTransaction.mockImplementation(() => {
      throw new Error("boom");
    });
    renderMapper();
    click("Save & Next");

    screen.getByText(/Row 1 of 3/);
    screen.getByText("Could not save this transaction: boom");
    expect(loadDraft(draftKey)?.rowStates[0]).toBeUndefined();
    consoleError.mockRestore();
  });
});
