import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const source = await Deno.readTextFile(new URL("./index.ts", import.meta.url));
const start = source.indexOf("function shouldTreatQuoteAsStringDelimiterServer");
const end = source.indexOf("function normalizeFileMapServer");

if (start === -1 || end === -1) {
  throw new Error("Could not locate vibecoder validation helpers in index.ts");
}

const helperModuleSource = [
  'import ts from "npm:typescript@5.8.3";',
  source.slice(start, end),
  "export { autoRepairTruncatedCodeFile, validateFileSyntaxServer, validateAllFilesServer, validateAndAutoRepairFileMapServer };",
].join("\n");

const helpers = await import(
  `data:application/typescript;charset=utf-8,${encodeURIComponent(helperModuleSource)}`
);

const brokenAppTsx = `import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route index element={<Home />} />
      </Routes>>
    </Router>
  );
}

export default App;
`;

Deno.test("rejects malformed closing JSX tags with trailing angle brackets", () => {
  const syntaxError = helpers.validateFileSyntaxServer(brokenAppTsx, "/App.tsx");
  assert(syntaxError);

  const fileCheck = helpers.validateAllFilesServer({ "/App.tsx": brokenAppTsx });
  assertEquals(fileCheck.valid, false);
  assertEquals(fileCheck.errors.length, 1);
});

Deno.test("deterministically repairs the exact </Routes>> regression before commit", () => {
  const repaired = helpers.autoRepairTruncatedCodeFile(brokenAppTsx, "/App.tsx");
  assert(repaired);
  assertEquals(repaired.includes("</Routes>>"), false);
  assertEquals(repaired.includes("</Routes>"), true);

  const prepared = helpers.validateAndAutoRepairFileMapServer({ "/App.tsx": brokenAppTsx });
  assertEquals(prepared.valid, true);
  assertEquals(prepared.fileMap["/App.tsx"].includes("</Routes>>"), false);
  assertEquals(prepared.fileMap["/App.tsx"].includes("</Routes>"), true);
});
