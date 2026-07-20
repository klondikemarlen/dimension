# Feature Workflow

Use for user-facing feature work that should move through an issue, branch, pull request, review, release, and verification path.

## Intent

**WHY this workflow exists:** Feature work should leave an auditable trail from user story through release instead of disappearing into an unlinked local change.

**WHAT this workflow produces:** A linked issue, branch, PR, reviewed diff, targeted verification, and release/install evidence when the project publishes an artifact.

**Decision Rules:**

- Project-local release and contribution docs win over this generic workflow.
- Create or update a GitHub issue before coding user-facing work unless the user explicitly says not to use issues.
- Keep branches and PRs named for the issue so GitHub links the work automatically.
- Run the smallest checks that cover the changed behavior; do not substitute broad unrelated test runs for missing targeted checks.
- Before requesting review or merging, authors must self-review the complete PR diff and record findings and outcome in the PR.
- Run targeted QA of the user-visible changed behavior and the smallest relevant automated checks; record the exact scenario, observed outcome, and command result in the PR.
- Keep the PR blocked and do not mark it ready or merge while review feedback, QA, or required checks are unresolved.
- For published artifacts, merge first, then perform the project’s documented version/changelog/publish/install verification steps on the release branch.
- Do not claim a publish, deploy, marketplace update, or install succeeded unless a command or remote source confirms it.

## Process

1. Capture the user story and acceptance criteria in a GitHub issue.
2. Record learner coverage for issues that are not clearly learner-authored.
3. Create a branch named for the issue number and short feature slug.
4. Implement the feature against project-local patterns and keep the diff scoped to the story.
5. Open a draft pull request linked to the issue.
6. Self-review the complete PR diff; record findings, any fixups, and a `PASS`/`FAIL`/`BLOCKED` outcome in the PR.
7. Run targeted QA for the user-visible changed behavior and the smallest relevant automated checks; record the exact scenario, observed result, and command output in the PR.
8. Mark the PR ready only after acceptance criteria and current self-review/QA evidence are recorded.
9. Resolve every actionable review finding. After each fixup, repeat self-review and targeted QA.
10. Merge through the project's normal PR path only after review and required checks pass.
11. For published changes, follow the project release docs: version/changelog if required, publish or deploy, poll the remote distribution source until the new version appears, reinstall from the remote source, and verify the installed version.

## Output Contract

Report the concrete artifacts and evidence:

```text
Issue: <url or number>
Branch: <branch>
PR: <url or number>
Learner coverage: <no action, proposed issue, or filed issue link>
Verification: <commands or QA path run>
Release/install: <publish/install/version evidence, or "not published">
```
