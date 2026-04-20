import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AprilProviders } from "@april/ui";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

describe("App", () => {
  it("renders shell title", () => {
    render(
      <AprilProviders>
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>
      </AprilProviders>,
    );
    expect(screen.getByRole("heading", { name: /April Profile/i })).toBeInTheDocument();
  });
});
