// Java algorithm templates
export const javaTemplates = [
  {
    id: 'java-bubble-sort',
    name: 'Bubble Sort',
    category: 'Sorting',
    difficulty: 'easy',
    code: `// Bubble Sort in Java
int[] arr = {64, 34, 25, 12, 22, 11, 90};
int n = arr.length;

for (int i = 0; i < n - 1; i++) {
    for (int j = 0; j < n - i - 1; j++) {
        if (arr[j] > arr[j + 1]) {
            int temp = arr[j];
            arr[j] = arr[j + 1];
            arr[j + 1] = temp;
        }
    }
}

System.out.println("Sorted: " + Arrays.toString(arr));`,
  },
  {
    id: 'java-two-sum',
    name: 'Two Sum',
    category: 'Arrays',
    difficulty: 'easy',
    code: `// Two Sum using HashMap
int[] nums = {2, 7, 11, 15};
int target = 9;
HashMap<Integer, Integer> map = new HashMap<>();
int[] result = {};

for (int i = 0; i < nums.length; i++) {
    int complement = target - nums[i];
    if (map.containsKey(complement)) {
        result = new int[]{map.get(complement), i};
        System.out.println("Found pair at: " + Arrays.toString(result));
    }
    map.put(nums[i], i);
}`,
  },
  {
    id: 'java-binary-search',
    name: 'Binary Search',
    category: 'Searching',
    difficulty: 'easy',
    code: `// Binary Search
int[] arr = {1, 3, 5, 7, 9, 11, 13, 15, 17, 19};
int target = 13;
int left = 0;
int right = arr.length - 1;
int found = -1;

while (left <= right) {
    int mid = (left + right) / 2;
    if (arr[mid] == target) {
        found = mid;
        System.out.println("Found at index: " + mid);
        break;
    } else if (arr[mid] < target) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}

if (found == -1) {
    System.out.println("Not found");
}`,
  },
  {
    id: 'java-selection-sort',
    name: 'Selection Sort',
    category: 'Sorting',
    difficulty: 'easy',
    code: `// Selection Sort
int[] arr = {29, 10, 14, 37, 13};
int n = arr.length;

for (int i = 0; i < n - 1; i++) {
    int minIdx = i;
    for (int j = i + 1; j < n; j++) {
        if (arr[j] < arr[minIdx]) {
            minIdx = j;
        }
    }
    if (minIdx != i) {
        int temp = arr[i];
        arr[i] = arr[minIdx];
        arr[minIdx] = temp;
    }
}

System.out.println("Sorted: " + Arrays.toString(arr));`,
  },
  {
    id: 'java-move-zeroes',
    name: 'Move Zeroes',
    category: 'Arrays',
    difficulty: 'easy',
    code: `// Move Zeroes to end
int[] nums = {0, 1, 0, 3, 12};
int insertPos = 0;

for (int i = 0; i < nums.length; i++) {
    if (nums[i] != 0) {
        int temp = nums[insertPos];
        nums[insertPos] = nums[i];
        nums[i] = temp;
        insertPos++;
    }
}

System.out.println("Result: " + Arrays.toString(nums));`,
  },
  {
    id: 'java-reverse-array',
    name: 'Reverse Array',
    category: 'Arrays',
    difficulty: 'easy',
    code: `// Reverse Array using Two Pointers
int[] arr = {1, 2, 3, 4, 5, 6, 7, 8};
int left = 0;
int right = arr.length - 1;

while (left < right) {
    int temp = arr[left];
    arr[left] = arr[right];
    arr[right] = temp;
    left++;
    right--;
}

System.out.println("Reversed: " + Arrays.toString(arr));`,
  },
  {
    id: 'java-fibonacci',
    name: 'Fibonacci Sequence',
    category: 'Math',
    difficulty: 'easy',
    code: `// Fibonacci — Generate first n numbers
int n = 10;
int[] fib = new int[n];
fib[0] = 0;
fib[1] = 1;

for (int i = 2; i < n; i++) {
    fib[i] = fib[i - 1] + fib[i - 2];
}

System.out.println("Fibonacci: " + Arrays.toString(fib));`,
  },
  {
    id: 'java-kadane',
    name: "Kadane's Algorithm",
    category: 'Arrays',
    difficulty: 'medium',
    code: `// Kadane's Algorithm — Maximum Subarray Sum
int[] nums = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
int maxSum = nums[0];
int currentSum = nums[0];

for (int i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
}

System.out.println("Max subarray sum: " + maxSum);`,
  },
];
