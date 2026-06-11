import test from "node:test";
import assert from "node:assert/strict";

test("documents GitHub Actions hyphenated input behavior", () => {
  const inputName = "github-token";
  const canonicalKey = `INPUT_${inputName.toUpperCase().replaceAll(" ", "_")}`;

  assert.equal(canonicalKey, "INPUT_GITHUB-TOKEN");
});
