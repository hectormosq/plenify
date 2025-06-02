import { Transaction } from "@/app/models/transaction";
import classes from "./CompactTransactionList.module.scss";
import { TransactionService } from "@/app/services/transaction";

export default function CompactTransactionList(props: {
  transactionList: Transaction[];
}) {
  const { transactionList } = props;
  return (
    <div>
      {transactionList && transactionList.length > 0 ? (
        transactionList.map((transaction) => (
          <div key={transaction.id} className={classes.row}>
            <div className={classes.description}>{transaction.description}</div>
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
