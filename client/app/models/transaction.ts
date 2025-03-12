import { currency } from "./currencies";

export interface Transaction {
  id?: string;
  date: Date;
  description: string;
  amount: number;
  currency?: currency;
  tags?: string[];
}
