const tabButtons = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".tool-panel");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;

    tabButtons.forEach((b) => b.classList.remove("active"));
    panels.forEach((panel) => panel.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(target).classList.add("active");
  });
});

const calcDisplay = document.getElementById("calcDisplay");
const calcButtons = document.querySelectorAll(".calc-grid button");
let expression = "";

function syncDisplay(value) {
  calcDisplay.value = value || "0";
}

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function evaluateExpression(rawExpression) {
  const jsExpression = rawExpression
    .replace(/PI/g, "Math.PI")
    .replace(/\bE\b/g, "Math.E")
    .replace(/sin\(/g, "sinDeg(")
    .replace(/cos\(/g, "cosDeg(")
    .replace(/tan\(/g, "tanDeg(")
    .replace(/log\(/g, "Math.log10(")
    .replace(/ln\(/g, "Math.log(")
    .replace(/sqrt\(/g, "Math.sqrt(")
    .replace(/\^/g, "**");

  const result = Function(
    "sinDeg",
    "cosDeg",
    "tanDeg",
    `return ${jsExpression};`
  )(
    (x) => Math.sin(degToRad(x)),
    (x) => Math.cos(degToRad(x)),
    (x) => Math.tan(degToRad(x))
  );

  if (!Number.isFinite(result)) {
    throw new Error("Invalid calculation result");
  }

  return result;
}

calcButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const { value, action } = button.dataset;

    if (action === "clear") {
      expression = "";
      syncDisplay(expression);
      return;
    }

    if (action === "delete") {
      expression = expression.slice(0, -1);
      syncDisplay(expression);
      return;
    }

    if (action === "square") {
      if (!expression) {
        return;
      }
      expression = `(${expression})^2`;
      syncDisplay(expression);
      return;
    }

    if (action === "equals") {
      if (!expression) {
        return;
      }
      try {
        const result = evaluateExpression(expression);
        expression = String(result);
        syncDisplay(expression);
      } catch (_error) {
        expression = "";
        syncDisplay("Error");
      }
      return;
    }

    expression += value;
    syncDisplay(expression);
  });
});

const timeDisplay = document.getElementById("timeDisplay");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const lapBtn = document.getElementById("lapBtn");
const laps = document.getElementById("laps");

let timerId = null;
let elapsed = 0;
let startTick = 0;

function formatTime(milliseconds) {
  const centiseconds = Math.floor((milliseconds % 1000) / 10)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(milliseconds / 1000) % 60;
  const minutes = Math.floor(milliseconds / 60000) % 60;
  const hours = Math.floor(milliseconds / 3600000);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${centiseconds}`;
}

function refreshStopwatch() {
  const runningElapsed = elapsed + (performance.now() - startTick);
  timeDisplay.textContent = formatTime(runningElapsed);
}

startBtn.addEventListener("click", () => {
  if (timerId) {
    return;
  }
  startTick = performance.now();
  timerId = setInterval(refreshStopwatch, 20);
});

pauseBtn.addEventListener("click", () => {
  if (!timerId) {
    return;
  }
  elapsed += performance.now() - startTick;
  clearInterval(timerId);
  timerId = null;
  timeDisplay.textContent = formatTime(elapsed);
});

resetBtn.addEventListener("click", () => {
  clearInterval(timerId);
  timerId = null;
  elapsed = 0;
  startTick = 0;
  timeDisplay.textContent = "00:00:00.00";
  laps.innerHTML = "";
});

lapBtn.addEventListener("click", () => {
  if (!timerId) {
    return;
  }

  const runningElapsed = elapsed + (performance.now() - startTick);
  const item = document.createElement("li");
  item.textContent = `Lap ${laps.children.length + 1}: ${formatTime(runningElapsed)}`;
  laps.prepend(item);
});

const convType = document.getElementById("convType");
const fromUnit = document.getElementById("fromUnit");
const toUnit = document.getElementById("toUnit");
const convInput = document.getElementById("convInput");
const convResult = document.getElementById("convResult");

const converters = {
  length: {
    units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 },
    convert: (value, from, to) => (value * converters.length.units[from]) / converters.length.units[to]
  },
  weight: {
    units: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.028349523125 },
    convert: (value, from, to) => (value * converters.weight.units[from]) / converters.weight.units[to]
  },
  temperature: {
    units: ["C", "F", "K"],
    convert: (value, from, to) => {
      let celsius = value;
      if (from === "F") celsius = (value - 32) * (5 / 9);
      if (from === "K") celsius = value - 273.15;

      if (to === "C") return celsius;
      if (to === "F") return celsius * (9 / 5) + 32;
      return celsius + 273.15;
    }
  }
};

function fillUnitSelects(type) {
  const config = converters[type];
  const units = Array.isArray(config.units) ? config.units : Object.keys(config.units);

  fromUnit.innerHTML = "";
  toUnit.innerHTML = "";

  units.forEach((unit, idx) => {
    const fromOpt = document.createElement("option");
    fromOpt.value = unit;
    fromOpt.textContent = unit;
    fromUnit.appendChild(fromOpt);

    const toOpt = document.createElement("option");
    toOpt.value = unit;
    toOpt.textContent = unit;
    toUnit.appendChild(toOpt);

    if (idx === 1) {
      toUnit.value = unit;
    }
  });
}

function updateConversion() {
  const type = convType.value;
  const from = fromUnit.value;
  const to = toUnit.value;
  const value = Number(convInput.value);

  if (Number.isNaN(value)) {
    convResult.textContent = "Result: Invalid input";
    return;
  }

  const result = converters[type].convert(value, from, to);
  convResult.textContent = `Result: ${result.toFixed(6).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1")}`;
}

convType.addEventListener("change", () => {
  fillUnitSelects(convType.value);
  updateConversion();
});

[fromUnit, toUnit, convInput].forEach((el) => el.addEventListener("input", updateConversion));

fillUnitSelects("length");
updateConversion();



