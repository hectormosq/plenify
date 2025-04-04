import { usePlenifyState } from "@/app/hooks/usePlenifyState";
import { Chip, styled } from "@mui/material";

export default function CategoryTag(props: {
  id: string;
  handleDeleteCategory?: (id: string) => void;
}) {
  const { categories } = usePlenifyState();
  const { id, handleDeleteCategory } = props;
  const categoryObj = categories && categories[id];
  const conditionalOnDelete = () => {
    if (handleDeleteCategory) {
      return {
        onDelete: () => handleDeleteCategory(id),
      };
    }
    return {};
  };
  return (
    <>
      <StyledChip
        label={categoryObj.name}
        variant="outlined"
        style={{
          color: categoryObj.color,
          borderColor: categoryObj.color,
        }}
        {...conditionalOnDelete()}
      />
    </>
  );
}

const StyledChip = styled(Chip)`
  & .MuiChip-deleteIcon {
    color: inherit;
  }
`;
