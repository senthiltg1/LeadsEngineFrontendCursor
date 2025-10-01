# Workflow Notes

**Last Updated:** 2025-10-01

## Documentation Workflow Agreement

### When to Add JSDoc/HTML Comments

**Process:**
1. Implement feature/fix
2. Test functionality
3. User approves that code is working
4. **THEN** add comprehensive JSDoc and HTML comments
5. User reviews and approves documentation

**Rationale:**
- Don't document code that might change
- Ensure comments describe working, tested code
- User confirmation prevents wasted documentation effort
- Cleaner commit history

### Implementation Checklist

For every feature/fix:

- [ ] Implement code
- [ ] Test functionality
- [ ] **Ask user: "Code is working, should I add JSDoc/HTML comments now?"**
- [ ] User approves
- [ ] Add comprehensive comments
- [ ] User reviews comments
- [ ] Commit with documentation

### Example Exchange

```
Developer: "Note creation is working. Should I add JSDoc/HTML comments now?"
User: "Yes, please add the comments."
Developer: [Adds comprehensive JSDoc and HTML comments]
Developer: "Comments added. Please review."
User: "Looks good, approved."
Developer: [Commits code + documentation together]
```

### What to Document (When Approved)

**JSDoc Comments:**
- All function signatures
- Parameter types and descriptions
- Return types and values
- Example usage
- Important notes/gotchas

**HTML Comments:**
- Major sections (nav, filters, modals, etc.)
- Purpose of each section
- Dependencies
- Special behavior

### Workflow for Current Session

**Current Status:**
- Features 1-2 implemented and working
- User approved functionality
- **Now adding comprehensive JSDoc/HTML comments**

**Next Features:**
- Implement Feature 2 (Lead List Filters)
- Test and get user approval
- Ask: "Should I add comments now?"
- Add comments after approval

---

**End of Workflow Notes**
