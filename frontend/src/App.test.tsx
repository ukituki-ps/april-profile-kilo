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

  it("renders widget demos index with distinct route hints", () => {
    render(
      <AprilProviders>
        <MemoryRouter initialEntries={["/widget-demos"]}>
          <App />
        </MemoryRouter>
      </AprilProviders>,
    );
    expect(screen.getByRole("heading", { name: /@april\/profile-ui/i })).toBeInTheDocument();
    expect(screen.getByText("/profiles-widget-demo")).toBeInTheDocument();
    expect(screen.getByText("/entity-types-api-widget-demo")).toBeInTheDocument();
  });

  it("redirects legacy profiles-widget-list surface route to assembly spec", () => {
    render(
      <AprilProviders>
        <MemoryRouter initialEntries={["/demo/surfaces/profiles-widget-list"]}>
          <App />
        </MemoryRouter>
      </AprilProviders>,
    );
    expect(screen.getByRole("link", { name: "profiles-widget.md" })).toHaveAttribute(
      "href",
      "https://github.com/ukituki-ps/april-profile/blob/develop/docs/widgets/profile/profiles-widget.md",
    );
    expect(screen.getByRole("heading", { name: /profiles-widget — сборка/i })).toBeInTheDocument();
  });

  it("renders doc surface demo for profiles-widget-profile-detail without list column", () => {
    render(
      <AprilProviders>
        <MemoryRouter initialEntries={["/demo/surfaces/profiles-widget-profile-detail"]}>
          <App />
        </MemoryRouter>
      </AprilProviders>,
    );
    expect(screen.getByRole("link", { name: "profiles-widget-profile-detail.md" })).toHaveAttribute(
      "href",
      "https://github.com/ukituki-ps/april-profile/blob/develop/docs/widgets/profile/profiles-widget-profile-detail.md",
    );
    expect(screen.getByRole("heading", { name: /profiles-widget-profile-detail/i })).toBeInTheDocument();
    expect(screen.queryByTestId("profiles-widget-list-column")).not.toBeInTheDocument();
  });
});
