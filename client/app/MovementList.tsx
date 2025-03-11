import { useEffect, useState } from "react";
import styled from "@emotion/styled";

const EmptyList = styled.div`
  color: red;
`;    

export default function MovementList() {
  const [movementList, setMovementList] = useState([]);

  useEffect(() => {
    setMovementList([]);
  }, []);

  if (movementList.length > 0) {
    return movementList.map((movement) => {
      return <div key={movement}>{movement}</div>;
    });
  } else {
    return (
      <>
        <EmptyList>No items in list</EmptyList>
      </>
  );
  }
}
