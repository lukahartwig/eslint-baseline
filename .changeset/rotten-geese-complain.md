---
"eslint-baseline": minor
---

Added a hash based approach to identify known lint violations. This should be an improvement over the location based approach however it might lead to performance problems due to the hashing algorithm.
