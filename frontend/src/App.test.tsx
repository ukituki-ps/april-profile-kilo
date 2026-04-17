import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AprilProviders } from "@april/ui";
import App from "./App";

describe("App", () => {
  it("renders shell title", () => {
    render(
      <AprilProviders>
        <App />
      </AprilProviders>,
    );
    expect(screen.getByRole("heading", { name: /April — прикладной shell/i })).toBeInTheDocument();
  });
});
