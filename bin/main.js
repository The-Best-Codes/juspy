#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: juspy <file1> <file2> [output-file]");
    console.log(
      "Merges Python and JavaScript files into a single JavaScript file.",
    );
    console.log(
      "The merged file attempts to execute either Python or JavaScript based on a simple condition.",
    );
    process.exit(1);
  }

  const file1Path = args[0];
  const file2Path = args[1];
  const outputPath = args[2] || "out.py.js";

  console.log(`Input File 1: ${file1Path}`);
  console.log(`Input File 2: ${file2Path}`);
  console.log(`Output File: ${outputPath}`);

  // Check if files exist
  try {
    await fs.access(file1Path);
    await fs.access(file2Path);
  } catch (err) {
    console.error(`Error: One or more input files do not exist.`);
    process.exit(1);
  }

  // Get file extensions
  const ext1 = path.extname(file1Path).toLowerCase();
  const ext2 = path.extname(file2Path).toLowerCase();

  // Check if one is Python and one is JavaScript
  const isPython = (ext) => [".py"].includes(ext);
  const isJavaScript = (ext) => [".js", ".cjs", ".mjs"].includes(ext);

  const hasPython = isPython(ext1) || isPython(ext2);
  const hasJS = isJavaScript(ext1) || isJavaScript(ext2);

  if (!(hasPython || hasJS)) {
    console.warn(`Warning: Invalid file extensions detected.`);
  } else if (!(hasPython && hasJS)) {
    console.warn("Warning: Invalid file extension detected.");
  }

  // Read file contents
  const content1 = await fs.readFile(file1Path, "utf8");
  const content2 = await fs.readFile(file2Path, "utf8");

  // Determine which file is Python and which is JavaScript
  let pythonContent, jsContent;
  if (isPython(ext1)) {
    pythonContent = content1;
    jsContent = content2;
  } else if (isPython(ext2)) {
    pythonContent = content2;
    jsContent = content1;
  } else if (isJavaScript(ext1)) {
    jsContent = content1;
    pythonContent = content2;
  } else {
    jsContent = content2;
    pythonContent = content1;
  }

  // Call the merge function (to be defined by the user)
  const merged = mergeFiles(pythonContent, jsContent);

  // Ensure the output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  // Write the result to the output file
  await fs.writeFile(outputPath, merged);
  console.log(`Merged files written to ${outputPath}`);
}

function mergeFiles(pythonContent, jsContent) {
  // Escape Python content for inclusion in a Python exec('''...''') call
  const escapedPythonForExec = pythonContent
    .replace(/\\/g, "\\\\") // Escape backslashes for JS
    .replace(/'/g, "\\'") // Escape single quotes for Python
    .replace(/"/g, '\\"'); // Escape double quotes for JS

  // Wrap the Python content in exec('''...''')
  const execPythonCode = `exec('''${escapedPythonForExec}''')`;

  // Escape the execPythonCode for embedding in a JS string
  const escapedExecPythonCode = execPythonCode
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/"/g, '\\"');

  // Escape JS content as before
  const escapedJsContent = jsContent
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/"/g, '\\"');

  return `eval(["${escapedJsContent}", "${escapedExecPythonCode}" ][(-1 % 2 + 1) >> 1])`;
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
