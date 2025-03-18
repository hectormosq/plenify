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
          <div key={transaction.id} className={classes.list} >
            <div>{transaction.description}</div>
            <div>{moment(transaction.date).fromNow()}</div>
            <div>{`${transaction.amount} ${transaction.currency}`}</div>
            {transaction.tags &&
              transaction.tags.map((tag: string) => {
                return CategoryTag({ id: transaction.id!, tag });
              })}
          </div>
        ))
      ) : (
        <div>No items in list</div>
      )}
    </>
  );
}
