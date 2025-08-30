const API_BASE = "https://algo-visualizer-api.onrender.com";

let array = [70, 20, 90, 10, 50, 30, 60, 80, 40];
let animationSteps = [];
let currentStep = 0;
let isPlaying = false;
let animationId = null;
let currentAlgorithm = 'merge';
let useArray = [];

async function fetchAlgorithms() {
  try {
    const response = await fetch(`${API_BASE}/api/algorithms`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log("Available algorithms:", data.algorithms);
  } catch (error) {
    console.error("Failed to fetch algorithms:", error);
  }
}

async function saveVisualization() {
  try {
    if (!Array.isArray(animationSteps) || animationSteps.length === 0) {
      showToast('No steps to save. Run the visualization first.', 'error');
      return;
    }

    const response = await fetch(`${API_BASE}/api/visualizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        algorithm: currentAlgorithm,
        array: useArray.length ? useArray : array,
        steps: animationSteps
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    console.log('Saved:', result);
    showToast('Saved successfully!', 'success');
  } catch (err) {
    console.error('Save error:', err);
    showToast('Failed to save', 'error');
  }
}

async function loadVisualizations() {
  try {
    const response = await fetch(`${API_BASE}/api/visualizations`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('Failed to load visualizations:', err);
    return null;
  }
}

async function loadAndDisplay() {
  const response = await loadVisualizations();
  const listDiv = document.getElementById('saved-viz-list');

  if (response && response.data) {
    listDiv.innerHTML = response.data.map(viz => `
      <div class="saved-viz-item">
        <p>Algorithm: ${viz.algorithm}</p>
        <p>Elements: ${viz.array?.length || 0}</p>
        <button onclick="loadViz('${viz._id}')">Load</button>
      </div>
    `).join('');
  } else {
    listDiv.innerHTML = '<p>No saved visualizations found</p>';
  }
}

async function loadViz(id) {
  try {
    const response = await fetch(`${API_BASE}/api/visualizations/${id}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    const { algorithm, array: loadedArray, steps } = data;
    if (!Array.isArray(loadedArray) || !Array.isArray(steps)) {
      showToast('Loaded visualization has invalid data!', 'error');
      console.error('Invalid loaded data:', data);
      return;
    }

    currentAlgorithm = algorithm;
    useArray = loadedArray;
    animationSteps = steps;

    document.getElementById('algorithm-select').value = algorithm;
    drawArray(loadedArray);
    currentStep = 0;
    isPlaying = false;

    showToast('Visualization loaded!', 'success');
  } catch (error) {
    console.error('Load error:', error);
    showToast('Failed to load visualization', 'error');
  }
}

document.getElementById('save-btn').addEventListener('click', async () => {
  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';
  await saveVisualization();
  btn.disabled = false;
  btn.textContent = 'Save';
});

document.getElementById('load-btn').addEventListener('click', loadAndDisplay);

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

const pseudocode = {
  merge: `MERGE-SORT(A, p, r):\n if p < r\n   q = floor((p + r) / 2)\n   MERGE-SORT(A, p, q)\n   MERGE-SORT(A, q+1, r)\n   MERGE(A, p, q, r)`,
  quick: `QUICK-SORT(A, low, high):\n if low < high\n   pi = PARTITION(A, low, high)\n   QUICK-SORT(A, low, pi - 1)\n   QUICK-SORT(A, pi + 1, high)`,
  bubble: `BUBBLE-SORT(A):\n for i = 1 to A.length - 1\n   for j = 0 to A.length - i - 1\n     if A[j] > A[j+1]\n       swap(A[j], A[j+1])`,
  selection: `SELECTION-SORT(A):\n for i = 0 to A.length-1\n   min_idx = i\n   for j = i+1 to A.length\n     if A[j] < A[min_idx]\n       min_idx = j\n   swap(A[i], A[min_idx])`,
  insertion: `INSERTION-SORT(A):\n for i = 1 to A.length - 1\n   key = A[i]\n   j = i - 1\n   while j >= 0 and A[j] > key\n     A[j+1] = A[j]\n     j = j - 1\n   A[j+1] = key`
};

document.getElementById('algorithm-select').addEventListener('change', function () {
  const algorithm = this.value;
  document.getElementById('code-display').textContent = pseudocode[algorithm];
});
document.getElementById('code-display').textContent = pseudocode['merge'];

function initCanvas() {
  const canvas = document.getElementById('visualizer-canvas');
  canvas.width = 800;
  canvas.height = 400;
}

function drawArray(arr, highlights = []) {
  if (!Array.isArray(arr)) return;
  const canvas = document.getElementById('visualizer-canvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const barWidth = Math.max(5, canvas.width / arr.length);
  const maxVal = Math.max(...arr);

  for (let i = 0; i < arr.length; i++) {
    const barHeight = (arr[i] / maxVal) * canvas.height;
    const x = i * barWidth;
    const y = canvas.height - barHeight;
    ctx.fillStyle = highlights.includes(i) ? '#e74c3c' : '#3498db';
    ctx.fillRect(x, y, barWidth - 2, barHeight);
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(arr[i], x + barWidth / 2, y - 5);
  }
}

function animate() {
  if (currentStep >= animationSteps.length || !isPlaying) {
    isPlaying = false;
    return;
  }

  const step = animationSteps[currentStep];
  if (step.type === "compare") {
    drawArray(array, step.indices);
  } else if (step.type === "overwrite") {
    array[step.index] = step.value;
    drawArray(array, [step.index]);
  } else if (step.type === "swap") {
    const [i, j] = step.indices;
    [array[i], array[j]] = [array[j], array[i]];
    drawArray(array, [i, j]);
  }

  currentStep++;
  const speed = document.getElementById('speed').value;
  const delay = 1000 - (speed * 45);
  animationId = setTimeout(animate, delay);
}

function startVisualization() {
  if (!isPlaying) {
    const algorithm = document.getElementById('algorithm-select').value;

    if (currentAlgorithm !== algorithm || animationSteps.length === 0) {
      resetVisualization();
      currentAlgorithm = algorithm;

      switch (algorithm) {
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

      useArray = [...array];
    }

    isPlaying = true;
    animate();
  }
}

function pauseVisualization() {
  isPlaying = false;
  if (animationId) clearTimeout(animationId);
}

function resetVisualization() {
  pauseVisualization();
  array = [70, 20, 90, 10, 50, 30, 60, 80, 40];
  animationSteps = [];
  currentStep = 0;
  drawArray(array);
}

function getMergeSortSteps(arr) {
  const steps = [], copy = [...arr];
  function mergeSort(start, end) {
    if (start < end) {
      const mid = Math.floor((start + end) / 2);
      mergeSort(start, mid);
      mergeSort(mid + 1, end);
      merge(start, mid, end);
    }
  }

  function merge(start, mid, end) {
    const temp = [];
    let i = start, j = mid + 1;
    while (i <= mid && j <= end) {
      steps.push({ type: "compare", indices: [i, j] });
      if (copy[i] <= copy[j]) temp.push(copy[i++]);
      else temp.push(copy[j++]);
    }
    while (i <= mid) temp.push(copy[i++]);
    while (j <= end) temp.push(copy[j++]);
    for (let k = 0; k < temp.length; k++) {
      copy[start + k] = temp[k];
      steps.push({ type: "overwrite", index: start + k, value: temp[k] });
    }
  }

  mergeSort(0, copy.length - 1);
  return steps;
}

function getQuickSortSteps(arr) {
  const steps = [], copy = [...arr];
  function quickSort(low, high) {
    if (low < high) {
      const pi = partition(low, high);
      quickSort(low, pi - 1);
      quickSort(pi + 1, high);
    }
  }

  function partition(low, high) {
    const pivot = copy[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
      steps.push({ type: "compare", indices: [j, high] });
      if (copy[j] < pivot) {
        i++;
        [copy[i], copy[j]] = [copy[j], copy[i]];
        steps.push({ type: "swap", indices: [i, j] });
      }
    }
    [copy[i + 1], copy[high]] = [copy[high], copy[i + 1]];
    steps.push({ type: "swap", indices: [i + 1, high] });
    return i + 1;
  }

  quickSort(0, copy.length - 1);
  return steps;
}

function getBubbleSortSteps(arr) {
  const steps = [], copy = [...arr];
  for (let i = 0; i < copy.length - 1; i++) {
    for (let j = 0; j < copy.length - i - 1; j++) {
      steps.push({ type: "compare", indices: [j, j + 1] });
      if (copy[j] > copy[j + 1]) {
        [copy[j], copy[j + 1]] = [copy[j + 1], copy[j]];
        steps.push({ type: "swap", indices: [j, j + 1] });
      }
    }
  }
  return steps;
}

function getSelectionSortSteps(arr) {
  const steps = [], copy = [...arr];
  for (let i = 0; i < copy.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < copy.length; j++) {
      steps.push({ type: "compare", indices: [j, minIdx] });
      if (copy[j] < copy[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      [copy[i], copy[minIdx]] = [copy[minIdx], copy[i]];
      steps.push({ type: "swap", indices: [i, minIdx] });
    }
  }
  return steps;
}

function getInsertionSortSteps(arr) {
  const steps = [], copy = [...arr];
  for (let i = 1; i < copy.length; i++) {
    const key = copy[i];
    let j = i - 1;
    while (j >= 0 && copy[j] > key) {
      steps.push({ type: "compare", indices: [j, i] });
      copy[j + 1] = copy[j];
      steps.push({ type: "overwrite", index: j + 1, value: copy[j] });
      j--;
    }
    copy[j + 1] = key;
    steps.push({ type: "overwrite", index: j + 1, value: key });
  }
  return steps;
}

document.getElementById('start-btn').addEventListener('click', startVisualization);
document.getElementById('pause-btn').addEventListener('click', pauseVisualization);
document.getElementById('reset-btn').addEventListener('click', resetVisualization);

window.addEventListener('DOMContentLoaded', () => {
  fetchAlgorithms();
  loadVisualizations();
  initCanvas();
  drawArray(array);
});
