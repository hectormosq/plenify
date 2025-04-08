import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import Home from "@app/page";

describe("Home", () => {
  it("should render the home page", () => {
    render(<Home />);
  });
});
