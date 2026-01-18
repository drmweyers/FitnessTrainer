# Bug: ProgramForm Input Value Duplication

## Metadata
- **Severity**: Medium
- **Affected Session**: Session 2 (Frontend)
- **Component**: ProgramForm
- **Test File**: `src/components/features/ProgramBuilder/__tests__/ProgramForm.test.tsx`
- **Date**: 2026-01-17

## Description
When typing into the program name input field in ProgramForm, the value is being duplicated multiple times instead of replacing the previous value. This suggests an issue with how the form state is being managed or updated.

## Reproduction Steps
1. Run frontend tests: `npm test`
2. Observe failing test in `ProgramForm.test.tsx`

## Expected Behavior
When user types "Test Program" into the program name field:
- Input value should be exactly "Test Program"
- State should update with the new value

## Actual Behavior
The input value contains repeated text:
```
Expected: "Test Program"
Received: "Test ProgramTest Program12-Week Strength ProgramTest Program"
```

## Test Evidence
```bash
FAIL EvoFit Frontend Tests src/components/features/ProgramBuilder/__tests__/ProgramForm.test.tsx
  ● ProgramForm - Step 1: Basic Program Info › Form State Management › should update program builder state when form fields change

    expect(element).toHaveValue(Test Program)
    Expected the element to have value:
      Test Program
    Received:
      Test ProgramTest Program12-Week Strength ProgramTest Program

    at Object.<anonymous> (src/components/features/ProgramBuilder/__tests__/ProgramForm.test.tsx:236:25)
```

## Environment
- React: 18.3.1
- Testing Library: 16.0.1
- Jest: 29.7.0
- OS: Windows

## Root Cause Analysis
Possible issues:
1. **State Management Bug**: The form state may be appending instead of replacing
2. **Multiple Event Handlers**: Component may have duplicate onChange handlers
3. **Incorrect React Hook Form Usage**: Form registration may be incorrect
4. **Effect Running Multiple Times**: A `useEffect` may be triggering multiple state updates

Likely location: `src/components/features/ProgramBuilder/ProgramForm.tsx`

## Assigned To
- [x] Session 2 (Frontend)

## Status
- [ ] Open
- [ ] In Progress
- [ ] Fixed - Awaiting Verification
- [ ] Verified - Closed

## Recommended Fix
1. Review `ProgramForm.tsx` for:
   - React Hook Form `register()` usage on the name field
   - Any `useEffect` hooks that might update program name
   - State update logic in `useProgramBuilder` store

2. Common solutions:
   - Ensure only one `onChange` handler is attached
   - Check if state is being updated correctly (not appending)
   - Verify React Hook Form is properly configured
   - Check for `useEffect` dependencies causing re-renders

3. Example fix if using React Hook Form:
   ```typescript
   // Correct usage
   <input
     {...register('name')}
     // No additional onChange handler
   />

   // Incorrect usage (causes duplication)
   <input
     {...register('name')}
     onChange={(e) => setName(e.target.value + name)}  // BUG!
   />
   ```

## Related Files
- `src/components/features/ProgramBuilder/ProgramForm.tsx`
- `src/components/features/ProgramBuilder/__tests__/ProgramForm.test.tsx`
- `src/state/programBuilder.ts` (or wherever program builder state is managed)

## Additional Notes
This is a **MEDIUM** priority issue because it affects user experience (typing in form fields), but the form may still be functional. However, it will confuse users and needs to be fixed before release.
