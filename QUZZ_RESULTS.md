# 🐍 Python Basics Quiz
*Created: February 19, 2026*

---

## Part 1: Variables & Data Types

### Q1: What is a variable in Python?
A) A container for storing data values
B) A named memory location in computer
C) A function that performs calculations
D) A way to repeat code efficiently

**Answer: B** - A variable is a named memory location that stores a value.

---

### Q2: Which of the following are valid Python variable names?
A) 2variable
B) _my_name
C) my-name
D) my name

**Answer: C** - `_my_name` is valid. `2variable` cannot start with a number and `my-name` contains a space.

---

### Q3: What does the following code output?
```python
x = 5
y = "10"
z = x + int(y)
```
A) "105"
B) 15
C) TypeError
D) "510"

**Answer: B** - `x = 5`, `y = "10"`, then `z = x + int(y)` = `5 + 10` = 15`.

---

### Q4: What data type does `int()` convert a value to?
A) String
B) Integer
C) Float
D) Boolean

**Answer: B** - `int()` converts to integer (whole number).

---

### Q5: What is the result of `type(3.14)`?
A) <class 'int'>
B) <class 'float'>
C) float
D) <class 'str'>

**Answer: B** - `type(3.14)` returns `<class 'float'>`.

---

### Q6: Which of these data type conversions will raise an error?
A) int("hello")
B) float("3.14")
C) int("3.99")
D) str(123)

**Answer: A** - `int("hello")` raises a `ValueError` because "hello" cannot be converted to integer.

---

### Q7: What is `None` in Python?
A) The same as 0 (zero)
B) An empty string ""
C) The absence of a value
D) A boolean False

**Answer: C** - `None` represents the absence of a value. It is different from `0` or `False`.

---

### Q8: How do you create a boolean variable in Python?
A) `x = boolean`
B) `x = True`
C) `x = "True"`
D) `x = 1`

**Answer: B** - `x = True` (capitalized) creates a boolean. Strings and numbers are not booleans.

---

### Q9: What will `type()` return for `True`?
A) <class 'int'>
B) <class 'bool'>
C) bool
D) True

**Answer: B** - `type(True)` returns `<class 'bool'>`.

---

### Q10: Which of these is a valid boolean expression in Python?
A) `x = 5 and y = 10; x == y or not z`
B) `x = 5 and y = 10; x > y and z < x`
C) `x = "hello"; x is True`
D) `x = False or True`

**Answer: B** - In Python, `x > y and z < x` is a valid boolean expression. `x is True` is invalid for boolean.

---

## Part 2: Data Structures (Lists, Tuples, Dicts)

### Q11: What is the index of the last element in this list?
```python
fruits = ['apple', 'banana', 'cherry', 'date']
```
A) 0
B) 1
C) 3
D) 4

**Answer: C** - Lists are zero-indexed. The last element is at index 3.

---

### Q12: What does `len(fruits)` return?
A) 3
B) 4
C) '4'
D) None

**Answer: B** - `len()` returns the number of items (4).

---

### Q13: What is the result of this code?
```python
fruits.append('elderberry')
fruits[1] = 'grape'
```
A) ['apple', 'banana', 'cherry', 'date', 'elderberry', 'grape']
B) ['apple', 'grape', 'banana', 'cherry', 'date', 'elderberry']
C) ['apple', 'elderberry', 'banana', 'cherry', 'date', 'grape']
D) ['apple', 'banana', 'cherry', 'date', 'elderberry', 'grape']

**Answer: B** - `append()` adds to the end. Then `fruits[1] = 'grape'` overwrites index 1.

---

### Q14: What does `fruits[0]` return?
```python
fruits = ['apple', 'banana', 'cherry']
fruits[0] = 'elderberry'
```
A) 'apple'
B) 'elderberry'
C) IndexError
D) 'banana'

**Answer: A** - After the modification, `fruits[0]` is 'elderberry'.

---

### Q15: What does `fruits[-1]` return?
```python
fruits = ['apple', 'banana', 'cherry', 'date']
```
A) 'apple'
B) 'cherry'
C) 'date'
D) 'banana'

**Answer: C** - `fruits[-1]` gets the last element: 'date'.

---

### Q16: What will `fruits[1:3]` return?
```python
fruits = ['apple', 'banana', 'cherry', 'date', 'elderberry']
```
A) ['cherry', 'date']
B) ['banana', 'cherry', 'date']
C) ['cherry', 'date']
D) ['banana', 'cherry', 'date', 'elderberry']

**Answer: A** - Slicing `[1:3]` includes index 1 and excludes index 3, so returns `['cherry', 'date']`.

---

### Q17: What is the difference between a list and a tuple?
A) Lists are mutable, tuples are immutable
B) Lists use [], tuples use ()
C) Both can contain mixed types
D) There is no difference in Python

**Answer: A** - The key difference is that lists are **mutable** (can be changed after creation) while tuples are **immutable** (cannot be changed).

---

### Q18: Which operation will change a tuple?
```python
my_tuple = (1, 2, 3)
my_tuple[0] = 4
```
A) `(4, 2, 3)`
B) `TypeError: 'tuple' object does not support item assignment`
C) `(1, 4, 3)`
D) `(1, 2, 3, 4)`

**Answer: B** - Tuples are immutable, so you cannot assign to elements. `my_tuple.append(4)` would also raise an error.

---

### Q19: What is the result of `len(my_tuple)`?
```python
my_tuple = (1, 2, 3, 4, 5)
```
A) 5
B) 4
C) 6
D) None

**Answer: A** - `len()` works on tuples too, returning the number of elements: 5.

---

### Q20: How do you create a tuple from a list?
```python
my_list = [1, 2, 3]
```
A) `tuple(my_list)`
B) `my_tuple = (my_list)`
C) `my_tuple = tuple(my_list)`
D) `my_tuple = [1, 2, 3]`

**Answer: C** - `my_tuple = tuple(my_list)` is the correct way. Option A is a function that exists but the syntax `tuple(...)` is not valid.

---

### Q21: What does `list1 * 2` do?
```python
list1 = [1, 2]
list2 = list1 * 2
```
A) `[2, 4]`
B) `[1, 2] * [1, 2]` (same list object)
C) `[1, 2, 2, 1, 2]`
D) `[[1, 2], [1, 2]]`

**Answer: A** - The `*` operator repeats the list. `[1, 2] * 2` = [2, 4]`.

---

### Q22: What does `list1 + list2` do?
```python
list1 = [1, 2]
list2 = [3, 4]
list3 = list1 + list2
```
A) `[4, 6]`
B) `[1, 2, 3, 4]`
C) `[[1, 2], [3, 4]]`
D) `[1, 2, 3, 4].extend([5, 6])`

**Answer: B** - List concatenation with `+` joins the lists element by element.

---

### Q23: What method removes an element by value from a list?
```python
colors = ['red', 'green', 'blue']
colors.remove('red')
```
A) `['green', 'blue']`
B) `['red', 'green', 'blue']`
C) `[]`
D) Raises ValueError

**Answer: A** - `.remove()` removes the **first occurrence** of the value. Since there's only one 'red', the result is `['green', 'blue']`.

---

### Q24: What method removes an element by index from a list?
```python
colors = ['red', 'green', 'blue']
```
A) `del colors[1]`
B) `colors.pop(1)`
C) `colors.remove(0)`
D) `colors.splice(1)`

**Answer: B** - `colors.pop(1)` removes and returns the element at index 1. `del` also works but doesn't return a value.

---

### Q25: What does `colors[-1]` return (before any removal)?
```python
colors = ['red', 'green', 'blue']
```
A) 'red'
B) 'green'
C) 'blue'
D) IndexError

**Answer: A** - Negative indexing starts from the end, so `[-1]` is 'blue'.

---

### Q26: What is the result of `'2' in [1, 2, 3]`?
A) True
B) False
C) TypeError
D) '2'

**Answer: A** - The `in` operator checks if the left side exists in the right iterable. `2` is in the list.

---

## Part 3: Dictionaries

### Q27: How do you create an empty dictionary?
A) `{}`
B) `dict()`
C) `[]`
D) `Dictionary()`

**Answer: A and B** - Both `{} and `dict()` create empty dictionaries. `dict()` is the explicit constructor.

---

### Q28: What does this code do?
```python
scores = {'alice': 95, 'bob': 87}
scores['charlie'] = 92
```
A) Adds a new key-value pair
B) Updates an existing key
C) Raises KeyError
D) Creates a new dictionary

**Answer: A** - `scores['charlie'] = 92` adds a new key 'charlie' with value 92 to the dictionary.

---

### Q29: What method returns all keys from a dictionary?
```python
scores = {'alice': 95, 'bob': 87, 'charlie': 92}
```
A) `scores.keys()`
B) `scores.items()`
C) `scores.values()`
D) `list(scores)`

**Answer: A** - `.keys()` returns a view object of all keys in the dictionary.

---

### Q30: What method returns all key-value pairs from a dictionary?
```python
scores = {'alice': 95, 'bob': 87, 'charlie': 92}
```
A) `scores.items()`
B) `scores.values()`
C) `scores.get()`
D) `list(scores)`

**Answer: A** - `.items()` returns a view object of all key-value pairs as tuples.

---

### Q31: What does `scores.get('alice')` return?
A) 95
B) `'alice'`
C) None
D) 87

**Answer: A** - `dict.get(key)` returns the value for that key. If not found, it returns `None`.

---

### Q32: What does `scores.get('david', 0)` return?
```python
scores = {'alice': 95, 'bob': 87, 'charlie': 92}
```
A) 0
B) None
C) 'david'
D) KeyError

**Answer: A** - `.get(key, default)` returns the default value if the key doesn't exist, without raising an error.

---

### Q33: What does `len(scores)` return?
```python
scores = {'alice': 95, 'bob': 87, 'charlie': 92}
```
A) 3
B) 95
C) TypeError
D) 'alice'

**Answer: A** - `len()` on a dictionary returns the number of key-value pairs.

---

## Part 4: Input & Output

### Q34: What function is used to get user input from the console?
A) `input()`
B) `print()`
C) `read()`
D) `scan()`

**Answer: A** - `input()` prompts the user and returns their input as a string.

---

### Q35: What does `input("Enter your name: ")` do?
A) Prints "Enter your name: " and waits for input
B) Displays a dialog box with "Enter your name: "
C) Returns the entered name as a string
D) Raises an error if user cancels

**Answer: B** - The `prompt` argument is displayed, and the function blocks until the user presses Enter.

---

### Q36: What function is used to display output to the console?
A) `input()`
B) `console.log()`
C) `display()`
D) `print()`

**Answer: D** - `print()` sends output to the console (or standard output). Note: `console.log()` is JavaScript, not Python.

---

### Q37: What does `print("Hello", "World")` output?
A) `Hello World`
B) `HelloWorld`
C) `HelloWorld` (no space)
D) `Hello, World`

**Answer: A** - Multiple arguments in `print()` are separated by a space by default.

---

### Q38: What is an f-string in Python?
A) `"Value: {variable}"`
B) `f"Value: {variable}"`
C) `f'Value: {variable}'`
D) `printf("Value: %s", variable)`

**Answer: A** - f-strings are string literals prefixed with `f`, like `f"Value: {x}"`. They evaluate expressions inside `{}`.

---

### Q39: What does `print(f"The price is ${price}")` output if `price = 99.99`?
A) `The price is ${price}`
B) `The price is $99.99`
C) `The price is 99.99`
D) `The price is $99.99`

**Answer: B** - f-strings in Python use `{}` for variable interpolation, not `${}` (that's JavaScript). So `${price}` becomes the literal string.

---

### Q40: What function is used to convert a value to a string?
A) `str()`
B) `string()`
C) `text()`
D) `cast()`

**Answer: A** - `str()` converts any value to its string representation.

---

### Q41: What is the output of `print(3 + "2")`?
A) `32`
B) `5`
C) TypeError
D) `"32"`

**Answer: B** - Python converts `3` to string, resulting in `'32'`. `3 + "2"` is string concatenation.

---

### Q42: What does `print("10" + "20")` output?
A) `1020`
B) `30`
C) `"1020"`
D) `TypeError: can only concatenate str (not "int") to str`

**Answer: A** - `"10" + "20"` concatenates the strings to `"1020"`.

---

### Q43: What is the output of `int("3.14")`?
A) `3.14`
B) `3`
C) `3`
D) `4`

**Answer: B** - `int("3.14")` truncates to `3` (it doesn't round). `float()` or `int(float("3.14"))` would give `3`.

---

### Q44: What does `print(type(3.14))` output?
A) `float`
B) `int`
C) `<class 'float'>`
D) `3.14`

**Answer: C** - `type()` returns a type object. The output would look like `<class 'float'>`.

---

### Q45: What is the output of `bool(1)`?
A) `True`
B) `1`
C) `<class 'bool'>`
D) `False`

**Answer: A** - `bool(1)` returns the boolean `True`.

---

### Q46: What does `bool(0)` return?
A) `True`
B) `0`
C) `False`
D) `<class 'bool'>`

**Answer: C** - `bool(0)` returns `False`. Note: `0` evaluates to `False` in boolean context.

---

### Q47: What does `bool("")` return?
A) `True`
B) `False`
C) `0`
D) None

**Answer: B** - `bool("")` returns `False`. Empty strings are falsy in Python.

---

### Q48: What does `bool("hello")` return?
A) `True`
B) `False`
C) `None`
D) `"hello"`

**Answer: A** - `bool("hello")` returns `True`. Any non-empty string is truthy.

---

### Q49: What does `print(int(True))` output?
A) `1`
B) `True`
C) `<class 'int'>`
D) `0`

**Answer: A** - `int(True)` converts boolean `True` to integer `1`.

---

### Q50: What is the output of `print(float(3))`?
A) `3.0`
B) `3`
C) `3`
D) `None`

**Answer: A** - `float(3)` returns `3.0` as a float. When printed, it displays as `3` (without the `.0`).

---

## Part 5: Bonus Questions

### Q51: What is the difference between `==` and `is` in Python?
A) `==` compares value, `is` compares identity
B) `==` is for equality, `is` is for checking types
C) No difference, they work the same
D) `is` is deprecated in Python 3

**Answer: A** - `==` compares if two values are **equal**, while `is` checks if they are the **same object** (identity).

---

### Q52: What does the `in` operator do?
A) Checks if a value is inside a string
B) Checks if a value is an element of a list/tuple/dict
C) Checks if a string contains another string
D) Checks if a value is a key in a dictionary

**Answer: B** - `in` checks membership (element in container). It works for lists, tuples, dicts, and strings.

---

### Q53: What does `not in` do?
A) Negates the membership test
B) Returns True if element is not in container
C) Same as `!=` for equality
D) Same as `if not x in list`

**Answer: A** - `not in` checks if an element is NOT in a container. It's the logical opposite of `in`.

---

### Q54: What does `del` do?
A) Deletes a variable
B) Removes an element from a list by index
C) Removes an item from a dictionary by key
D) All of the above

**Answer: D** - `del` can delete variables, list elements, dictionary keys, and more. It's a statement, not a function.

---

### Q55: What is a comment in Python?
A) Text that explains code
B) Text ignored by the interpreter
C) Starts with `#` or `//`
D) Text in triple quotes

**Answer: A** - A comment is text ignored by Python. It can start with `#` (single-line) or `"""` (multi-line).

---

### Q56: What is the output of this code?
```python
x = 5  # This is a comment
# x = 10
print(x)
```
A) 10
B) 5
C) None
D) 5

**Answer: A** - The first line is a comment (`# This is a comment`). The second line reassigns `x` to `10`. The `print(x)` outputs `10`.

---

### Q57: What does `pass` do in Python?
A) Skips code execution
B) Returns None
C) Raises an error
D) Continues to next iteration

**Answer: B** - `pass` is a placeholder statement that does nothing. It's often used in empty blocks.

---

### Q58: What will this code output?
```python
x = 10
if x > 5:
    print("Large")
else:
    pass
```
A) `Large`
B) Nothing
C) `10`
D) `Small`

**Answer: A** - `x = 10`, so `10 > 5` is True. It prints "Large" and the `pass` does nothing.

---

### Q59: What is the output of `print(type(None))`?
A) `<class 'NoneType'>`
B) `None`
C) `<class 'None'>`
D) `<class 'None'>`

**Answer: A** - `type(None)` returns `<class 'NoneType'>`. None has its own type.

---

### Q60: What does `print(type(int()))` output?
A) `<class 'type'>`
B) `<class 'int'>`
C) `<class 'builtin_function_or_method'>`
D) `int`

**Answer: C** - `type(int)` returns the type class for integers: `<class 'type'>`.

---

## 🎯 Summary

- Total Questions: 60
- Topics Covered: Variables, Data Types, Lists, Tuples, Dictionaries, Input, Output, Operators

### 💡 Tips:
1. Use `type(variable)` to check data types
2. Remember: Lists are `[]`, Tuples are `()`, Dicts are `{}`
3. `int()` truncates, `float()` doesn't
4. `bool()` converts values to boolean
5. Strings in Python are surrounded by quotes: `'hello'` or `"hello"`
6. Comments start with `#` and are ignored by Python
7. `in` checks membership, `not in` checks non-membership
8. `==` compares values, `is` compares identity

---

**Ready to test your Python knowledge! 🚀**
