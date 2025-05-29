import classes from "./GrandTotalCard.module.scss";
export default function GrandTotalCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className={classes.card}>
      <div className={classes.cardHeader}>
        <p>{title}</p>
      </div>
      <h2 className={classes.cardDescription}>{description}</h2>
    </div>
  );
}