import { Transaction } from "@app/models/transaction";
import moment from "moment";
import CategoryTag from "../categories/CategoryTag";
import classes from "./transaction-list.module.css";
import Link from "next/link";

export default function TransactionList(props: {
  transactionList: Transaction[];
}) {
  const { transactionList } = props;

  return (
    <>
      {transactionList && transactionList.length > 0 ? (
        transactionList.map((transaction) => (
          <div key={transaction.id} className={classes.row}>
            <div className={classes.descriptionContainer}>
              <div>{transaction.description}</div>
              <div className={classes.categories}>
                {transaction.tags &&
                  transaction.tags.map((tag: string) => {
                    return (
                      <CategoryTag
                        id={tag}
                        key={transaction.id! +tag}
                      />
                    );
                  })}
              </div>
            </div>
            <div>{moment(transaction.date).fromNow()}</div>
            <div>{`${transaction.amount} ${transaction.currency}`}</div>
            <Link href={`/admin/add/${transaction.id}`}>Edit</Link>
          </div>
        ))
      ) : (
        <div>No items in list</div>
      )}
    </>
  );
}
