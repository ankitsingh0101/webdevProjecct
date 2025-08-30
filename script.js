// ==================== BACKEND INTEGRATION ==================== //
// Add these functions to your existing script.js
const API_BASE = "https://algo-visualizer-api.onrender.com";


// 1. Fetch available algorithms from backend
async function fetchAlgorithms() {
  try {
    const response = await fetch(`${API_BASE}/api/algorithms`);
    const data = await response.json();
    console.log("Available algorithms:", data.algorithms);
    // Optional: Update UI with fetched algorithms
  } catch (error) {
    console.error("Failed to fetch algorithms:", error);
  }
}

// 2. Save visualization to backend
async function saveVisualization() {
  const response = await fetch(`${API_BASE}/api/visualizations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      algorithm: currentAlgorithm,
      array: useArray,
      steps: animationSteps
    })
  });
  const result = await response.json();
  console.log('Saved:', result);
}

// 3. Load saved visualizations
async function loadVisualizations() {
  const response = await fetch(`${API_BASE}/api/visualizations`);
  return await response.json();
}

async function loadAndDisplay() {
  const response = await loadVisualizations();
  const listDiv = document.getElementById('saved-viz-list');
  
  if (response && response.data) {
    listDiv.innerHTML = response.data.map(viz => `
      <div class="saved-viz-item">
        <p>Algorithm: ${viz.algorithm}</p>
        <p>Elements: ${viz.array.length}</p>
        <button onclick="loadViz('${viz._id}')">Load</button>
      </div>
    `).join('');
  } else {
    listDiv.innerHTML = '<p>No saved visualizations found</p>';
    console.error('Unexpected response format:', response);
  }
}

//transition
async function loadViz(id) {
  try {
    const response = await fetch(`${API_BASE}/api/visualizations/${id}`);
    if (!response.ok) throw new Error('Failed to fetch visualization');
    
    const { algorithm, array, steps } = await response.json();
    currentAlgorithm = algorithm;
    useArray = array;
    animationSteps = steps;
    
    // Update UI
    document.getElementById('algorithm-select').value = algorithm;
    startVisualization();
    currentStep = 0;
    drawArray(array);
    
    showToast('Visualization loaded!', 'success');
  } catch (error) {
    console.error('Load error:', error);
    showToast('Failed to load visualization', 'error');
  }
}

//Save button feedback
document.getElementById('save-btn').addEventListener('click', async () => {
  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';
  try {
    await saveVisualization();
    showToast('Saved successfully!', 'success');
  } catch (err) {
    showToast('Failed to save', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save';
  }
});

// Helper function
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ==================== UI UPDATES ==================== //
// button event listener
document.getElementById('save-btn').addEventListener('click', saveVisualization);
document.getElementById('load-btn').addEventListener('click', loadAndDisplay);

// Initialize backend connection when page loads
window.addEventListener('DOMContentLoaded', () => {
  fetchAlgorithms();
  loadVisualizations();
});

// ==================== VISUALIZATION SCRIPT ==================== //
// Main Visualization Code
let array = [70, 20, 90, 10, 50, 30, 60, 80, 40];
let animationSteps = [];
let currentStep = 0;
let isPlaying = false;
let animationId = null;
let currentAlgorithm = 'merge';

// Pseudocode for each algorithm (add this right after your existing code)
const pseudocode = {
  merge: `MERGE-SORT(A, p, r):
  if p < r
    q = floor((p + r) / 2)
    MERGE-SORT(A, p, q)
    MERGE-SORT(A, q+1, r)
    MERGE(A, p, q, r)`,
  
  quick: `QUICK-SORT(A, low, high):
  if low < high
    pi = PARTITION(A, low, high)
    QUICK-SORT(A, low, pi - 1)
    QUICK-SORT(A, pi + 1, high)`,
  
  bubble: `BUBBLE-SORT(A):
  for i = 1 to A.length - 1
    for j = 0 to A.length - i - 1
      if A[j] > A[j+1]
        swap(A[j], A[j+1])`,
  
  selection: `SELECTION-SORT(A):
  for i = 0 to A.length-1
    min_idx = i
    for j = i+1 to A.length
      if A[j] < A[min_idx]
        min_idx = j
    swap(A[i], A[min_idx])`,
  
  insertion: `INSERTION-SORT(A):
  for i = 1 to A.length - 1
    key = A[i]
    j = i - 1
    while j >= 0 and A[j] > key
      A[j+1] = A[j]
      j = j - 1
    A[j+1] = key`
};

// Update pseudocode display when algorithm changes
document.getElementById('algorithm-select').addEventListener('change', function() {
  const algorithm = this.value;
  document.getElementById('code-display').textContent = pseudocode[algorithm];
});

// Initialize pseudocode on page load
document.getElementById('code-display').textContent = pseudocode['merge'];

// Initialize
initCanvas();
drawArray(array);

function initCanvas() {
    const canvas = document.getElementById('visualizer-canvas');
    canvas.width = 800;
    canvas.height = 400;
}

// Drawing Function
function drawArray(arr, highlights = []) {
    const canvas = document.getElementById('visualizer-canvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = Math.max(5, canvas.width / arr.length);
    const maxVal = Math.max(...arr);
    
    for (let i = 0; i < arr.length; i++) {
        const barHeight = (arr[i] / maxVal) * canvas.height;
        const x = i * barWidth;
        const y = canvas.height - barHeight;
        
        // Draw bar
        ctx.fillStyle = highlights.includes(i) ? '#e74c3c' : '#3498db';
        ctx.fillRect(x, y, barWidth - 2, barHeight);
        
        // Draw value label
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(arr[i], x + barWidth/2, y - 5);
    }
}

// Animation Controller
function animate() {
    if (currentStep >= animationSteps.length || !isPlaying) {
        isPlaying = false;
        return;
    }

    const step = animationSteps[currentStep];
    
    if (step.type === "compare") {
        drawArray(array, step.indices);
    } 
    else if (step.type === "overwrite") {
        array[step.index] = step.value;
        drawArray(array, [step.index]);
    }
    else if (step.type === "swap") {
        const [i, j] = step.indices;
        [array[i], array[j]] = [array[j], array[i]];
        drawArray(array, [i, j]);
    }

    currentStep++;
    const speed = document.getElementById('speed').value;
    const delay = 1000 - (speed * 45);
    
    // requestAnimationFrame(animate);
    animationId = setTimeout(animate, delay);
}

// Control Functions
function startVisualization() {
    if (!isPlaying) {
        const algorithm = document.getElementById('algorithm-select').value;
        
        if (currentAlgorithm !== algorithm || animationSteps.length === 0) {
            resetVisualization();
            currentAlgorithm = algorithm;
            
            switch(algorithm) {
                case 'merge':
                    animationSteps = getMergeSortSteps([...array]);
                    break;
                case 'quick':
                    animationSteps = getQuickSortSteps([...array]);
                    break;
                case 'bubble':
                    animationSteps = getBubbleSortSteps([...array]);
                    break;
                case 'selection':
                    animationSteps = getSelectionSortSteps([...array]);
                    break;
                case 'insertion':
                    animationSteps = getInsertionSortSteps([...array]);
                    break;
            }
        }
        
        isPlaying = true;
        animate();
    }
}

function pauseVisualization() {
    isPlaying = false;
    if (animationId) {
        clearTimeout(animationId);
    }
}

function resetVisualization() {
    pauseVisualization();
    array = [70, 20, 90, 10, 50, 30, 60, 80, 40];
    animationSteps = [];
    currentStep = 0;
    drawArray(array);
}

// Sorting Algorithms Implementations
// Merge Sort
function getMergeSortSteps(arr) {
    const steps = [];
    const arrayCopy = [...arr];
    
    function mergeSort(start = 0, end = arrayCopy.length - 1) {
        if (start < end) {
            const mid = Math.floor((start + end) / 2);
            mergeSort(start, mid);
            mergeSort(mid + 1, end);
            merge(start, mid, end);
        }
    }
    
    function merge(start, mid, end) {
        let temp = [];
        let i = start, j = mid + 1;

        while (i <= mid && j <= end) {
            steps.push({ type: "compare", indices: [i, j] });
            if (arrayCopy[i] <= arrayCopy[j]) temp.push(arrayCopy[i++]);
            else temp.push(arrayCopy[j++]);
        }

        while (i <= mid) temp.push(arrayCopy[i++]);
        while (j <= end) temp.push(arrayCopy[j++]);

        for (let k = 0; k < temp.length; k++) {
            arrayCopy[start + k] = temp[k];
            steps.push({ type: "overwrite", index: start + k, value: temp[k] });
        }
    }
    
    mergeSort();
    return steps;
}

// Quick Sort
function getQuickSortSteps(arr) {
    const steps = [];
    const arrayCopy = [...arr];
    
    function quickSort(low = 0, high = arrayCopy.length - 1) {
        if (low < high) {
            const pi = partition(low, high);
            quickSort(low, pi - 1);
            quickSort(pi + 1, high);
        }
    }
    
    function partition(low, high) {
        const pivot = arrayCopy[high];
        let i = low - 1;
        
        for (let j = low; j < high; j++) {
            steps.push({ type: "compare", indices: [j, high] });
            if (arrayCopy[j] < pivot) {
                i++;
                [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
                steps.push({ type: "swap", indices: [i, j] });
            }
        }
        
        [arrayCopy[i + 1], arrayCopy[high]] = [arrayCopy[high], arrayCopy[i + 1]];
        steps.push({ type: "swap", indices: [i + 1, high] });
        return i + 1;
    }
    
    quickSort();
    return steps;
}

// Bubble Sort
function getBubbleSortSteps(arr) {
    const steps = [];
    const arrayCopy = [...arr];
    const n = arrayCopy.length;
    
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            steps.push({ type: "compare", indices: [j, j + 1] });
            if (arrayCopy[j] > arrayCopy[j + 1]) {
                [arrayCopy[j], arrayCopy[j + 1]] = [arrayCopy[j + 1], arrayCopy[j]];
                steps.push({ type: "swap", indices: [j, j + 1] });
            }
        }
    }
    
    return steps;
}

// Selection Sort
function getSelectionSortSteps(arr) {
    const steps = [];
    const arrayCopy = [...arr];
    const n = arrayCopy.length;
    
    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            steps.push({ type: "compare", indices: [j, minIdx] });
            if (arrayCopy[j] < arrayCopy[minIdx]) {
                minIdx = j;
            }
        }
        
        if (minIdx !== i) {
            [arrayCopy[i], arrayCopy[minIdx]] = [arrayCopy[minIdx], arrayCopy[i]];
            steps.push({ type: "swap", indices: [i, minIdx] });
        }
    }
    
    return steps;
}

// Insertion Sort
function getInsertionSortSteps(arr) {
    const steps = [];
    const arrayCopy = [...arr];
    const n = arrayCopy.length;
    
    for (let i = 1; i < n; i++) {
        let key = arrayCopy[i];
        let j = i - 1;
        
        while (j >= 0 && arrayCopy[j] > key) {
            steps.push({ type: "compare", indices: [j, i] });
            arrayCopy[j + 1] = arrayCopy[j];
            steps.push({ type: "overwrite", index: j + 1, value: arrayCopy[j] });
            j--;
        }
        
        arrayCopy[j + 1] = key;
        steps.push({ type: "overwrite", index: j + 1, value: key });
    }
    
    return steps;
}

// Event Listeners
document.getElementById('start-btn').addEventListener('click', startVisualization);
document.getElementById('pause-btn').addEventListener('click', pauseVisualization);
document.getElementById('reset-btn').addEventListener('click', resetVisualization);
