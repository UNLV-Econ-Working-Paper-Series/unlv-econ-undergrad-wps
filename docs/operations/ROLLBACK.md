# Production rollback runbook

Use this runbook only by an authorized Faculty Sites operator. A rollback changes production and must have an incident or release record.

## Trigger

Rollback when the newly deployed release has a material defect that cannot be safely corrected immediately, including inaccessible core navigation, broken paper access, missing assets, incorrect public metadata, security exposure, or a fingerprint mismatch.

## Required retained material

- previous known-good release ZIP;
- previous ZIP SHA-256 and internal `SHA256SUMS.txt`;
- previous `build-manifest.json`;
- predeployment production backup;
- current failed release fingerprint and incident notes.

## Procedure

1. Stop further deployment changes and record the detection time.
2. Confirm the prior artifact's checksum and fingerprint.
3. Preserve a copy of the failed live tree for diagnosis in access-controlled storage.
4. Extract the prior artifact into a separate staging directory.
5. Verify its internal checksum manifest.
6. Replace the complete live tree using the host's approved atomic method; do not overlay only selected files.
7. Run the production smoke command against the expected prior commit.
8. Confirm homepage, representative paper, CSS/JS, sitemap, robots, mobile menu, Contact, and 404 behavior manually.
9. Record operator, restored commit, checksums, start/end time, reason, and remaining incident owner.
10. Notify the Editorial Board and affected institutional owners through the approved private channel.

If the prior artifact or backup cannot be verified, stop and escalate. Do not guess, reconstruct production from an unreviewed local directory, or use a source archive as the web root.
