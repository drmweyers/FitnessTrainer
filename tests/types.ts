// Test type definitions
declare namespace Playwright {
  interface Locator {
    swipeLeft?(): Promise<void>
    swipeRight?(): Promise<void>
  }
}

declare namespace Playwright {
  interface Element {
    name?: string
    type?: string
  }
}
