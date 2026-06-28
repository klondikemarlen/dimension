---
description: Analyzes recent code changes to extract learnings about formatting, style, and patterns. Asks for clarification when needed, commits patterns to memory, and updates AGENTS.md for project-wide conventions.
auto_execution_mode: 1
---

## Intent

**WHY this workflow exists:** Manual corrections by users represent valuable implicit knowledge about preferences, patterns, and conventions. Without capturing these learnings, the same corrections must be made repeatedly across conversations.

**WHAT this workflow produces:**
- Memory entries that persist learnings across conversations
- Updates to AGENTS.md for project-wide patterns
- Sharded documentation updates in local README.md files and agents/ folders when detailed guidance belongs near the code
- Updates to relevant workflows with new decision rules
- Explicit externalized knowledge in repository docs or workflow files when the learning should persist beyond the current conversation

**Decision Rules:**
- **`learn` means durable persistence:** When the user explicitly says `learn`, treat that as a request to persist the learning beyond the current conversation
- **Memory vs AGENTS.md:** Use memory for personal preferences; use AGENTS.md for project patterns that should be shared with other developers/agents
- **Externalize durable knowledge:** If the learning should change future agent behavior in this repo, write it down in the appropriate repo file instead of treating a memory entry or verbal acknowledgment as sufficient
- **Sharding rule:** Keep AGENTS.md as an index of cross-cutting conventions; move detailed, domain-specific guidance into local README.md files or agents/ folders near the relevant code and back-link from AGENTS.md
- **Workflow updates:** Only update workflows if the learning represents a reusable decision rule, not a one-off fix
- **Ask before assuming:** When a correction could have multiple interpretations, ask for clarification

---

## Process

Review the most recent file changes made by the user (shown in system reminders) and:

1. **Reflect on the changes**: Identify what changed and understand why it's better
   - Formatting preferences
   - Code style patterns
   - Structural improvements
   - Best practices demonstrated

2. **Ask for clarification** if the reasoning behind any change is unclear or could apply to multiple scenarios

3. **Internalize the learnings**: Explicitly state that you'll remember and apply these patterns going forward

4. **Create memory entry** for the learned patterns to ensure they persist across conversations and can be applied in future work

5. **Externalize the learning in-repo**: If the learning should affect future work in this repository, update the appropriate repo file such as `AGENTS.md`, a nearby `README.md`, or a workflow file. When the user explicitly says `learn`, do not treat a verbal promise or memory entry as sufficient by itself.

6. **Shard detailed guidance first**: If the learning is domain-specific, add it to a local README.md or agents/ file near the relevant code and plan to keep AGENTS.md as a short index

7. **Update AGENTS.md** with a concise cross-cutting rule or a back-link to the new local documentation when the learning should be shared project-wide

8. **Evaluate this workflow**: Consider whether this workflow itself should be tweaked for better pattern extraction or knowledge capture

9. **Update relevant workflows**: If any workflows were used in the current context and could benefit from the learned patterns, update those workflow files with new decision rules in their Intent sections

Format as concise bullet points with clear before/after examples where applicable.
