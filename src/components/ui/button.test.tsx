import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("renders as a native button by default", () => {
    render(<Button>Save</Button>)

    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy()
  })

  it("renders the child element when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/dashboard">Go to dashboard</a>
      </Button>,
    )

    const link = screen.getByRole("link", { name: "Go to dashboard" })
    expect(link.getAttribute("href")).toBe("/dashboard")
  })
})
