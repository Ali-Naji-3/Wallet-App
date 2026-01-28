# 🛡️ The Senior DevOps Guide to Absolute Git Safety

### Step 1: The Root Cause (Why work "disappears")
In simple terms, code loss during a restart happens because of three things:
1.  **Buffered Memory:** Your IDE (Cursor/VS Code) keeps changes in "active memory." If you don't save manually, the file on disk is still the old version when the power cuts.
2.  **The Staging "Limbo":** When you run `git add`, files are in a temporary "index." If you don't `git commit`, they aren't part of the database. If your `.git/index` corrupts during a hard shutdown, those staged changes can vanish.
3.  **Branch Desync:** After a restart, Git tools sometimes default back to `main`. If your work was on `p1`, it looks like it's gone. It's not gone—you're just on the wrong branch.

---

### Step 2: Atomic Workflow (The Golden Loop)
For teams and solo devs, follow this **Atomic Loop** every hour:
1.  **STAGE**: `git add .` (Gather all changes).
2.  **COMMIT**: `git commit -m "feat: descriptive message"` (Lock changes into permanent history).
3.  **PUSH**: `git push origin p1` (Move changes to the cloud/server).

---

### Step 3: Terminal Routine Before Shutdown (Copy-Paste)
Run this exact sequence every time you are ready to turn off your computer.

```bash
# 1. See what is left
git status

# 2. Save everything (even unfinished work)
git add .

# 3. Create a recovery commit with a timestamp
git commit -m "wip: saving work before shutdown $(date)"

# 4. Push to origin (Optional but recommended)
git push origin $(git branch --show-current)
```

---

### Step 4: Verification Steps (Proof of Safety)
Don't guess. Verify.
1.  **Check History:** Run `git log -n 1 --stat`. If you see your "wip" commit and the list of files, you are **100% safe**.
2.  **Check Branch:** Run `git branch`. Ensure the `*` is next to your working branch (e.g., `p1`).
3.  **Check Status:** Run `git status`. It should say: `"nothing to commit, working tree clean"`.

---

### Step 5: Common Mistakes
*   **Assuming "Auto-save" worked:** Always `Ctrl+S` manually before a Git commit.
*   **Ignoring "Untracked Files":** If a file is "untracked" (red in `git status`), it is **not protected**. Run `git add` to track it.
*   **Shutdown during a Merge:** Never shut down while Git says `(MASTER|MERGING)`. Finish the merge or run `git merge --abort` first.

---

### Step 6: Professional Pre-Shutdown Checklist
*   [ ] **Manual Save**: All files saved in the editor (no dots on tabs).
*   [ ] **Server Kill**: `Ctrl+C` to stop `npm run dev` (prevents file/DB lock issues).
*   [ ] **Git Status**: Should show no red files.
*   [ ] **Git Commit**: History shows your latest changes.
*   [ ] **Git Push**: Changes are visible on GitHub (The ultimate safe haven).

> **Expert Advice:** Treat your Git history like a "Save Game" in a video game. If you haven't committed, you haven't "saved" your progress. Over-committing is better than under-committing. You can always clean up history later with `git rebase -i`.
