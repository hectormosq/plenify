import { useEffect, useState } from "react";

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
    return <div>No items in list</div>;
  }
}
