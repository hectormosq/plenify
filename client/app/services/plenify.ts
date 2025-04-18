import { createMergeableStore, MergeableStore } from 'tinybase';
import { createIndexedDbPersister, IndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';
import { v4 } from 'uuid';
import { Transaction } from '../models/transaction';
import { currency } from '../models/currencies';
import { Categories } from '../models/categories';

const STORE = 'plenify';

enum Tables {
  transactions = 'transactions',
  categories = 'categories',
  transactionCategories = 'transactionCategories',
}

const tablesSchema = {
  [Tables.transactions]: {
    date: { type: 'number' },
    description: { type: 'string' },
    amount: { type: 'number' },
    currency: { type: 'string', default: 'EUR' },
  },
  [Tables.categories]: {
    name: { type: 'string' },
    color: { type: 'string' },
  },
  [Tables.transactionCategories]: {
    transaction: { type: 'string' },
    category: { type: 'string' },
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
    console.log('setup');
    const res = await fetch('api/v1/categories');
    if (res.ok) {
      const json = await res.json();
      const { categories, defaultCategory } = json.data;

      this.defaultCategoryId = defaultCategory;
      this.categoryList = categories;

      await this.persister.startAutoLoad([{[Tables.categories]: { ...categories }}, {}]);
      await this.persister.startAutoSave();
    } else {

      return Promise.reject(new Error(`There was a problem trying to load defaultCategories`))
    }
  }

  addTransaction(transaction: Transaction) {
    if (!transaction.tags || transaction.tags.length === 0) {
      const categoryIds = Object.keys(this.categoryList);
      const randomIndex = Math.floor(Math.random() * categoryIds.length);
      transaction.tags = [categoryIds[randomIndex]];

      if (Math.random() > 0.5 && categoryIds.length > 1) {
      let secondRandomIndex;
      do {
        secondRandomIndex = Math.floor(Math.random() * categoryIds.length);
      } while (secondRandomIndex === randomIndex);
      transaction.tags.push(categoryIds[secondRandomIndex]);
      }
    }
    const { date, description, amount, currency = 'EUR', tags = [this.defaultCategoryId!] } = transaction;
    const transactionId = v4();

    this.persister.getStore().transaction(
      () => {
        this.store.setRow(Tables.transactions, transactionId, {
          date: date.getTime(),
          description,
          amount,
         currency,
        });
        for (const tag of tags) {
          this.persister.getStore().setRow(Tables.transactionCategories, v4(), {
            transaction: transactionId,
            category: tag,
          });
        }
      },
    );

    return {[transactionId]: transaction };
  }

  getTransactions(): Transaction[] {
    const transactions = this.persister.getStore().getTable(Tables.transactions);
    const transactionCategories = this.persister.getStore().getTable(Tables.transactionCategories);

    const transactionCategoriesGrouped = Object.values(transactionCategories)
      .map((transactionCat) => transactionCat)
      .reduce((acc, curr) => {
        const transactionId = curr.transaction.toString();
        const categoryId = curr.category.toString();
        return {
          ...acc,
          [transactionId]: [...(acc[transactionId] ?? []), categoryId]
        }
      }, {} as Record<string, string[]>);

    return Object.entries(transactions).map(([id, transaction]) => ({
      id,
      date: new Date(transaction.date.valueOf() as number),
      description: transaction.description.toString(),
      amount: transaction.amount.valueOf() as number,
      currency: transaction.currency.toString() as currency,
      tags: transactionCategoriesGrouped[id],
    }));
  }

  getCategories(): Categories {
    const categoriesRows = this.persister.getStore().getTable(Tables.categories);

    const categories = Object.entries(categoriesRows)
      .map(([id, category]) => ({ [id]: { name: category.name.toString(), color: category.color.toString()}}))
      .reduce((acc, curr) => ({
        ...acc,
        ...curr,
      }), {} as Categories);

    return categories;
  }

  async reset() {
    this.persister.getStore().delTable(Tables.transactionCategories);
    this.persister.getStore().delTable(Tables.transactions);
  }
}
