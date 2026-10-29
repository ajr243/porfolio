# Portfolio workflow

The user has authorized automatic GitHub publication of completed changes to this website.

- After implementing a requested site change, run appropriate checks, commit the relevant production files, and push to `origin/main` (`https://github.com/ajr243/porfolio.git`) without asking for confirmation again.
- GitHub Pages publishes the root of `main` at https://ajr243.github.io/porfolio/. Check deployment and the live result when possible; report failures honestly.
- Keep local mockups, recovered versions, unrelated changes, credentials, and unused assets out of publication. Stage explicit relevant paths; never indiscriminately stage everything.
- Preserve other work, do not force push, and resolve remote changes safely before pushing.
- Editor saves to tracked production HTML/CSS/JS and assets are published by tools/watch-site.ps1, run by the Portfolio Auto Publish scheduled task. New files must be explicitly added to Git first. The watcher waits for staged agent changes to be committed before acting.
