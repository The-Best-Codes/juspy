# Juspy

_Inspired by [Polycompiler](https://github.com/EvanZhouDev/polycompiler)_.

Merges Python and JavaScript code into a single file capable of running with Node.js and Python 3.

**Example:**

The following code will print `Hello JS` when run with Node.js and `Hello Python` when run with Python 3:

```py
eval(["console.log('Hello JS')", "print('Hello Python')"][(-1 % 2 + 1) >> 1])
```

## Installation & Usage

Here's how to get started with `juspy`.

### Installation (NPM)

Install `juspy` globally using npm:

```bash
npm install -g juspy
```

### Merging Files

Use the `juspy` command to merge your JavaScript and Python files. Specify the input JavaScript file, the input Python file, and the desired output file path.

```bash
juspy in.js in.py out.py.js
```

**Explanation:**

- `in.js`: Path to your JavaScript file.
- `in.py`: Path to your Python file.
- `out.py.js`: Path to the merged output file.

**Behavior:**

- **Node.js:** Executing the output file with Node.js will run the JavaScript code from `in.js`.
- **Python:** Executing the output file with Python 3 will run the Python code from `in.py`.

**Note on File Extension:**

The output file extension is currently fixed to `.py.js`. This is because Node.js typically only executes files with a `.js` extension, ensuring compatibility.

### Testing

Verify the merged file executes correctly in both environments.

**Node.js:**

```bash
node out.py.js
```

This should execute the JavaScript code.

**Python:**

```bash
python3 out.py.js
```

This should execute the Python code.
