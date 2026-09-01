# Branch protection owner action

Status on August 31, 2026: GitHub returned `404 Branch not protected` for `main`. No protection change was made by this release branch.

After the pull-request CI workflow exists on `main`, a repository administrator should configure a ruleset or branch protection for `main` with:

- pull request required before merge;
- one approving review where practical;
- approval dismissed when the protected diff changes;
- required status check: `Release verification / verify`;
- branch required to be up to date before merge;
- force pushes blocked;
- branch deletion blocked;
- conversation resolution required;
- administrator bypass limited to documented emergencies;
- no routine direct pushes.

The owner should also:

1. disable GitHub Pages for this repository because it is not the Faculty Sites production host and its project-path build was broken at audit time;
2. confirm Actions may run read-only pull-request verification;
3. keep production deployment credentials out of GitHub unless an institutionally approved automated Faculty Sites path is established;
4. record the ruleset URL, effective date, administrator, and emergency process in the private operations record.

Do not mark this action complete until the settings are reread through the GitHub UI or API and an ordinary test pull request is demonstrably blocked from bypassing the required check.
