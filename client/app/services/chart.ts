type hashItem = {
  categoryKey: string;
  amount: number;
  percentageFromTotal?: number;
  children: Record<string, hashItem>;
  parent?: hashItem;
};
type hashByCategory = Record<string, hashItem>;
type Series = { label: string; value: number; color: string; amount: number };

import { lighten } from "@mui/material";
import { Categories } from "../models/categories";
import { Transaction } from "../models/transaction";

export default class ChartService {
  _transactions: Transaction[];
  _total: number = 0;
  _deepness: number = 0;
  _series: Series[][] = [];
  _categories;

  constructor(transactions: Transaction[], categories: Categories) {
    this._transactions = transactions;
    this._categories = categories;
  }

  createSeries() {
    const hashByCategory = this._groupTransactionsByCategory();
    this._series = Array(this._deepness).fill([]);
    this._createSeriesFromHash(hashByCategory);
  }

  getSeries(index: number) {
    return this._series[index] || [];
  }

  private _groupTransactionsByCategory(): hashByCategory {
    let hashByCategory: hashByCategory = {};

    this._transactions.forEach((t) => {
      if (t.tags!.length > this._deepness) {
        this._deepness = t.tags!.length;
      }
      const tags = [...t.tags!];
      this._total += t.amount;
      hashByCategory = this._setHashList(tags, t.amount, hashByCategory);
    });
    return hashByCategory;
  }

  private _setHashList(
    tags: string[],
    amount: number,
    hashByCategory: hashByCategory,
    parent?: hashItem
  ): hashByCategory {
    if (tags.length > 0) {
      const tag: string = tags.shift() as string;
      if (!hashByCategory[tag]) {
        hashByCategory[tag] = { amount: 0, children: {}, categoryKey: tag };
      }
      hashByCategory[tag].parent = parent;
      hashByCategory[tag].amount += amount;
      hashByCategory[tag].children = this._setHashList(
        tags,
        amount,
        hashByCategory[tag].children,
        hashByCategory[tag]
      );
    }
    return hashByCategory;
  }

  private _createSeriesFromHash(
    hashByCategory: hashByCategory,
    parentCategory?: hashItem,
    index = 0
  ) {
    let currentTotal = 0;
    const series: Series[] = [];
    if (Object.keys(hashByCategory).length > 0) {
      Object.keys(hashByCategory).forEach((key) => {
        currentTotal += hashByCategory[key].amount;
        const percentageValue = Math.round(
          ((hashByCategory[key].amount * 100) / this._total) * 100
        ) / 100
        series.push({
          label: this._categories[key].name || key,
          value: percentageValue,
          amount: Math.round(hashByCategory[key].amount * 100) / 100,
          color: index && parentCategory ? this._buildSubGroupColor(this._categories[parentCategory.categoryKey].color, percentageValue) : this._categories[key].color,
        });

        if (this._deepness > index + 1) {
          this._createSeriesFromHash(
            hashByCategory[key].children,
            hashByCategory[key],
            index + 1
          );

        }
      });
    }
    if (index && parentCategory) {
      if (currentTotal < parentCategory.amount) {
        const rest = parentCategory.amount - currentTotal;
        series.push({
          label: "Others",
          value: Math.round(((rest * 100) / this._total) * 100) / 100,
          amount: Math.round(rest * 100) / 100,
          color: index ? this._buildSubGroupColor(this._categories[parentCategory.categoryKey].color, series.length) : "#ccc",
        });
      }
    }

    if (series.length > 0) {
      this._series[index] = this._series[index].concat(series);
    }
  }

  private _buildSubGroupColor(color: string, percent: number): string {
    const factor = percent / 10;
    return lighten(color, factor).toString();
  }

}
