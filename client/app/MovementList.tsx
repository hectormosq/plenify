import moment from "moment";
import { usePlenifyState } from "./hooks/usePlenifyState";
import { Transaction } from "./models/transaction";
import Loader from "./components/loader";

export default function MovementList() {
  const { loading, transactions, categories, addTransaction, reset } = usePlenifyState();

  const category = (id: string, tag: string) => {
    const categoryObj = categories && categories[tag];
    return (
      <div
        key={`${id}${tag}`}
        style={{ background: categoryObj?.color, display: 'flex', width: 'fit-content', padding: '1px 5px', borderRadius: '10px' }}
      >
        {categoryObj?.name}
      </div>
    )
  }

  const transactionList = transactions && transactions.length > 0
    ? transactions?.map((transaction: Transaction) => (
        <div key={transaction.id}>
          <div>{transaction.description}</div>
          <div>{moment(transaction.date).fromNow()}</div>
          <div>{`${transaction.amount} ${transaction.currency}`}</div>
          { transaction.tags && transaction.tags.map((tag: string) => category(transaction.id!, tag)) }
        </div>))
    : <div>No items in list</div>;

  return (
    <>
      {loading ? <Loader /> : transactionList}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button style={{ padding: '.75rem 2rem', background: 'grey', margin: '10px 0'}} onClick={addTransaction}>Add Transaction</button>
        <button style={{ padding: '.75rem 2rem', background: 'grey', margin: '10px 0'}} onClick={reset}>Delete data</button>
      </div>
    </>
  )
}
