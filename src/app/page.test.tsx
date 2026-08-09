import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("サービスの目的と開発環境を表示する", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: "業務の変更と影響を、履歴としてたどれる形へ。",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "開発環境" }),
    ).toBeInTheDocument();
  });
});
