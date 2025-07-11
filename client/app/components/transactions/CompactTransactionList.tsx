import { Transaction } from "@/app/models/transaction";
import classes from "./CompactTransactionList.module.scss";
import { TransactionService } from "@/app/services/transaction";
import Link from "next/link";

export default function CompactTransactionList(props: {
  transactionList: Transaction[];
}) {
  const { transactionList } = props;
  return (
    <div>
      {transactionList && transactionList.length > 0 ? (
        transactionList.map((transaction) => (
          <div key={transaction.id} className={classes.row}>
            <Link href={`/admin/add/${transaction.id}`} className={classes.description}>{transaction.description}</Link>
            <div className={classes.amount}>
              {TransactionService.getAmount(transaction, false)}
            </div>
          </div>
        ))
      ) : (
        <div>No items in list</div>
      )}
    </div>
  );
}
