type hashItem = {
  categoryKey: string;
  amount: number;
  percentageFromTotal?: number;
  children: Record<string, hashItem>;
  parent?: hashItem;
};
type hashByCategory = Record<string, hashItem>;
type Series = { label: string; value: number; color: string; amount: number };

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

  format() {
    console.log(this._categories);
    let hashByCategory: hashByCategory = {};

    this._transactions.forEach((t) => {
      if (t.tags!.length > this._deepness) {
        this._deepness = t.tags!.length;
      }
      const tags = [...t.tags!];
      this._total += t.amount;
      hashByCategory = this._setHashList(tags, t.amount, hashByCategory);
    });
    console.log(hashByCategory);
    console.log("Grand Total", this._total);
    console.log(this._deepness);

    this._series = Array(this._deepness || 0).fill([]);
    this._createSeries(hashByCategory);
    return this._series;
    // return hashByCategory;
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

  private _createSeries(
    hashByCategory: hashByCategory,
    parentCategory?: hashItem,
    index = 0
  ) {
    let currentTotal = 0;
    const series: Series[] = [];
    if (Object.keys(hashByCategory).length > 0) {
      Object.keys(hashByCategory).forEach((key) => {
        currentTotal += hashByCategory[key].amount;
        series.push({
          label: this._categories[key].name || key,
          value:
            Math.round(
              ((hashByCategory[key].amount * 100) / this._total) * 100
            ) / 100,
          amount: Math.round(hashByCategory[key].amount * 100) / 100,
          color: index && parentCategory ? this._shadeColor(this._categories[parentCategory.categoryKey].color, 95) : this._categories[key].color,
        });

        if (this._deepness > index + 1) {
          this._createSeries(
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
          color: index ? this._shadeColor(this._categories[parentCategory.categoryKey].color, 95) : "#ccc",
        });
      }
      console.log("index");
    }

    if (this._series[index]) {
      this._series[index] = this._series[index].concat(series);
    }
    // return series
  }

  private _shadeColor(color: string, percent: number): string {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.min(255, Math.max(0, Math.round(R + (R * percent) / 100)));
    G = Math.min(255, Math.max(0, Math.round(G + (G * percent) / 100)));
    B = Math.min(255, Math.max(0, Math.round(B + (B * percent) / 100)));

    const RR = R.toString(16).padStart(2, "0");
    const GG = G.toString(16).padStart(2, "0");
    const BB = B.toString(16).padStart(2, "0");
    console.log(`Returning: #${RR}${GG}${BB}`);
    return `#${RR}${GG}${BB}`;
  }
}
