const sideKeys = ["a", "b", "c"];
const angleKeys = ["A", "B", "C"];
const allKeys = ["a", "b", "c", "A", "B", "C"];
const rightKeys = ["a", "b", "c", "A", "B"];

const rightFields = document.getElementById("rightFields");
const obliqueFields = document.getElementById("obliqueFields");
const result = document.getElementById("result");
const errorBox = document.getElementById("error");

function optionList(keys) {
return keys.map(key => `<option value="${key}">${key}</option>`).join("");
}

function makeFields(container, count, keys, prefix) {
container.innerHTML = Array.from({ length: count }, (_, index) => `
    <div class="field-row">
    <label>
        Dato ${index + 1}
        <select id="${prefix}Key${index}">${optionList(keys)}</select>
    </label>
    <label>
        Valor
        <input id="${prefix}Value${index}" type="number" min="0" step="any"
    inputmode="decimal" placeholder="Ingresa un valor">
    </label>
    </div>
`).join("");

container.querySelectorAll("select").forEach(select => {
    select.addEventListener("change", () => keepSelectionsUnique(container));
});
}

function keepSelectionsUnique(container) {
const selects = [...container.querySelectorAll("select")];
const selected = new Set(selects.map(select => select.value));

selects.forEach(select => {
    [...select.options].forEach(option => {
    option.disabled = option.value !== select.value && selected.has(option.value);
    });
});
}

makeFields(rightFields, 2, rightKeys, "right");
makeFields(obliqueFields, 3, allKeys, "oblique");
keepSelectionsUnique(rightFields);
keepSelectionsUnique(obliqueFields);

document.querySelectorAll(".tab").forEach(tab => {
tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(item =>
    item.setAttribute("aria-selected", String(item === tab))
    );

    document.getElementById("rightMode").hidden = tab.dataset.mode !== "right";
    document.getElementById("obliqueMode").hidden = tab.dataset.mode !== "oblique";
    result.hidden = true;
    errorBox.textContent = "";
});
});

function readInputs(prefix, count) {
const values = {};

for (let i = 0; i < count; i++) {
    const key = document.getElementById(`${prefix}Key${i}`).value;
    const value = Number(document.getElementById(`${prefix}Value${i}`).value);

    if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`El valor del dato ${i + 1} debe ser mayor que cero.`);
    }

    if (values[key] !== undefined) {
    throw new Error("Cada dato debe ser distinto; selecciona otra medida.");
    }

    values[key] = value;
}

return values;
}

function validateAngle(angle) {
if (!(angle > 0 && angle < 180)) {
    throw new Error("Cada ángulo debe ser mayor que 0° y menor que 180°.");
}
}

function getRightTriangle(data) {
const keys = Object.keys(data);
const sideCount = keys.filter(key => sideKeys.includes(key)).length;
const angleCount = keys.filter(key => angleKeys.includes(key)).length;

if (sideCount === 0) {
    throw new Error("Dos ángulos no bastan para conocer los lados. Ingresa al menos un lado.");
}

const triangle = { A: null, B: null, C: 90, a: null, b: null, c: null };
const formulas = ["C = 90°"];

for (const [key, value] of Object.entries(data)) {
    if (angleKeys.includes(key)) {
    validateAngle(value);
    if (value >= 90) {
        throw new Error("Los ángulos A y B de un triángulo rectángulo deben ser menores de 90°.");
    }
    }
    triangle[key] = value;
}

const knownSides = keys.filter(key => sideKeys.includes(key));

if (knownSides.length === 2) {
    const [x, y] = knownSides;

    if ((x === "a" && y === "b") || (x === "b" && y === "a")) {
    triangle.c = Math.hypot(triangle.a, triangle.b);
    formulas.push("c = √(a² + b²)");
    } else if (data.c !== undefined && data.a !== undefined) {
    if (triangle.c <= triangle.a) {
        throw new Error("La hipotenusa c debe ser mayor que cada cateto.");
    }
      triangle.b = Math.sqrt(triangle.c ** 2 - triangle.a ** 2);
    formulas.push("b = √(c² − a²)");
    } else if (data.c !== undefined && data.b !== undefined) {
    if (triangle.c <= triangle.b) {
        throw new Error("La hipotenusa c debe ser mayor que cada cateto.");
    }
      triangle.a = Math.sqrt(triangle.c ** 2 - triangle.b ** 2);
    formulas.push("a = √(c² − b²)");
    }
} else if (sideCount === 1 && angleCount === 1) {
    const angleKey = keys.find(key => angleKeys.includes(key));
    const sideKey = keys.find(key => sideKeys.includes(key));
    const angle = triangle[angleKey] * Math.PI / 180;

    if (angleKey === "A") {
    if (sideKey === "a") {
        triangle.c = triangle.a / Math.sin(angle);
        triangle.b = triangle.a / Math.tan(angle);
    } else if (sideKey === "b") {
        triangle.c = triangle.b / Math.cos(angle);
        triangle.a = triangle.b * Math.tan(angle);
    } else {
        triangle.a = triangle.c * Math.sin(angle);
        triangle.b = triangle.c * Math.cos(angle);
    }
    formulas.push("sen(A) = a/c, cos(A) = b/c");
    } else {
    if (sideKey === "b") {
        triangle.c = triangle.b / Math.sin(angle);
        triangle.a = triangle.b / Math.tan(angle);
    } else if (sideKey === "a") {
        triangle.c = triangle.a / Math.cos(angle);
        triangle.b = triangle.a * Math.tan(angle);
    } else {
        triangle.b = triangle.c * Math.sin(angle);
        triangle.a = triangle.c * Math.cos(angle);
    }
    formulas.push("sen(B) = b/c, cos(B) = a/c");
    }
} else {
    throw new Error("Ingresa dos lados, o un lado y un ángulo.");
}

if (sideCount === 2 && angleCount === 0) {
    formulas.push("A + B = 90°");
}

if (data.A !== undefined && data.B !== undefined) {
    if (Math.abs(data.A + data.B - 90) > 1e-7) {
    throw new Error("En un triángulo rectángulo, A + B debe ser 90°.");
    }
}

if (triangle.a == null || triangle.b == null || triangle.c == null) {
    throw new Error("No fue posible determinar todos los lados con esos datos.");
}

  const calculatedA = Math.asin(triangle.a / triangle.c) * 180 / Math.PI;
const calculatedB = 90 - calculatedA;

if ((data.A !== undefined && Math.abs(data.A - calculatedA) > 0.1) ||
    (data.B !== undefined && Math.abs(data.B - calculatedB) > 0.1)) {
    throw new Error("Las medidas ingresadas no corresponden al mismo triángulo.");
}

triangle.A = calculatedA;
triangle.B = calculatedB;
formulas.push("A = sen⁻¹(a/c)", "B = 90° − A");

return { triangle, formulas };
}

function angleFromCosine(opposite, side1, side2) {
  const cosine = (side1 ** 2 + side2 ** 2 - opposite ** 2) / (2 * side1 * side2);
  return Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI;
}

function getObliqueTriangle(data, kind) {
const keys = Object.keys(data);
const knownSides = keys.filter(key => sideKeys.includes(key));
const knownAngles = keys.filter(key => angleKeys.includes(key));
const formulas = [];
const candidates = [];

if (knownAngles.length === 3) {
    throw new Error("Tres ángulos determinan la forma, pero no el tamaño. Ingresa al menos un lado.");
}

for (const angleKey of knownAngles) {
    validateAngle(data[angleKey]);
}

if (knownSides.length === 3) {
    const [a, b, c] = sideKeys.map(key => data[key]);

    if (a + b <= c || a + c <= b || b + c <= a) {
    throw new Error("Esos lados no cumplen la desigualdad triangular.");
    }

    candidates.push({
    a, b, c,
    A: angleFromCosine(a, b, c),
    B: angleFromCosine(b, a, c),
    C: angleFromCosine(c, a, b)
    });

    formulas.push(
    "cos(A) = (b² + c² − a²) / (2bc)",
    "cos(B) = (a² + c² − b²) / (2ac)",
    "C = 180° − A − B"
    );
} else if (knownAngles.length === 2 && knownSides.length === 1) {
    const [first, second] = knownAngles;
    const remaining = angleKeys.find(key => !knownAngles.includes(key));
    const missingAngle = 180 - data[first] - data[second];

    if (!(missingAngle > 0)) {
    throw new Error("La suma de los ángulos debe ser 180°.");
    }

    const triangle = { ...data, [remaining]: missingAngle };
    const sideKnown = knownSides[0];
    const ratio = triangle[sideKnown] /
      Math.sin(triangle[sideKnown.toUpperCase()] * Math.PI / 180);

    for (const side of sideKeys) {
    if (triangle[side] === undefined) {
        triangle[side] = ratio *
          Math.sin(triangle[side.toUpperCase()] * Math.PI / 180);
    }
    }

    candidates.push(triangle);
    formulas.push(
    "C = 180° − A − B (suma de ángulos = 180°)",
    "a/sen(A) = b/sen(B) = c/sen(C) (ley de senos)"
    );
} else if (knownSides.length === 2 && knownAngles.length === 1) {
    const angleKey = knownAngles[0];
    const oppositeSide = angleKey.toLowerCase();
    const [side1, side2] = knownSides;

    if (!knownSides.includes(oppositeSide)) {
      const angle = data[angleKey] * Math.PI / 180;
    const triangle = { ...data };

    triangle[oppositeSide] = Math.sqrt(
        triangle[side1] ** 2 + triangle[side2] ** 2 -
        2 * triangle[side1] * triangle[side2] * Math.cos(angle)
    );

    triangle.A = angleFromCosine(triangle.a, triangle.b, triangle.c);
    triangle.B = angleFromCosine(triangle.b, triangle.a, triangle.c);
    triangle.C = 180 - triangle.A - triangle.B;

    candidates.push(triangle);
    formulas.push(
        `${oppositeSide}² = ${side1}² + ${side2}² − 2(${side1})(${side2})cos(${angleKey})`,
        "Ley de cosenos para los ángulos restantes"
    );
    } else {
    const otherSide = knownSides.find(side => side !== oppositeSide);
      const angleX = data[angleKey] * Math.PI / 180;
    const sideX = data[oppositeSide];
    const sideY = data[otherSide];
      const sinY = sideY * Math.sin(angleX) / sideX;

    if (sinY <= 1) {
        const y1 = Math.asin(Math.max(-1, Math.min(1, sinY))) * 180 / Math.PI;
        const possibilities = [y1, 180 - y1];

        for (const angleY of possibilities) {
        const angleZ = 180 - data[angleKey] - angleY;
        if (angleZ <= 0) continue;

        const triangle = { ...data };
        const angleYKey = otherSide.toUpperCase();
        const thirdAngleKey = angleKeys.find(key =>
            key !== angleKey && key !== angleYKey
        );
        const thirdSideKey = thirdAngleKey.toLowerCase();

        triangle[angleYKey] = angleY;
        triangle[thirdAngleKey] = angleZ;
          triangle[thirdSideKey] = sideX *
            Math.sin(angleZ * Math.PI / 180) / Math.sin(angleX);

        candidates.push(triangle);
        }
    }

    formulas.push(
        "sen(Y)/y = sen(X)/x (ley de senos)",
        "Z = 180° − X − Y"
    );
    }
} else {
    throw new Error("Usa tres lados, dos ángulos y un lado, o dos lados y un ángulo.");
}

const filtered = candidates.filter(triangle => {
    if (angleKeys.some(key => !Number.isFinite(triangle[key]) || triangle[key] <= 0)) {
    return false;
    }

    if (Math.abs(triangle.A + triangle.B + triangle.C - 180) > 0.01) {
    return false;
    }

    const hasObtuse = angleKeys.some(key => triangle[key] > 90.000001);
    const hasRight = angleKeys.some(key => Math.abs(triangle[key] - 90) < 0.000001);

    return kind === "acute" ? !hasObtuse && !hasRight : hasObtuse;
});

const unique = filtered.filter((triangle, index) =>
    filtered.findIndex(other =>
    Math.abs(other.a - triangle.a) < 1e-7 &&
    Math.abs(other.b - triangle.b) < 1e-7 &&
    Math.abs(other.c - triangle.c) < 1e-7
    ) === index
);

if (unique.length === 0) {
    throw new Error("Los datos no forman un triángulo del tipo seleccionado. Revisa las medidas.");
}

if (unique.length > 1) {
    throw new Error("Esos datos admiten más de un triángulo. Agrega un dato distinto o cambia las medidas.");
}

return { triangle: unique[0], formulas };
}

function format(value) {
return Number(value).toLocaleString("es", {
    maximumFractionDigits: 3,
    minimumFractionDigits: 0
});
}

function drawTriangle(triangle) {
const svg = document.getElementById("drawing");
const width = 520;
const height = 310;
const padding = 62;

  // Se coloca c como base; la ley de cosenos ubica el vértice C.
  const rawX = (triangle.b ** 2 + triangle.c ** 2 - triangle.a ** 2) /
    (2 * triangle.c);
  const rawY = Math.sqrt(Math.max(0, triangle.b ** 2 - rawX ** 2));
const raw = [
    { x: 0, y: 0 },
    { x: triangle.c, y: 0 },
    { x: rawX, y: rawY }
];

const minX = Math.min(...raw.map(point => point.x));
const maxX = Math.max(...raw.map(point => point.x));
const maxY = Math.max(...raw.map(point => point.y));

const scale = Math.min(
    (width - 2 * padding) / Math.max(maxX - minX, 1),
    (height - 2 * padding) / Math.max(maxY, 1)
);

const points = raw.map(point => ({
    x: padding + (point.x - minX) * scale,
    y: height - padding - point.y * scale
}));

const [A, B, C] = points;
const midpoint = (p, q) => ({
    x: (p.x + q.x) / 2,
    y: (p.y + q.y) / 2
});

const mA = midpoint(B, C);
const mB = midpoint(A, C);
const mC = midpoint(A, B);

const label = (x, y, text) =>
    `<text x="${x}" y="${y}" text-anchor="middle">${text}</text>`;

svg.innerHTML = `
    <polygon points="${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}"
    fill="#f8f8f8" stroke="#333" stroke-width="2"/>
    ${label(A.x - 15, A.y + 20, `A ${format(triangle.A)}°`)}
    ${label(B.x + 18, B.y + 20, `B ${format(triangle.B)}°`)}
    ${label(C.x, C.y - 16, `C ${format(triangle.C)}°`)}
    ${label(mA.x + 19, mA.y, `a=${format(triangle.a)}`)}
    ${label(mB.x - 20, mB.y, `b=${format(triangle.b)}`)}
    ${label(mC.x, mC.y + 20, `c=${format(triangle.c)}`)}
`;
}

function showResults(triangle, formulas) {
  const area = triangle.c * triangle.a *
    Math.sin(triangle.B * Math.PI / 180) / 2;
const perimeter = triangle.a + triangle.b + triangle.c;

document.getElementById("stats").innerHTML = `
    <div class="stat">
    <span>Lados</span>
    <strong>a=${format(triangle.a)}, b=${format(triangle.b)}, c=${format(triangle.c)}</strong>
    </div>
    <div class="stat">
    <span>Ángulos</span>
    <strong>A=${format(triangle.A)}°, B=${format(triangle.B)}°, C=${format(triangle.C)}°</strong>
    </div>
    <div class="stat">
    <span>Área</span>
    <strong>${format(area)} u²</strong>
    </div>
    <div class="stat">
    <span>Perímetro</span>
    <strong>${format(perimeter)} u</strong>
    </div>
`;

formulas.push(
    "Área = (a · c · sen(B)) / 2",
    "Perímetro = a + b + c"
);

document.getElementById("formulas").textContent = formulas.join("\n");
drawTriangle(triangle);
result.hidden = false;
}

document.getElementById("calculate").addEventListener("click", () => {
errorBox.textContent = "";
result.hidden = true;

try {
    const isRight = !document.getElementById("rightMode").hidden;

    if (isRight) {
    const data = readInputs("right", 2);
    const { triangle, formulas } = getRightTriangle(data);
    showResults(triangle, formulas);
    } else {
    const data = readInputs("oblique", 3);
    const kind = document.getElementById("triangleKind").value;
    const { triangle, formulas } = getObliqueTriangle(data, kind);
    showResults(triangle, formulas);
    }
} catch (error) {
    errorBox.textContent = error.message;
}
});