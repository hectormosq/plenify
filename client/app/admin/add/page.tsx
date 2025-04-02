import classes from "./page.module.css";

export default function AdminPage() {
  return (
    <div>
      <form className={classes.form}>
        <div className={classes.row}>
          <p>
            <label htmlFor="amount">Amount</label>
            <input
              type="number"
              id="amount"
              name="amount"
              step="0.01"
              required
            />
          </p>
          <p>
            <label htmlFor="concept">Concept</label>
            <input type="text" id="concept" name="concept" required />
          </p>
          <p>
            <label htmlFor="operation_date">Date</label>
            <input
              type="date"
              id="operation_date"
              name="operation_date"
              required
            />
          </p>
        </div>
        <p className={classes.actions}>
          <button type="submit">Submit</button>
        </p>
      </form>
    </div>
  );
}
