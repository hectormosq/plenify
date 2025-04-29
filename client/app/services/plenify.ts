import { createMergeableStore, createQueries, MergeableStore } from "tinybase";
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

const STORE = "plenify";

enum Tables {
  transactions = "transactions",
  categories = "categories",
  transactionCategories = "transactionCategories",
}

const tablesSchema = {
  [Tables.transactions]: {
    date: { type: "number" },
    description: { type: "string" },
    amount: { type: "number" },
    currency: { type: "string", default: DEFAULT_CURRENCY },
    transactionType: { type: "string" },
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

  async setup() {
    const res = await fetch("/api/v1/categories");
    if (res.ok) {
      const json = await res.json();
      const { categories, defaultCategory } = json.data;
      this.defaultCategoryId = defaultCategory;
      this.categoryList = categories;

      await this.persister.startAutoLoad([
        { [Tables.categories]: { ...categories } },
        {},
      ]);
      await this.persister.startAutoSave();
    } else {
      return Promise.reject(
        new Error(`There was a problem trying to load defaultCategories`)
      );
    }
  }

  addTransaction(transaction: Transaction) {
    const {
      date,
      description,
      amount,
      transactionType,
      currency = "EUR",
      tags,
    } = transaction;
    const categories = tags && tags.length ? tags : [this.defaultCategoryId!];
    const transactionId = v4();

    this.persister.getStore().transaction(() => {
      this.store.setRow(Tables.transactions, transactionId, {
        date: date.getTime(),
        description,
        amount,
        currency,
        transactionType,
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

  getTransactions(fromDate: string, toDate: string): TransactionByType {
    const minDate = new Date(fromDate).getTime();
    const maxDate = new Date(toDate).getTime();
    const transactionByType: TransactionByType = {
      [TransactionType.EXPENSE]: [] as Transaction[],
      [TransactionType.INCOME]: [] as Transaction[],
      [UtilsType.ALL]: [] as Transaction[],
    };
    
    const store = this.persister.getStore();

    /*const transactions = this.persister
      .getStore()
      .getTable(Tables.transactions);*/

    const queries = createQueries(store);
    queries.setQueryDefinition(
      "transactionsByDateRange",
      Tables.transactions,
      ({ select, where }) => {
        select("date");
        select("description");
        select("amount");
        select("currency");
        select("transactionType");
        select("id");

        where((getCell) => {
          const dateCell = getCell('date');
          return typeof dateCell === 'number' && (dateCell >= minDate &&  dateCell <= maxDate);
        });
      }
    );
    
    const transactions = queries.getResultTable("transactionsByDateRange")

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

    Object.entries(transactions).forEach(([id, transaction]) => {
      const transactionType =
        transaction.transactionType.valueOf() as TransactionType;
      const currentTransaction = {
        id,
        date: new Date(transaction.date.valueOf() as number),
        description: transaction.description.toString(),
        amount: transaction.amount.valueOf() as number,
        currency: transaction.currency.toString() as currency,
        tags: transactionCategoriesGrouped[id],
        transactionType,
      };

      transactionByType[transactionType].push(currentTransaction);
      transactionByType[UtilsType.ALL].push(currentTransaction);
    });

    return transactionByType;
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
}
