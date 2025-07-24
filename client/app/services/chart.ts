import { lighten } from "@mui/material";
import { Categories } from "../models/categories";
import { Transaction, hashByCategory, hashItem } from "../models/transaction";
import { Series } from "../models/chart";
import { TransactionService } from "./transaction";

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

  getTotal() {
    return this._total;
  }

  private _groupTransactionsByCategory(): hashByCategory {
    let hashByCategory: hashByCategory = {};

    this._transactions.forEach((t) => {
      if (t.tags!.length > this._deepness) {
        this._deepness = t.tags!.length;
      }
      this._total += t.amount;
      hashByCategory = TransactionService.createHashList(t, hashByCategory, true);
    });
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
    const factor = percent / 100;
    return lighten(color, factor).toString();
  }

}
