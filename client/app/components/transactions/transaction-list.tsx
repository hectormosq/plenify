import { Transaction } from "@/app/models/transaction";
import moment from "moment";
import CategoryTag from "../categories/category";
import classes from "./transaction-list.module.css";

export default function TransactionList(props: {
  transactionList: Transaction[] | undefined;
}) {
  const { transactionList } = props;

  return (
    <>
      {transactionList && transactionList.length > 0 ? (
        transactionList.map((transaction) => (
          <div key={transaction.id} className={classes.row}>
            <div className={classes.descriptionContainer}>
              <div>{transaction.description}</div>
              {transaction.tags &&
                transaction.tags.map((tag: string) => {
                  return CategoryTag({ id: transaction.id!, tag });
                })}
            </div>
            <div>{moment(transaction.date).fromNow()}</div>
            <div>{`${transaction.amount} ${transaction.currency}`}</div>
          </div>
        ))
      ) : (
        <div>No items in list</div>
      )}
    </>
  );
}
