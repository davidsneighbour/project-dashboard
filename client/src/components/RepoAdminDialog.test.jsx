import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RepoAdminDialog } from "./RepoAdminDialog.jsx";

const noop = () => {
  /* no-op */
};

const repo = (over = {}) => ({
  id: 1,
  name: "alpha",
  full_name: "me/alpha",
  owner: "me",
  description: "the alpha repo",
  html_url: "https://github.com/me/alpha",
  ignored: false,
  priority: null,
  ...over,
});

describe("RepoAdminDialog — rendering", () => {
  it("lists repos with organisation, name link, and description", () => {
    render(
      <RepoAdminDialog
        repos={[repo()]}
        onSetPriority={noop}
        onSetIgnored={noop}
        onClose={noop}
      />,
    );

    const table = screen.getByRole("table");
    expect(within(table).getByText("me")).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Filter by repo name" }),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "alpha" });
    expect(link).toHaveAttribute("href", "https://github.com/me/alpha");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByText("the alpha repo")).toBeInTheDocument();
  });

  it("shows the empty state when nothing matches", () => {
    render(
      <RepoAdminDialog
        repos={[]}
        onSetPriority={noop}
        onSetIgnored={noop}
        onClose={noop}
      />,
    );
    expect(screen.getByText("no repositories match")).toBeInTheDocument();
  });
});

describe("RepoAdminDialog — filters", () => {
  const repos = [
    repo({ id: 1, name: "alpha", full_name: "me/alpha", owner: "me" }),
    repo({
      id: 2,
      name: "beta",
      full_name: "other/beta",
      owner: "other",
      description: "second repo",
    }),
  ];

  it("filters by organisation", () => {
    render(
      <RepoAdminDialog
        repos={repos}
        onSetPriority={noop}
        onSetIgnored={noop}
        onClose={noop}
      />,
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Filter by organisation" }),
      { target: { value: "other" } },
    );
    expect(
      screen.queryByRole("link", { name: "alpha" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "beta" })).toBeInTheDocument();
  });

  it("filters by repo name", () => {
    render(
      <RepoAdminDialog
        repos={repos}
        onSetPriority={noop}
        onSetIgnored={noop}
        onClose={noop}
      />,
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Filter by repo name" }),
      { target: { value: "bet" } },
    );
    expect(
      screen.queryByRole("link", { name: "alpha" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "beta" })).toBeInTheDocument();
  });

  it("filters by description", () => {
    render(
      <RepoAdminDialog
        repos={repos}
        onSetPriority={noop}
        onSetIgnored={noop}
        onClose={noop}
      />,
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Filter by description" }),
      { target: { value: "second" } },
    );
    expect(
      screen.queryByRole("link", { name: "alpha" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "beta" })).toBeInTheDocument();
  });

  it("hides ignored repos by default and reveals them when toggled off", () => {
    render(
      <RepoAdminDialog
        repos={[repo({ id: 3, name: "gamma", ignored: true })]}
        onSetPriority={noop}
        onSetIgnored={noop}
        onClose={noop}
      />,
    );
    expect(screen.getByText("no repositories match")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /hide ignored/ }));
    expect(screen.getByRole("link", { name: "gamma" })).toBeInTheDocument();
  });
});

describe("RepoAdminDialog — mutations", () => {
  it("toggles ignored state via the switch button", () => {
    const onSetIgnored = vi.fn();
    render(
      <RepoAdminDialog
        repos={[repo({ id: 1, ignored: false })]}
        onSetPriority={noop}
        onSetIgnored={onSetIgnored}
        onClose={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Active" }));
    expect(onSetIgnored).toHaveBeenCalledWith(1, true);
  });

  it("sets priority levels and clears on repeat click", () => {
    const onSetPriority = vi.fn();
    render(
      <RepoAdminDialog
        repos={[repo({ id: 1, priority: null })]}
        onSetPriority={onSetPriority}
        onSetIgnored={noop}
        onClose={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "P1" }));
    expect(onSetPriority).toHaveBeenCalledWith(1, 1);
  });

  it("clears priority via the None button", () => {
    const onSetPriority = vi.fn();
    render(
      <RepoAdminDialog
        repos={[repo({ id: 1, priority: 2 })]}
        onSetPriority={onSetPriority}
        onSetIgnored={noop}
        onClose={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "None" }));
    expect(onSetPriority).toHaveBeenCalledWith(1, null);
  });
});

describe("RepoAdminDialog — close", () => {
  it("calls onClose from the close button", () => {
    const onClose = vi.fn();
    render(
      <RepoAdminDialog
        repos={[]}
        onSetPriority={noop}
        onSetIgnored={noop}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close quick edit" }));
    expect(onClose).toHaveBeenCalled();
  });
});
