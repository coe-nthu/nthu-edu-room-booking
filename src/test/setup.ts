import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import React from "react"
import { afterEach, vi } from "vitest"

afterEach(() => {
  cleanup()
})

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
})

Element.prototype.scrollIntoView = vi.fn()

vi.mock("next/image", () => ({
  default: (imageProps: React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string | { src: string }
    fill?: boolean
    priority?: boolean
  }) => {
    const { src, alt, ...props } = imageProps
    delete props.fill
    delete props.priority

    return React.createElement("img", {
      ...props,
      src: typeof src === "string" ? src : src.src,
      alt,
    })
  },
}))

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string
    children: React.ReactNode
  }) => React.createElement("a", { ...props, href }, children),
}))
