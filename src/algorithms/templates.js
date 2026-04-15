// Algorithm templates — starter code users can load
export const templates = [
  {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    category: 'Sorting',
    difficulty: 'easy',
    code: `// Bubble Sort
let arr = [64, 34, 25, 12, 22, 11, 90];
let n = arr.length;

for (let i = 0; i < n - 1; i++) {
  for (let j = 0; j < n - i - 1; j++) {
    if (arr[j] > arr[j + 1]) {
      let temp = arr[j];
      arr[j] = arr[j + 1];
      arr[j + 1] = temp;
    }
  }
}

console.log("Sorted:", arr);`,
  },
  {
    id: 'two-sum',
    name: 'Two Sum',
    category: 'Arrays',
    difficulty: 'easy',
    code: `// Two Sum — Find two numbers that add up to target
let nums = [2, 7, 11, 15];
let target = 9;
let map = new Map();
let result = [];

for (let i = 0; i < nums.length; i++) {
  let complement = target - nums[i];
  if (map.has(complement)) {
    result = [map.get(complement), i];
    console.log("Found pair at indices:", result);
  }
  map.set(nums[i], i);
}`,
  },
  {
    id: 'move-zeroes',
    name: 'Move Zeroes',
    category: 'Arrays',
    difficulty: 'easy',
    code: `// Move Zeroes — Move all 0's to end, maintain order
let nums = [0, 1, 0, 3, 12];
let insertPos = 0;

for (let i = 0; i < nums.length; i++) {
  if (nums[i] !== 0) {
    let temp = nums[insertPos];
    nums[insertPos] = nums[i];
    nums[i] = temp;
    insertPos++;
  }
}

console.log("Result:", nums);`,
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    category: 'Searching',
    difficulty: 'easy',
    code: `// Binary Search
let arr = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
let target = 13;
let left = 0;
let right = arr.length - 1;
let found = -1;

while (left <= right) {
  let mid = Math.floor((left + right) / 2);
  if (arr[mid] === target) {
    found = mid;
    console.log("Found at index:", mid);
    left = right + 1;
  } else if (arr[mid] < target) {
    left = mid + 1;
  } else {
    right = mid - 1;
  }
}

if (found === -1) {
  console.log("Not found");
}`,
  },
  {
    id: 'selection-sort',
    name: 'Selection Sort',
    category: 'Sorting',
    difficulty: 'easy',
    code: `// Selection Sort
let arr = [29, 10, 14, 37, 13];
let n = arr.length;

for (let i = 0; i < n - 1; i++) {
  let minIdx = i;
  for (let j = i + 1; j < n; j++) {
    if (arr[j] < arr[minIdx]) {
      minIdx = j;
    }
  }
  if (minIdx !== i) {
    let temp = arr[i];
    arr[i] = arr[minIdx];
    arr[minIdx] = temp;
  }
}

console.log("Sorted:", arr);`,
  },
  {
    id: 'insertion-sort',
    name: 'Insertion Sort',
    category: 'Sorting',
    difficulty: 'easy',
    code: `// Insertion Sort
let arr = [12, 11, 13, 5, 6];
let n = arr.length;

for (let i = 1; i < n; i++) {
  let key = arr[i];
  let j = i - 1;
  while (j >= 0 && arr[j] > key) {
    arr[j + 1] = arr[j];
    j--;
  }
  arr[j + 1] = key;
}

console.log("Sorted:", arr);`,
  },
  {
    id: 'reverse-array',
    name: 'Reverse Array',
    category: 'Arrays',
    difficulty: 'easy',
    code: `// Reverse Array using Two Pointers
let arr = [1, 2, 3, 4, 5, 6, 7, 8];
let left = 0;
let right = arr.length - 1;

while (left < right) {
  let temp = arr[left];
  arr[left] = arr[right];
  arr[right] = temp;
  left++;
  right--;
}

console.log("Reversed:", arr);`,
  },
  {
    id: 'linear-search',
    name: 'Linear Search',
    category: 'Searching',
    difficulty: 'easy',
    code: `// Linear Search
let arr = [10, 23, 45, 70, 11, 15];
let target = 70;
let found = -1;

for (let i = 0; i < arr.length; i++) {
  if (arr[i] === target) {
    found = i;
    console.log("Found at index:", i);
  }
}

if (found === -1) {
  console.log("Not found");
}`,
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci Sequence',
    category: 'Math',
    difficulty: 'easy',
    code: `// Fibonacci — Generate first n numbers
let n = 10;
let fib = [0, 1];

for (let i = 2; i < n; i++) {
  fib[i] = fib[i - 1] + fib[i - 2];
}

console.log("Fibonacci:", fib);`,
  },
  {
    id: 'max-subarray',
    name: "Kadane's Algorithm",
    category: 'Arrays',
    difficulty: 'medium',
    code: `// Kadane's Algorithm — Maximum Subarray Sum
let nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
let maxSum = nums[0];
let currentSum = nums[0];

for (let i = 1; i < nums.length; i++) {
  currentSum = Math.max(nums[i], currentSum + nums[i]);
  maxSum = Math.max(maxSum, currentSum);
}

console.log("Max subarray sum:", maxSum);`,
  },
];

export function getTemplate(id) {
  return templates.find(t => t.id === id);
}

export function getCategories() {
  const cats = {};
  templates.forEach(t => {
    if (!cats[t.category]) cats[t.category] = [];
    cats[t.category].push(t);
  });
  return cats;
}
