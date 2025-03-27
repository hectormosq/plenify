import { usePlenifyState } from "@/app/hooks/usePlenifyState";

export default function CategoryTag(props: { id: string; tag: string }) {
  const { categories } = usePlenifyState();
  const { id, tag } = props;
  const categoryObj = categories && categories[tag];
  return (
    <div
      key={`${id}${tag}`}
      style={{
        background: categoryObj?.color,
        display: "flex",
        width: "fit-content",
        padding: "1px 5px",
        borderRadius: "10px",
      }}
    >
      {categoryObj?.name}
    </div>
  );
}
