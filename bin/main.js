#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import { program } from "commander";

async function main() {
  program
    .name("juspy")
    .version("0.0.4")
    .description(
      "Merges Python and JavaScript files into a single file that Node and Python can run.",
    )
    .argument("<file1>", "Path to the first file (Python or JavaScript)")
    .argument("<file2>", "Path to the second file (Python or JavaScript)")
    .argument("[output]", "Path to the output file", "out.py.js")
    .parse(process.argv);

  const file1Path = program.args[0];
  const file2Path = program.args[1];
  const outputPath = program.args[2];

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

  if (!hasPython && !hasJS) {
    console.warn(
      `Warning: Both input files have unsupported file extensions. Expected at least one .py or .js file.`,
    );
  } else if (!(hasPython && hasJS)) {
    console.warn(
      `Warning: One of the files has an unsupported extension. Please provide one Python and one JavaScript file.`,
    );
  }

  // Read file contents
  const content1 = await fs.readFile(file1Path, "utf8");
  const content2 = await fs.readFile(file2Path, "utf8");

  // Determine which file is Python and which is JavaScript
  let pythonContent, jsContent;
  let pythonFile, jsFile;

  if (isPython(ext1)) {
    pythonContent = content1;
    jsContent = content2;
    pythonFile = path.basename(file1Path);
    jsFile = path.basename(file2Path);
  } else if (isPython(ext2)) {
    pythonContent = content2;
    jsContent = content1;
    pythonFile = path.basename(file2Path);
    jsFile = path.basename(file1Path);
  } else if (isJavaScript(ext1)) {
    jsContent = content1;
    pythonContent = content2;
    jsFile = path.basename(file1Path);
    pythonFile = path.basename(file2Path);
  } else {
    jsContent = content2;
    pythonContent = content1;
    jsFile = path.basename(file2Path);
    pythonFile = path.basename(file1Path);
  }

  console.log(`Merging ${jsFile} and ${pythonFile} into ${outputPath}...`);

  // Call the merge function
  const merged = mergeFiles(pythonContent, jsContent);

  // Ensure the output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  // Write the result to the output file
  await fs.writeFile(outputPath, merged);
  console.log(`Merged files written to ${outputPath}.`);
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
