import {
  createMergeableStore,
  createQueries,
  MergeableStore,
  ResultTable,
  Row,
  Where,
} from "tinybase";
import {
  createIndexedDbPersister,
  IndexedDbPersister,
} from "tinybase/persisters/persister-indexed-db";
import { v4 } from "uuid";
import {
  Transaction,
  TransactionByType,
  TransactionType,
  UtilsType,
} from "../models/transaction";
import { currency, DEFAULT_CURRENCY } from "../models/currencies";
import { Categories } from "../models/categories";
import dayjs from "dayjs";

const STORE = "plenify";

enum Tables {
  transactions = "transactions",
  categories = "categories",
  transactionCategories = "transactionCategories",
}

const tablesSchema = {
  [Tables.transactions]: {
    date: { type: "number" },
    account: { type: "string" },
    description: { type: "string" },
    notes: { type: "string" },
    amount: { type: "number" },
    currency: { type: "string", default: DEFAULT_CURRENCY },
    transactionType: { type: "string" },
    createdTs: { type: "number" },
  },
  [Tables.categories]: {
    name: { type: "string" },
    color: { type: "string" },
  },
  [Tables.transactionCategories]: {
    transaction: { type: "string" },
    category: { type: "string" },
  },
} as const;

export default class PlenifyService {
  store: MergeableStore;
  persister: IndexedDbPersister;
  defaultCategoryId?: string;
  categoryList: Categories = {};

  constructor() {
    this.store = createMergeableStore().setSchema(tablesSchema);
    this.persister = createIndexedDbPersister(this.store, STORE);
  }

  private async fetchCategories() {
    const res = await fetch("/api/v1/categories");
    if (!res.ok) {
      throw new Error("There was a problem trying to load defaultCategories");
    }
    const { categories, defaultCategory } = (await res.json()).data;
    this.defaultCategoryId = defaultCategory;
    this.categoryList = categories;
    return categories;
  }

  async setup() {
    const categories = await this.fetchCategories();
    await this.persister.startAutoLoad([
      { [Tables.categories]: { ...categories } },
      {},
    ]);
    await this.persister.startAutoSave();
  }

  async resetCategories() {
    this.persister.getStore().delTable(Tables.categories);
    const categories = await this.fetchCategories();
    this.persister.getStore().setTable(Tables.categories, categories);
  }

  updateTransaction(transaction: Transaction) {
    if (!transaction.id) {
      throw new Error("Transaction ID is required for update");
    }
    const transactionId = transaction.id as string;

    this.deleteTransactionCategories(transactionId);
    return this.addTransaction(transaction);
  }

  deleteTransaction(transactionId: string) {
    this.persister.getStore().delRow(Tables.transactions, transactionId);
    this.deleteTransactionCategories(transactionId);
  }

  deleteTransactionCategories(transactionId: string) {
    const store = this.persister.getStore();

    const query = createQueries(store);
    query.setQueryDefinition(
      "transactionCategoriesByTransactionId",
      Tables.transactionCategories,
      ({ select, where }) => {
        select("transaction");

        where((getCell) => {
          const transactionCell = getCell("transaction");
          return (
            typeof transactionCell === "string" &&
            transactionCell === transactionId
          );
        });
      }
    );

    const transactionCategories = query.getResultTable(
      "transactionCategoriesByTransactionId"
    );
    Object.entries(transactionCategories).forEach(([id]) => {
      this.persister.getStore().delRow(Tables.transactionCategories, id);
    });
  }

  addTransaction(transaction: Transaction) {
    const {
      date,
      account,
      description,
      notes,
      amount,
      transactionType,
      currency = "EUR",
      tags,
      createdTs = new Date().getTime()
    } = transaction;
    const categories = tags && tags.length ? tags : [this.defaultCategoryId!];

    const transactionId = transaction.id ?? v4();
    this.persister.getStore().transaction(() => {
      this.store.setRow(Tables.transactions, transactionId, {
        account: account || "",
        amount,
        date: date.getTime(),
        description,
        notes: notes || "",
        currency,
        transactionType,
        createdTs
      });
      for (const category of categories) {
        this.persister.getStore().setRow(Tables.transactionCategories, v4(), {
          transaction: transactionId,
          category: category,
        });
      }
    });

    return { [transactionId]: transaction };
  }

  getTransaction(id: string): Transaction | undefined {
    const transaction = this.persister
      .getStore()
      .getRow(Tables.transactions, id);

    if (!transaction || Object.keys(transaction).length === 0) {
      return undefined;
    }

    const transactionCategoriesGrouped = this._getTransactionCategories();
    const currentTransaction = this._buildTransactionFromRow(
      id,
      transaction,
      transactionCategoriesGrouped
    );

    return currentTransaction;
  }

  getTransactionByProps(props: Transaction): TransactionByType {
    const normalizedProps = props || {};

    const store = this.persister.getStore();
    const queries = createQueries(store);
    queries.setQueryDefinition(
      "transactionsByProps",
      Tables.transactions,
      ({ select, where }) => {
        select("id");
        select("date");
        select("account");
        select("description");
        select("amount");
        select("currency");
        select("transactionType");

        this._executeWhere(normalizedProps, where);
      }
    );

    const transactions = queries.getResultTable("transactionsByProps");
    return this._formatTransactionByType(transactions);
  }

  private _formatTransactionByType(transactions: ResultTable) {
    const transactionByType: TransactionByType = {
      [TransactionType.EXPENSE]: [] as Transaction[],
      [TransactionType.INCOME]: [] as Transaction[],
      [UtilsType.ALL]: [] as Transaction[],
    };
    const transactionCategoriesGrouped = this._getTransactionCategories();

    Object.entries(transactions).forEach(([id, transaction]) => {
      const transactionType =
        transaction.transactionType.valueOf() as TransactionType;

      const currentTransaction = this._buildTransactionFromRow(
        id,
        transaction,
        transactionCategoriesGrouped
      );

      transactionByType[transactionType].push(currentTransaction);
      transactionByType[UtilsType.ALL].push(currentTransaction);
    });

    return transactionByType;
  }

  getTransactionsByRangeDate(
    fromDate: string,
    toDate: string
  ): TransactionByType {
    const minDate = new Date(fromDate).getTime();
    const maxDate = new Date(toDate).getTime();

    const store = this.persister.getStore();
    const queries = createQueries(store);
    queries.setQueryDefinition(
      "transactionsByDateRange",
      Tables.transactions,
      ({ select, where }) => {
        select("id");
        select("date");
        select("account");
        select("description");
        select("amount");
        select("currency");
        select("transactionType");

        where((getCell) => {
          const dateCell = getCell("date");
          return (
            typeof dateCell === "number" &&
            dateCell >= minDate &&
            dateCell <= maxDate
          );
        });
      }
    );

    const transactions = queries.getResultTable("transactionsByDateRange");
    return this._formatTransactionByType(transactions);
  }

  getCategories(): Categories {
    const categoriesRows = this.persister
      .getStore()
      .getTable(Tables.categories);

    const categories = Object.entries(categoriesRows)
      .map(([id, category]) => ({
        [id]: {
          name: category.name.toString(),
          color: category.color.toString(),
        },
      }))
      .reduce(
        (acc, curr) => ({
          ...acc,
          ...curr,
        }),
        {} as Categories
      );

    return categories;
  }

  async reset() {
    this.persister.getStore().delTable(Tables.transactionCategories);
    this.persister.getStore().delTable(Tables.transactions);
  }

  downloadDb() {
    const values = this.persister.getStore().getJson();
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      values
    )}`;

    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `plenify-${new Date().getTime()}.json`;

    link.click();
  }

  async importDb(json: string) {
    const data = JSON.parse(json);
    
    this._validateSchema(data);

    this.persister.getStore().setJson(json);
    // Ensure persistence
    await this.persister.save();
  }

  private _validateSchema(data: unknown) {
    // 1. Validate General Structure (TinyBase JSON is [Tables, Values])
    if (!Array.isArray(data) || data.length < 1) {
       throw new Error("Invalid backup file: Expected TinyBase JSON format [Tables, Values].");
    }

    const tables = data[0]; 

    // 2. Validate Table Existence
    const expectedTables = Object.values(Tables);
    if (!tables || typeof tables !== 'object') {
       throw new Error("Invalid backup file: Missing tables object."); 
    }
    const hasAllTables = expectedTables.every(table => Object.prototype.hasOwnProperty.call(tables, table));

    if (!hasAllTables) {
      throw new Error("Invalid backup file: Missing required database tables.");
    }

    // 3. Validate Row Data Types against Schema
    for (const [tableName, tableData] of Object.entries(tables)) {
      // Validate if tableName is a valid Table
      if (!Object.values(Tables).includes(tableName as Tables)) {
         continue; // strict: could throw error for unknown tables too
      }
      
      const tableKey = tableName as Tables;
      // Use type assertion to help TS understand we are indexing with a valid key
      const schema = tablesSchema[tableKey] as Record<string, { type: string }>;

      // If it's a known table, validate its rows
      if (schema) {
         if (typeof tableData !== 'object' || tableData === null) {
            throw new Error(`Invalid table format: '${tableName}' is not an object.`);
         }
         
         Object.entries(tableData).forEach(([rowId, row]) => {
            if (typeof row !== 'object' || row === null) {
               throw new Error(`Invalid row format in table '${tableName}', row '${rowId}'.`);
            }
            
            Object.entries(row).forEach(([colName, colValue]) => {
               // Check if column exists in schema
               if (Object.prototype.hasOwnProperty.call(schema, colName)) {
                 const colSchema = schema[colName];
                 const expectedType = colSchema.type;
                 const actualType = typeof colValue;

                 if (expectedType !== actualType) {
                   throw new Error(
                     `Schema Validation Error - Table: '${tableName}', Row: '${rowId}', Column: '${colName}'. ` +
                     `Expected type '${expectedType}', got '${actualType}'.`
                   );
                 }
               }
            });
         });
      }
    }
  }

  private _buildTransactionFromRow(
    id: string,
    transaction: Row,
    transactionCategoriesGrouped: Record<string, string[]>
  ) {
    return {
      id,
      account: transaction.account?.toString() || "",
      date: new Date(transaction.date.valueOf() as number),
      description: transaction.description.toString(),
      amount: transaction.amount.valueOf() as number,
      currency: transaction.currency.toString() as currency,
      tags: transactionCategoriesGrouped[id],
      transactionType: transaction.transactionType.valueOf() as TransactionType,
    };
  }

  private _executeWhere(normalizedProps: Transaction, where: Where) {
    const queryWhitelist = [
      "amount",
      "transactionType",
      { key: "date", type: "rangeDate" },
    ];

    queryWhitelist.forEach((queryItem) => {
      const key = typeof queryItem === "object" ? queryItem.key : queryItem;

      const formProp = normalizedProps[key as keyof Transaction];
      if (formProp !== undefined && formProp !== null) {
        const type = typeof queryItem === "object" ? queryItem.type : undefined;

        this._executeWhereConditionByType(where, key, formProp, type);
      }
    });
  }

  private _executeWhereConditionByType(
    where: Where,
    key: string,
    formProp: unknown,
    type?: string
  ) {
    if (
      type === "rangeDate"
    ) {
      const date = dayjs(formProp as Date);
      const minDate = date.subtract(1, "day").startOf("day").valueOf();
      const maxDate = date.add(1, "day").endOf("day").valueOf();
      where((getCell) => {
        const dateCell = getCell(key);
        return typeof dateCell === "number" && dateCell >= minDate && dateCell <= maxDate;
      });
    } else {
      where((getCell) => {
        const value = getCell(key);
        return value === formProp;
      });
    }
  }

  private _getTransactionCategories() {
    const transactionCategories = this.persister
      .getStore()
      .getTable(Tables.transactionCategories);

    const transactionCategoriesGrouped = Object.values(transactionCategories)
      .map((transactionCat) => transactionCat)
      .reduce((acc, curr) => {
        const transactionId = curr.transaction.toString();
        const categoryId = curr.category.toString();
        return {
          ...acc,
          [transactionId]: [...(acc[transactionId] ?? []), categoryId],
        };
      }, {} as Record<string, string[]>);
    return transactionCategoriesGrouped;
  }
}
