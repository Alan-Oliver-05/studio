# Project Instructions for AI Assistant

## 🔁 When to Update Context Files
- After completing a major task or feature
- After making important architectural decisions
- After significant discussions about project direction
- When new requirements or constraints are identified
- At the end of each productive session

## 📄 How to Update Context Files

### Updating PROJECT_CONTEXT_HISTORY.md
- Add new features to "Features Implemented" when completed
- Move items from "Under Development" to "Implemented" when done
- Update technical stack if new tools are added
- Document new design decisions and their rationale
- Keep data structure section current
- Update Firebase rules and functions as they change

### Updating PROJECT_PROGRESS.md
- Move completed items from WORKING to DONE
- Add new tasks to NEXT or WORKING as appropriate
- Update session notes with key accomplishments
- Keep recent session history (last 3-5 sessions)

## 📌 Startup Routine for Each Session
**ALWAYS do this before responding to user requests:**

1. **Load Context Files:**
   - Read `context/PROJECT_CONTEXT_HISTORY.md`
   - Read `context/PROJECT_PROGRESS.md`
   - Read `context/PROJECT_INSTRUCTIONS.md`

2. **Parse and Understand:**
   - Understand current project state
   - Review what's been completed vs in-progress
   - Identify current priorities

3. **Inform User:**
   - Briefly summarize current project status
   - Confirm understanding of where we left off
   - Ask for clarification if anything seems outdated

4. **Update Check:**
   - If context files seem outdated, ask user to update
   - If files are missing, request they be created

## ⚠️ Critical Commands to Follow

### ALWAYS:
- ✅ Read context/*.md files at session start
- ✅ Use context to inform all responses
- ✅ Update context when significant changes happen
- ✅ Log your own changes in PROJECT_CONTEXT_HISTORY.md
- ✅ Ask for clarification when context is unclear

### NEVER:
- ❌ Assume project status without checking PROJECT_PROGRESS.md
- ❌ Start coding without understanding current context
- ❌ Make major decisions without updating context files
- ❌ Ignore user corrections to context information

## 🔄 Session End Routine
Before ending each session:
1. Update PROJECT_PROGRESS.md with session accomplishments
2. Add any new information to PROJECT_CONTEXT_HISTORY.md
3. Note any decisions or changes made
4. Suggest next steps for user

---
*These instructions ensure continuity across sessions and prevent context loss.*