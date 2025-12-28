#!/usr/bin/env node

/**
 * Test Help Script
 * Provides guidance on running tests and understanding test failures
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

const log = (color, text) => console.log(`${color}${text}${colors.reset}`)

console.log('\n')
log(
  colors.cyan,
  '═══════════════════════════════════════════════════════════════'
)
log(
  colors.bright,
  '                    📋 TODO APP TEST GUIDE                      '
)
log(
  colors.cyan,
  '═══════════════════════════════════════════════════════════════'
)
console.log('\n')

log(colors.green, '🚀 AVAILABLE TEST COMMANDS:')
console.log('')
console.log('  npm run test           - Run tests in watch mode (interactive)')
console.log('  npm run test:run       - Run all tests once and exit')
console.log('  npm run test:ui        - Open visual test UI in browser')
console.log('  npm run test:verbose   - Run tests with detailed output')
console.log(
  '  npm run test:debug     - Run tests with verbose output (no coverage)'
)
console.log('  npm run test:coverage  - Run tests with code coverage report')
console.log('  npm run test:watch     - Watch mode with verbose output')
console.log('  npm run test:failed    - Run only changed/failed tests')
console.log('')

log(colors.yellow, '🔍 RUNNING SPECIFIC TESTS:')
console.log('')
console.log('  npm run test -- TaskCard        - Run tests matching "TaskCard"')
console.log(
  '  npm run test -- src/test/components  - Run tests in specific folder'
)
console.log(
  '  npm run test -- --grep "should render"  - Run tests matching description'
)
console.log('')

log(colors.blue, '🐛 UNDERSTANDING TEST FAILURES:')
console.log('')
console.log('  Common issues and fixes:')
console.log('')
console.log('  ❌ "Cannot find module"')
console.log('     → Check import paths are correct')
console.log('     → Ensure the file exists at the specified path')
console.log('')
console.log('  ❌ "Element not found" / "Unable to find element"')
console.log('     → Component may not be rendering correctly')
console.log('     → Check if element has correct test-id or role')
console.log('     → Use screen.debug() to see rendered output')
console.log('')
console.log('  ❌ "Expected X but received Y"')
console.log('     → Assertion mismatch - check expected vs actual values')
console.log('     → Review component logic for bugs')
console.log('')
console.log('  ❌ "Act warning"')
console.log('     → Wrap state updates in act() or use waitFor()')
console.log('     → Async operations need proper handling')
console.log('')
console.log('  ❌ "Mock not called"')
console.log('     → Verify mock is set up before component renders')
console.log('     → Check function is actually being called')
console.log('')

log(colors.cyan, '💡 DEBUGGING TIPS:')
console.log('')
console.log('  1. Use screen.debug() to see rendered HTML')
console.log('  2. Add console.log() in tests to trace execution')
console.log('  3. Run single test with: npm run test -- -t "test name"')
console.log('  4. Use test:ui for visual debugging in browser')
console.log('  5. Check test setup in src/test/setup.js')
console.log('')

log(colors.green, '📁 TEST FILE STRUCTURE:')
console.log('')
console.log('  src/test/')
console.log('  ├── setup.js          - Global test configuration')
console.log('  ├── utils.jsx         - Test utilities and helpers')
console.log('  ├── components/       - Component tests')
console.log('  ├── context/          - Context tests')
console.log('  ├── services/         - Service tests')
console.log('  └── utils/            - Utility function tests')
console.log('')

log(colors.yellow, '📖 WRITING NEW TESTS:')
console.log('')
console.log('  Example test structure:')
console.log('')
console.log('  import { describe, it, expect } from "vitest"')
console.log('  import { render, screen } from "@testing-library/react"')
console.log('  import MyComponent from "../../components/MyComponent"')
console.log('')
console.log('  describe("MyComponent", () => {')
console.log('    it("should render correctly", () => {')
console.log('      render(<MyComponent />)')
console.log('      expect(screen.getByText("Hello")).toBeInTheDocument()')
console.log('    })')
console.log('  })')
console.log('')

log(
  colors.cyan,
  '═══════════════════════════════════════════════════════════════'
)
console.log('\n')
