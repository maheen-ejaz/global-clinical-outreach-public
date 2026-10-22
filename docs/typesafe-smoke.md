# TypeSafe development smoke check

The `dev-typesafe-smoke` command sends one fixed synthetic request to
`https://api.typesafe.ai/v1/systemone`. Its fictional state says that the Synthetic Clinical
Observership accepts international medical graduates, and it asks `jev-latest` a `noul`
question about that statement. The script accepts no arguments or caller-provided prompt, has
a 30-second request deadline, rejects redirects, and does not retry.

The binding is limited to Infisical project `1b056234-5b7a-4d98-87a2-635730076e34`,
environment `dev`, path `/TypeSafe` (folder ID
`66891fa3-18ed-48e2-ba02-f20b92be21f0`), and variable `TYPESAFE_API_KEY`. The profile uses
`expand=false` and exposes no passthrough variables. The existing `prod-pipeline` profile
remains separate.

The response must contain only the documented `model`, `answers.is_eligible`, and `usage`
fields. The script checks the model is a non-empty string, the answer type is `noul`, the
probability is between zero and one, and both token counts are nonnegative integers with a
combined maximum of 10,000. Output contains only a fixed success or safe error code; it never
prints the key, response body, or raw error.

Run the offline tests with:

```sh
npm run test:typesafe
```

After the TypeSafe variable is bound at the exact path above and the operator's existing
Infisical user session is available, use the repository runner:

```sh
npm run infisical:preflight -- dev-typesafe-smoke
npm run infisical:run -- dev-typesafe-smoke
```

The preflight is value-hidden. The smoke command reports a missing-key category without
revealing its value when the binding is absent.
