const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const scaleSlider = document.getElementById("scale");
const detailSlider = document.getElementById("detail");
const rotationSlider = document.getElementById("rotation");
const driftSlider = document.getElementById("drift");

const densityToggle = document.getElementById("density");
const heatmapToggle = document.getElementById("heatmap");
const clusterToggle = document.getElementById("clusters");
const communityToggle = document.getElementById("communities");
const hubToggle = document.getElementById("hubs");
const bridgeToggle = document.getElementById("bridges");
const linksToggle = document.getElementById("links");
const curvatureColorToggle = document.getElementById("curvatureColor");

const seedBtn = document.getElementById("seedBtn");
const resetBtn = document.getElementById("resetBtn");
const guideBtn = document.getElementById("guideBtn");
const guidePanel = document.getElementById("guidePanel");

let W = 0;
let H = 0;
let seed = 4421;

/* ==========================================================
   TEMPORAL MEMORY
========================================================== */

let emergenceHistory = [];

function recordEmergenceFrame(metrics) {

    const fingerprint = {

        time: performance.now(),

        nodeCount:
            metrics.visibleNodes || 0,

        clusterCount:
            metrics.clusterCount || 0,

        communityCount:
            metrics.communityCount || 0,

        hubCount:
            metrics.hubCount || 0,

        bridgeCount:
            metrics.bridgeCount || 0,

        emergenceState:
            determineEmergenceState(metrics).state,

        communitySizes:
            metrics.communitySizes || [],

        communityCenters:
            metrics.communityCenters || [],

        largestCommunity:
            metrics.largestCommunity || 0
    };

    emergenceHistory.push(
        fingerprint
    );

    const HISTORY_LIMIT = 500;

    if (
        emergenceHistory.length >
        HISTORY_LIMIT
    ) {

        emergenceHistory.shift();
    }
}

/* ==========================================================
   PERSISTENCE ANALYSIS
========================================================== */

function calculatePersistence() {

    if (
        emergenceHistory.length < 2
    ) {

        return {

            memoryScore: 0,

            communityPersistence: 0,

            hubPersistence: 0,

            bridgePersistence: 0,

            stableCommunities: 0
        };
    }

    const frames =
        emergenceHistory.length;

    let communityFrames = 0;
    let hubFrames = 0;
    let bridgeFrames = 0;

    let stableMatches = 0;
    let comparisonCount = 0;

    emergenceHistory.forEach(frame => {

        if (frame.communityCount > 0)
            communityFrames++;

        if (frame.hubCount > 0)
            hubFrames++;

        if (frame.bridgeCount > 0)
            bridgeFrames++;
    });

    for (
        let i = 1;
        i < emergenceHistory.length;
        i++
    ) {

        const prev =
            emergenceHistory[i - 1];

        const curr =
            emergenceHistory[i];

        const prevCenters =
            prev.communityCenters || [];

        const currCenters =
            curr.communityCenters || [];

        prevCenters.forEach(pc => {

            let matched = false;

            currCenters.forEach(cc => {

                const dx =
                    pc.x - cc.x;

                const dy =
                    pc.y - cc.y;

                const dist =
                    Math.hypot(
                        dx,
                        dy
                    );

                const sizeDelta =
                    Math.abs(
                        pc.size -
                        cc.size
                    );

                if (
                    dist < 40 &&
                    sizeDelta < 6
                ) {

                    matched = true;
                }
            });

            comparisonCount++;

            if (matched)
                stableMatches++;
        });
    }

    const communityPersistence =
        comparisonCount

            ? stableMatches /
              comparisonCount

            : 0;

    const hubPersistence =
        hubFrames / frames;

    const bridgePersistence =
        bridgeFrames / frames;

    const memoryScore =

        (
            communityPersistence +
            hubPersistence +
            bridgePersistence
        ) / 3;

    return {

        memoryScore,

        communityPersistence,

        hubPersistence,

        bridgePersistence,

        stableCommunities:
            stableMatches
    };
}

/* ==========================================================
   EMERGENCE DYNAMICS
========================================================== */

function calculateGrowthMetrics() {

    if (
        emergenceHistory.length < 12
    ) {

        return {

            communityGrowth: 0,
            hubGrowth: 0,
            bridgeGrowth: 0,
            clusterGrowth: 0,

            stabilityIndex: 0,

            emergenceDirection: "Gathering"
        };
    }

    const current =
        emergenceHistory[
            emergenceHistory.length - 1
        ];

    const previous =
        emergenceHistory[
            emergenceHistory.length - 11
        ];

    function growthRate(
        now,
        then
    ) {

        if (
            then === 0 &&
            now === 0
        ) {
            return 0;
        }

        if (
            then === 0
        ) {
            return 1;
        }

        return (
            now - then
        ) / then;
    }

    const communityGrowth =
        growthRate(
            current.communityCount,
            previous.communityCount
        );

    const hubGrowth =
        growthRate(
            current.hubCount,
            previous.hubCount
        );

    const bridgeGrowth =
        growthRate(
            current.bridgeCount,
            previous.bridgeCount
        );

    const clusterGrowth =
        growthRate(
            current.clusterCount,
            previous.clusterCount
        );

    const persistence =
        calculatePersistence();

    const stabilityIndex =
        persistence.memoryScore;

    const combinedGrowth =
        (
            communityGrowth +
            hubGrowth +
            bridgeGrowth +
            clusterGrowth
        ) / 4;

    let emergenceDirection =
        "Stable";

    if (
        combinedGrowth > 0.18
    ) {
        emergenceDirection =
            "Expanding";
    }

    if (
        combinedGrowth < -0.18
    ) {
        emergenceDirection =
            "Fragmenting";
    }

    if (
        stabilityIndex > 0.72 &&
        Math.abs(combinedGrowth) <= 0.18
    ) {
        emergenceDirection =
            "Stabilizing";
    }

    return {

        communityGrowth,
        hubGrowth,
        bridgeGrowth,
        clusterGrowth,

        stabilityIndex,

        emergenceDirection
    };
}

const COMMUNITY_COLORS = [
    "#7dffb3",
    "#ffd966",
    "#66ccff",
    "#ff8a8a",
    "#d69cff",
    "#8fffd1",
    "#ffb570",
    "#9ee0ff",
    "#ffb6d7",
    "#b4ff87"
];

function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

if (guideBtn && guidePanel) {
    guideBtn.addEventListener("click", () => {
        guidePanel.classList.toggle("hidden");
    });
}

/* ==========================================================
   UTILITY
========================================================== */

function mulberry32(a) {
    return function () {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
}

/* ==========================================================
   NODE
========================================================== */

class Node {
    constructor(x, y, level, energy, branchBias, rotationBias, radiusBias, parent = null) {
        this.x = x;
        this.y = y;
        this.level = level;
        this.energy = energy;
        this.branchBias = branchBias;
        this.rotationBias = rotationBias;
        this.radiusBias = radiusBias;
        this.parent = parent;
        this.children = [];
        this.curvature = 0;
        this.clusterId = -1;
        this.communityId = -1;
        this.degree = 0;
        this.isHub = false;
        this.isSuperHub = false;
        this.isBridge = false;
        this.bridgeScore = 0;
    }
}

/* ==========================================================
   TREE GENERATION
========================================================== */

function maxDepthFromScale(scale) {
    if (scale < 8) return 0;
    if (scale < 28) return 1;
    if (scale < 48) return 2;
    if (scale < 68) return 3;
    if (scale < 86) return 4;
    return 5;
}

function buildTree(scale, drift, seedValue) {
    const rng = mulberry32(seedValue);
    const maxDepth = maxDepthFromScale(scale);
    const driftPower = drift / 100;
    const root = new Node(0, 0, 0, 1, 4, 0.12 + (rng() - 0.5) * 0.08, 1, null);

    function grow(node, depth) {
        if (depth >= maxDepth) return;

        const localVariation = (rng() - 0.5) * 2.2 * driftPower;
        const childCount = clamp(Math.round(node.branchBias + localVariation), 2, 6);
        const baseRadius = Math.max(28, 150 - depth * 24);
        const radius = baseRadius * node.radiusBias * (0.88 + rng() * 0.28);
        const inheritedTwist = node.rotationBias + (rng() - 0.5) * 0.18 * driftPower;
        const startAngle = depth * inheritedTwist + (rng() - 0.5) * 0.45 * driftPower;

        for (let i = 0; i < childCount; i++) {
            const spread = (Math.PI * 2) / childCount;
            const asymmetry = (rng() - 0.5) * spread * 0.42 * driftPower;
            const angle = startAngle + i * spread + asymmetry;

            const child = new Node(
                node.x + Math.cos(angle) * radius,
                node.y + Math.sin(angle) * radius,
                depth + 1,
                node.energy * (0.72 + rng() * 0.18),
                clamp(node.branchBias + (rng() - 0.5) * 1.15 * driftPower, 2, 6),
                inheritedTwist + (rng() - 0.5) * 0.13 * driftPower,
                clamp(node.radiusBias + (rng() - 0.5) * 0.25 * driftPower, 0.62, 1.42),
                node
            );

            node.children.push(child);
            grow(child, depth + 1);
        }
    }

    grow(root, 0);
    computeCurvature(root);

    return {
        root,
        maxDepth
    };
}

/* ==========================================================
   CURVATURE
========================================================== */

function computeCurvature(root) {
    function walk(node) {
        if (node.parent && node.parent.parent) {
            const a = node.parent.parent;
            const b = node.parent;
            const c = node;

            const v1x = b.x - a.x;
            const v1y = b.y - a.y;

            const v2x = c.x - b.x;
            const v2y = c.y - b.y;

            const dot = v1x * v2x + v1y * v2y;

            const m1 = Math.hypot(v1x, v1y);
            const m2 = Math.hypot(v2x, v2y);

            node.curvature =
                Math.acos(
                    clamp(
                        dot / (m1 * m2 || 1),
                        -1,
                        1
                    )
                ) *
                180 /
                Math.PI;
        }

        for (const child of node.children) {
            walk(child);
        }
    }

    walk(root);
}

function collectNodes(root) {
    const nodes = [];

    function walk(node) {
        nodes.push(node);

        for (const child of node.children) {
            walk(child);
        }
    }

    walk(root);
    return nodes;
}

/* ==========================================================
   Slider update
========================================================== */

function updateSliderLabels() {

    const scaleVal =
        document.getElementById("scaleVal");

    const detailVal =
        document.getElementById("detailVal");

    const rotationVal =
        document.getElementById("rotationVal");

    const driftVal =
        document.getElementById("driftVal");

    if (scaleVal) {
        scaleVal.textContent = scaleSlider.value;
    }

    if (detailVal) {
        detailVal.textContent = detailSlider.value;
    }

    if (rotationVal) {
        rotationVal.textContent = rotationSlider.value + "°";
    }

    if (driftVal) {
        driftVal.textContent = driftSlider.value;
    }
}
function bindSliderLabelUpdates() {

    const sliders = [
        scaleSlider,
        detailSlider,
        rotationSlider,
        driftSlider
    ];

    sliders.forEach(slider => {
        if (!slider) return;

        slider.addEventListener(
            "input",
            updateSliderLabels
        );

        slider.addEventListener(
            "change",
            updateSliderLabels
        );
    });

    updateSliderLabels();
}


/* ==========================================================
   CLUSTER DETECTION
========================================================== */

function detectClusters(nodes) {

    const threshold = 72;

    let clusterId = 0;
    const clusters = [];

    for (const node of nodes) {
        node.clusterId = -1;
    }

    for (const start of nodes) {

        if (start.clusterId !== -1) continue;

        const queue = [start];
        const members = [];

        start.clusterId = clusterId;

        while (queue.length) {

            const current = queue.shift();

            members.push(current);

            for (const candidate of nodes) {

                if (candidate.clusterId !== -1) continue;

                if (
                    distance(
                        current,
                        candidate
                    ) <= threshold
                ) {

                    candidate.clusterId =
                        clusterId;

                    queue.push(candidate);
                }
            }
        }

        if (members.length >= 4) {

            clusters.push({
                id: clusterId,
                members
            });

            clusterId++;

        } else {

            members.forEach(member => {
                member.clusterId = -1;
            });
        }
    }

    return clusters;
}

/* ==========================================================
   COMMUNITY DETECTION - WORKING VERSION
========================================================== */

function detectCommunities(visibleNodes) {
    if (visibleNodes.length === 0) return [];

    const communities = [];
    let communityId = 0;

    visibleNodes.forEach(node => {
        node.communityId = -1;
    });

    const scaleValue = Number(scaleSlider.value);
    const detailValue = Number(detailSlider.value);

    const separation = clamp(
       42 + (detailValue * 0.15) - (scaleValue * 0.15),
        24,
        60
    );

    const sortedNodes = [...visibleNodes].sort(
        (a, b) => (b.children.length || 0) - (a.children.length || 0)
    );

    for (const start of sortedNodes) {
        if (start.communityId !== -1) continue;

        const members = [];
        const queue = [start];

        start.communityId = communityId;

        while (queue.length) {
            const current = queue.shift();
            members.push(current);

            for (const candidate of visibleNodes) {
                if (candidate.communityId !== -1) continue;

                if (distance(current, candidate) < separation) {
                    candidate.communityId = communityId;
                    queue.push(candidate);
                }
            }
        }

        if (members.length >= 4) {
            communities.push({
                id: communityId,
                members
            });

            communityId++;
        } else {
            members.forEach(member => {
                member.communityId = -1;
            });
        }
    }

    return communities;
}

/* ==========================================================
   HUB + BRIDGE DETECTION
========================================================== */

function detectStructure(
    visibleNodes
) {

    const hubs = [];
    const bridges = [];

    const pressureNodes = [];
    const pressureCenters = [];

    let largestHubDegree = 0;

    const maxRadius =
        Math.max(
            ...visibleNodes.map(
                node =>
                    Math.hypot(
                        node.x,
                        node.y
                    )
            ),
            1
        );

    // -----------------------------------
    // PASS 1
    // Degree + Hub Detection
    // -----------------------------------

    for (
        const node
        of visibleNodes
    ) {

        const degree =
            node.children.length +
            (
                node.parent
                    ? 1
                    : 0
            );

        node.degree =
            degree;

        node.isHub =
            false;

        node.isSuperHub =
            false;

        node.isBridge =
            false;

        node.bridgeScore =
            0;

        node.pressure =
            0;

        largestHubDegree =
            Math.max(
                largestHubDegree,
                degree
            );

        if (
            degree >= 5
        ) {

            node.isHub =
                true;

            hubs.push(node);
        }

        if (
            degree >= 6
        ) {

            node.isSuperHub =
                true;
        }
    }

    // -----------------------------------
    // PASS 2
    // Bridge Detection
    // -----------------------------------

    for (
        const node
        of visibleNodes
    ) {

        if (
            !node.parent
        ) continue;

        if (
            node.children.length === 0
        ) continue;

        const r =
            Math.hypot(
                node.x,
                node.y
            ) /
            maxRadius;

        const radialBand =
            r > 0.18 &&
            r < 0.82;

        const connectorShape =
            node.children.length >= 2 ||
            node.degree >= 3;

        const bridgeScore =
            (radialBand ? 1 : 0) +
            (connectorShape ? 1 : 0) +
            (node.level > 0 ? 1 : 0) +
            (node.children.length > 0 ? 1 : 0);

        node.bridgeScore =
            bridgeScore;

        if (
            bridgeScore >= 4 &&
            !node.isSuperHub
        ) {

            node.isBridge =
                true;

            bridges.push(node);
        }
    }

    // -----------------------------------
    // PASS 3
    // Pressure Field
    // -----------------------------------

    let totalPressure = 0;
    let maxPressure = 0;

    for (
        const node
        of visibleNodes
    ) {

        const pressure =
            (node.degree * 2) +
            (node.bridgeScore * 3) +
            node.children.length;

        node.pressure =
            pressure;

        pressureNodes.push(
            node
        );

        totalPressure +=
            pressure;

        maxPressure =
            Math.max(
                maxPressure,
                pressure
            );
    }

    const avgPressure =
        visibleNodes.length
            ? totalPressure /
              visibleNodes.length
            : 0;

    for (
        const node
        of pressureNodes
    ) {

        if (
            node.pressure >
            avgPressure * 1.25
        ) {

            pressureCenters.push(
                node
            );
        }
    }

    return {

        hubs,
        bridges,

        pressureNodes,
        pressureCenters,

        avgPressure,
        maxPressure,

        largestHubDegree,

        hubCoverage:
            visibleNodes.length
                ? hubs.length /
                  visibleNodes.length
                : 0,

        bridgeCoverage:
            visibleNodes.length
                ? bridges.length /
                  visibleNodes.length
                : 0,

        pressureCoverage:
            visibleNodes.length
                ? pressureCenters.length /
                  visibleNodes.length
                : 0
    };
}

/* ==========================================================
   VISIBILITY
========================================================== */

function visibleLimit(
    maxDepth,
    detail
) {
    return clamp(
        Math.ceil(
            maxDepth *
            (
                1 -
                detail / 100
            )
        ),
        0,
        maxDepth
    );
}

function isVisible(
    node,
    limit
) {
    return node.level <= limit;
}

/* ==========================================================
   PROJECTION
========================================================== */

function project(
    x,
    y,
    deg
) {
    const a =
        deg *
        Math.PI /
        180;

    const ca =
        Math.cos(a);

    const sa =
        Math.sin(a);

    return {
        x:
            W / 2 +
            x * ca -
            y * sa,

        y:
            H / 2 +
            x * sa +
            y * ca
    };
}
/* ==========================================================
   BACKGROUND
========================================================== */

function drawBackground(detail) {

    const grad =
        ctx.createRadialGradient(
            W / 2,
            H / 2,
            20,

            W / 2,
            H / 2,

            Math.max(
                W,
                H
            ) * 0.7
        );

    if (detail < 50) {

        grad.addColorStop(
            0,
            "rgba(50,20,90,.18)"
        );

        grad.addColorStop(
            1,
            "rgba(0,0,0,1)"
        );

    } else {

        grad.addColorStop(
            0,
            "rgba(90,18,12,.12)"
        );

        grad.addColorStop(
            1,
            "rgba(0,0,0,1)"
        );
    }

    ctx.fillStyle = grad;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );
}

/* ==========================================================
   DENSITY LAYER
========================================================== */

function drawDensity(
    nodes,
    limit,
    rotation
) {

    ctx.save();

    ctx.globalCompositeOperation =
        "lighter";

    for (const node of nodes) {

        if (
            !isVisible(
                node,
                limit
            )
        ) continue;

        const p =
            project(
                node.x,
                node.y,
                rotation
            );

        const r =
            18 +
            node.energy * 28;

        const g =
            ctx.createRadialGradient(
                p.x,
                p.y,
                0,

                p.x,
                p.y,
                r
            );

        g.addColorStop(
            0,
            `rgba(
                190,
                120,
                255,
                ${0.09 + node.energy * 0.13}
            )`
        );

        g.addColorStop(
            0.45,
            `rgba(
                120,
                60,
                210,
                ${0.04 + node.energy * 0.06}
            )`
        );

        g.addColorStop(
            1,
            "rgba(0,0,0,0)"
        );

        ctx.fillStyle = g;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            r,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.restore();
}

/* ==========================================================
   HEATMAP
========================================================== */

function drawHeatmap(
    visibleNodes,
    rotation
) {

    const cellSize = 40;

    const grid =
        new Map();

    for (
        const node
        of visibleNodes
    ) {

        const p =
            project(
                node.x,
                node.y,
                rotation
            );

        const gx =
            Math.floor(
                p.x /
                cellSize
            );

        const gy =
            Math.floor(
                p.y /
                cellSize
            );

        const key =
            gx +
            "," +
            gy;

        grid.set(
            key,
            (
                grid.get(key) ||
                0
            ) + 1
        );
    }

    let maxDensity = 1;

    for (
        const value
        of grid.values()
    ) {

        maxDensity =
            Math.max(
                maxDensity,
                value
            );
    }

    ctx.save();

    for (
        const [key, count]
        of grid.entries()
    ) {

        const [gx, gy] =
            key
                .split(",")
                .map(Number);

        const strength =
            count /
            maxDensity;

        ctx.fillStyle =
            `rgba(
                255,
                120,
                40,
                ${strength * 0.35}
            )`;

        ctx.fillRect(
            gx * cellSize,
            gy * cellSize,
            cellSize,
            cellSize
        );
    }

    ctx.restore();

    return maxDensity;
}

/* ==========================================================
   COMMUNITY RENDER
========================================================== */

/* ==========================================================
   COMMUNITY RENDER - WITH CENTER GLOW
========================================================== */

function drawCommunities(communities, rotation) {
    ctx.save();

    communities.forEach(community => {
        if (community.members.length < 6) return;

        const color = COMMUNITY_COLORS[community.id % COMMUNITY_COLORS.length];

        // Draw all member nodes with soft tint
        for (const node of community.members) {
            const p = project(node.x, node.y, rotation);
            ctx.fillStyle = color + "44";           // soft overlay
            ctx.beginPath();
            ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
            ctx.fill();
        }

        // Calculate center
        let cx = 0, cy = 0;
        community.members.forEach(n => {
            cx += n.x;
            cy += n.y;
        });
        cx /= community.members.length;
        cy /= community.members.length;

        const center = project(cx, cy, rotation);

        // Strong center glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 25;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(center.x, center.y, 18, 0, Math.PI * 2);
        ctx.stroke();

        // Inner bright dot
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.restore();
}

/* ==========================================================
   CLUSTER RENDER
========================================================== */

function drawClusters(
    clusters,
    rotation
) {

    ctx.save();

    for (
        const cluster
        of clusters
    ) {

        if (
            cluster.members.length < 4
        ) continue;

        let cx = 0;
        let cy = 0;

        for (
            const node
            of cluster.members
        ) {

            cx += node.x;
            cy += node.y;
        }

        cx /=
            cluster.members.length;

        cy /=
            cluster.members.length;

        let radius = 0;

        for (
            const node
            of cluster.members
        ) {

            radius =
                Math.max(
                    radius,
                    Math.hypot(
                        node.x - cx,
                        node.y - cy
                    )
                );
        }

        const p =
            project(
                cx,
                cy,
                rotation
            );

        ctx.strokeStyle = "rgba(80,255,180,0.55)";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            radius + 15,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }

    ctx.restore();
}

/* ==========================================================
   HUB RENDER
========================================================== */

function drawHubs(
    hubs,
    rotation
) {

    ctx.save();

    for (
        const node
        of hubs
    ) {

        const p =
            project(
                node.x,
                node.y,
                rotation
            );

        // -----------------------------------
        // Pressure Well
        // -----------------------------------

        if (
            node.pressure >
            0
        ) {

            const pressureRadius =
                Math.min(
                    10 +
                    node.pressure,
                    40
                );

            const pressureGlow =
                ctx.createRadialGradient(
                    p.x,
                    p.y,
                    0,
                    p.x,
                    p.y,
                    pressureRadius
                );

            pressureGlow.addColorStop(
                0,
                "rgba(0,255,255,0.25)"
            );

            pressureGlow.addColorStop(
                1,
                "rgba(0,255,255,0)"
            );

            ctx.fillStyle =
                pressureGlow;

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                pressureRadius,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        // -----------------------------------
        // Hub Core
        // -----------------------------------

        ctx.fillStyle =

            node.isSuperHub

                ? "rgba(80,255,255,0.95)"

                : "rgba(255,215,0,0.95)";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,

            node.isSuperHub
                ? 8
                : 6,

            0,
            Math.PI * 2
        );

        ctx.fill();

        // -----------------------------------
        // Pressure Ring
        // -----------------------------------

        if (
            node.pressure >
            12
        ) {

            ctx.strokeStyle =
                "rgba(0,255,255,0.7)";

            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,

                Math.min(
                    12 +
                    node.pressure * 0.3,
                    28
                ),

                0,
                Math.PI * 2
            );

            ctx.stroke();
        }
    }

    ctx.restore();
}

/* ==========================================================
   BRIDGE RENDER
========================================================== */

function drawBridges(
    bridges,
    rotation
) {

    ctx.save();

    for (
        const node
        of bridges
    ) {

        const p =
            project(
                node.x,
                node.y,
                rotation
            );

        ctx.strokeStyle = "rgba(255,80,80,0.9)";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            8,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }

    ctx.restore();
}

/* ==========================================================
   CONNECTION COLORS
========================================================== */

function curvatureStroke(
    curvature,
    alpha
) {

    if (curvature < 25) {
        return `rgba(120,210,255,${alpha})`;
    }

    if (curvature < 70) {
        return `rgba(190,120,255,${alpha})`;
    }

    return `rgba(255,135,80,${alpha})`;
}

/* ==========================================================
   CONNECTION RENDER
========================================================== */

function drawConnections(
    node,
    limit,
    rotation,
    detail
) {

    if (node.level >= limit) {
        return;
    }

    const p1 =
        project(
            node.x,
            node.y,
            rotation
        );

    for (
        const child
        of node.children
    ) {

        if (
            child.level > limit
        ) {
            continue;
        }

        const p2 =
            project(
                child.x,
                child.y,
                rotation
            );

        const alpha =
            0.18 +
            child.energy * 0.45;

        if (
            curvatureColorToggle &&
            curvatureColorToggle.checked
        ) {

            ctx.strokeStyle =
                curvatureStroke(
                    child.curvature,
                    alpha
                );

        } else {

            ctx.strokeStyle =

                detail < 50

                    ? `rgba(188,115,255,${alpha})`

                    : `rgba(255,95,65,${alpha * 0.82})`;
        }

        ctx.lineWidth =
            Math.max(
                0.4,
                1.6 -
                child.level * 0.18
            );

        ctx.beginPath();

        ctx.moveTo(
            p1.x,
            p1.y
        );

        ctx.lineTo(
            p2.x,
            p2.y
        );

        ctx.stroke();

        drawConnections(
            child,
            limit,
            rotation,
            detail
        );
    }
}

/* ==========================================================
   NODE RENDER
========================================================== */

/* ==========================================================
   NODE RENDER - WITH COMMUNITY COLORING
========================================================== */

function drawNodes(
    nodes,
    limit,
    rotation,
    detail
) {

    for (const node of nodes) {

        if (!isVisible(node, limit)) continue;

        const p = project(node.x, node.y, rotation);

        const size = node.level === 0
            ? 5.5
            : Math.max(1.8, 4.7 - node.level * 0.45);

        // === COMMUNITY COLORING ===
        if (communityToggle && communityToggle.checked && node.communityId !== -1) {
            const baseColor = COMMUNITY_COLORS[node.communityId % COMMUNITY_COLORS.length];
            ctx.fillStyle = baseColor;                    // Bright & saturated
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 12;                          // Nice glow
        }
        // === ROOT NODE ===
        else if (node.level === 0) {
            ctx.fillStyle = "rgba(255,255,255,1)";
            ctx.shadowBlur = 0;
        }
        // === NORMAL NODES ===
        else {
            ctx.fillStyle = detail < 50
                ? `rgba(235,220,255,${0.72 + node.energy * 0.28})`
                : `rgba(255,210,195,${0.68 + node.energy * 0.24})`;
            ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Reset shadow so it doesn't affect other drawings
        if (ctx.shadowBlur > 0) ctx.shadowBlur = 0;

        // Root highlight
        if (node.level === 0) {
            ctx.strokeStyle = "rgba(200,130,255,.85)";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

/* ==========================================================
   ANALYSIS - FULL METRICS
========================================================== */

function analyze(
    nodes,
    visibleNodes,
    clusters,
    communities,
    structure,
    peakDensity
) {

    // Degree Stats

    let degreeSum = 0;
    let maxDegree = 0;

    const degreeBins = {};

    visibleNodes.forEach(node => {

        const d =
            node.degree || 0;

        degreeBins[d] =
            (degreeBins[d] || 0) + 1;

        degreeSum += d;

        maxDegree =
            Math.max(
                maxDegree,
                d
            );
    });

    const avgDegree =
        visibleNodes.length
            ? degreeSum / visibleNodes.length
            : 0;

    // Radial / Core / Frontier

    const maxR =
        Math.max(
            ...visibleNodes.map(
                n =>
                    Math.hypot(
                        n.x,
                        n.y
                    )
            ),
            1
        );

    const coreRadius =
        maxR * 0.22;

    const coreNodes =
        visibleNodes.filter(
            n =>
                Math.hypot(
                    n.x,
                    n.y
                ) <= coreRadius
        ).length;

    const coreRatio =
        visibleNodes.length
            ? coreNodes /
              visibleNodes.length
            : 0;

    const leafNodes =
        visibleNodes.filter(
            n =>
                (n.degree || 0) === 1
        ).length;

    const frontierRatio =
        visibleNodes.length
            ? leafNodes /
              visibleNodes.length
            : 0;

    // Radial Bins

    const radialBins =
        Array(11).fill(0);

    visibleNodes.forEach(node => {

        const r =
            Math.floor(
                (
                    Math.hypot(
                        node.x,
                        node.y
                    ) / maxR
                ) * 10
            );

        radialBins[
            Math.min(
                r,
                10
            )
        ]++;
    });

    // Shell Peaks

    let shellPeaks = 0;

    for (
        let i = 1;
        i < radialBins.length - 1;
        i++
    ) {

        if (
            radialBins[i] >
                radialBins[i - 1] &&
            radialBins[i] >
                radialBins[i + 1]
        ) {

            shellPeaks++;
        }
    }

    // Curvature

    let curvatureSum = 0;
    let curvatureCount = 0;

    const curvatureBins =
        Array(9).fill(0);

    visibleNodes.forEach(node => {

        const curv =
            node.curvature || 0;

        if (curv > 0) {

            const idx =
                Math.floor(
                    curv / 20
                );

            if (
                idx >= 0 &&
                idx < curvatureBins.length
            ) {

                curvatureBins[idx]++;
            }

            curvatureSum += curv;
            curvatureCount++;
        }
    });

    const avgCurvature =
        curvatureCount
            ? curvatureSum /
              curvatureCount
            : 0;

    // Clusters

    const meaningfulClusters =
        clusters.filter(
            c =>
                c.members.length >= 4
        );

    const clusterCount =
        meaningfulClusters.length;

    const largestCluster =
        meaningfulClusters.length
            ? Math.max(
                ...meaningfulClusters.map(
                    c =>
                        c.members.length
                )
            )
            : 0;

    const clusterCoverage =
        visibleNodes.length &&
        largestCluster

            ? largestCluster /
              visibleNodes.length

            : 0;

    // Communities
    // v3.0A.1 Fingerprint Support

    const communitySizes =
        communities
            .map(
                c =>
                    c.members.length
            )
            .sort(
                (a, b) => b - a
            );

    const communityCenters =
        communities.map(c => {

            let cx = 0;
            let cy = 0;

            c.members.forEach(n => {

                cx += n.x;
                cy += n.y;

            });

            return {

                x:
                    cx / c.members.length,

                y:
                    cy / c.members.length,

                size:
                    c.members.length

            };

        });

    const largestCommunity =
        communitySizes.length
            ? communitySizes[0]
            : 0;

    const totalCommunityNodes =
        communitySizes.reduce(
            (sum, size) =>
                sum + size,
            0
        );

    const communityCoverage =
        visibleNodes.length

            ? totalCommunityNodes /
              visibleNodes.length

            : 0;

    // Return

    return {

        avgDegree,
        maxDegree,

        coreRatio,
        frontierRatio,

        shellPeaks,

        avgCurvature,
        curvatureBins,

        clusterCount,
        largestCluster,
        clusterCoverage,

        communityCount:
            communities.length,

        communitySizes,

        communityCenters,

        largestCommunity,

        communityCoverage,

        hubCount:
            structure.hubs.length,

        largestHub:
            structure.largestHubDegree,

        bridgeCount:
    structure.bridges.length,

bridgeCoverage:
    structure.bridgeCoverage,

avgPressure:
    structure.avgPressure,

maxPressure:
    structure.maxPressure,

pressureCoverage:
    structure.pressureCoverage,

pressureCenterCount:
    structure.pressureCenters.length,

peakDensity,

        radialBins,

        degreeBins

    };
}

/* ==========================================================
   EMERGENCE INTELLIGENCE
========================================================== */

function determineEmergenceState(m) {

    let state = "Fragmented";
    let interpretation =
        "Sparse disconnected structure with little large-scale organization.";

    if (
        m.clusterCoverage > 0.35 &&
        m.communityCount >= 2
    ) {
        state = "Cellular";

        interpretation =
            "Localized clusters are forming but remain weakly connected.";
    }

    if (
        m.communityCoverage > 0.55 &&
        m.communityCount >= 3
    ) {
        state = "Networked";

        interpretation =
            "Multiple communities have emerged and are beginning to organize into larger structures.";
    }

    if (
        m.bridgeCoverage > 0.04 &&
        m.communityCount >= 2
    ) {
        state = "Bridge-Dominant";

        interpretation =
            "Sparse but highly bridged structure forming around one dominant community.";
    }

    if (
        m.communityCoverage > 0.80 &&
        m.clusterCoverage > 0.75
    ) {
        state = "Unified";

        interpretation =
            "Most visible nodes participate in a coherent large-scale structure.";
    }

    return {
        state,
        interpretation
    };
}

/* ==========================================================
   TELEMETRY
========================================================== */

function setMetric(
    id,
    value
) {

    const el =
        document.getElementById(id);

    if (el) {
        el.textContent =
            value;
    }
}

function updateTelemetry(m) {

    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    set("avgDegree", m.avgDegree.toFixed(2));
    set("maxDegree", m.maxDegree);
    set("coreRatio", (m.coreRatio * 100).toFixed(1) + "%");
    set("frontierRatio", (m.frontierRatio * 100).toFixed(1) + "%");
    set("shellPeaks", m.shellPeaks);
    set("avgCurvature", m.avgCurvature.toFixed(1) + "°");

    set("clusterCount", m.clusterCount);
    set("largestCluster", m.largestCluster);
    set("clusterCoverage", (m.clusterCoverage * 100).toFixed(1) + "%");

    set("communityCount", m.communityCount);
    set("largestCommunity", m.largestCommunity);
    set("communityCoverage", (m.communityCoverage * 100).toFixed(1) + "%");

    set("hubCount", m.hubCount);
    set("largestHub", m.largestHub);
    set("bridgeCount", m.bridgeCount);
    set("bridgeCoverage", (m.bridgeCoverage * 100).toFixed(1) + "%");

    set("peakDensity", m.peakDensity);

    set("pressureCenterCount", m.pressureCenterCount || 0);
    set("avgPressure", (m.avgPressure || 0).toFixed(2));
    set("maxPressure", m.maxPressure || 0);
    set("pressureCoverage", ((m.pressureCoverage || 0) * 100).toFixed(1) + "%");

    set(
        "memoryScore",
        (m.memoryScore * 100).toFixed(1) + "%"
    );

    set(
        "communityPersistence",
        (m.communityPersistence * 100).toFixed(1) + "%"
    );

    set(
        "hubPersistence",
        (m.hubPersistence * 100).toFixed(1) + "%"
    );

    set(
        "bridgePersistence",
        (m.bridgePersistence * 100).toFixed(1) + "%"
    );

    const emergence =
        determineEmergenceState(m);

    set(
        "emergenceState",
        emergence.state
    );

    set(
        "emergenceInterpretation",
        emergence.interpretation
    );

    renderBars(
        "degreeBars",
        m.degreeBins || {},
        "#66ccff"
    );

    renderBars(
        "radialBars",
        Object.fromEntries(
            m.radialBins.map(
                (v,i)=>[i,v]
            )
        ),
        "#7dffb3"
    );

    renderBars(
        "curvatureBars",
        Object.fromEntries(
            m.curvatureBins.map(
                (v,i)=>[
                    `${i*20}-${(i+1)*20}`,
                    v
                ]
            )
        ),
        "#ffb570"
    );
}

/* ==========================================================
   HUD + HISTOGRAMS
========================================================== */

function updateHUD(
    visibleNodes,
    totalNodes,
    depth
) {

    const set = (id, value) => {

        const el =
            document.getElementById(id);

        if (el) {
            el.textContent = value;
        }
    };

    set("hudScale", scaleSlider.value);
    set("hudNodes", visibleNodes);
    set("hudTotal", totalNodes);
    set("hudDepth", depth);
    set("hudSeed", seed);

    set(
        "hudView",
        Number(detailSlider.value) < 50
            ? "IR"
            : "UV"
    );
}

function renderBars(containerId, data, color = "#7dffb3") {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container not found: ${containerId}`);
        return;
    }

    container.innerHTML = "";

    if (Object.keys(data).length === 0) return;

    const maxValue = Math.max(...Object.values(data), 1);

    Object.entries(data)
        .sort(([a], [b]) => Number(a) - Number(b))   // sort numerically
        .forEach(([label, value]) => {
            const row = document.createElement("div");
            row.className = "barRow";

            const name = document.createElement("span");
            name.className = "barLabel";
            name.textContent = label;

            const track = document.createElement("div");
            track.className = "barTrack";

            const fill = document.createElement("div");
            fill.className = "barFill";
            fill.style.width = `${(value / maxValue) * 100}%`;
            fill.style.background = color;

            const val = document.createElement("span");
            val.className = "barValue";
            val.textContent = value;

            track.appendChild(fill);
            row.appendChild(name);
            row.appendChild(track);
            row.appendChild(val);
            container.appendChild(row);
        });
}


/* ==========================================================
   ANIMATION
========================================================== */

function animate() {

    requestAnimationFrame(
        animate
    );

    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    const scale =
        Number(
            scaleSlider.value
        );

    const detail =
        Number(
            detailSlider.value
        );

    const rotation =
        Number(
            rotationSlider.value
        );

    const drift =
        Number(
            driftSlider.value
        );

    const tree =
        buildTree(
            scale,
            drift,
            seed
        );

    const root =
        tree.root;

    const maxDepth =
        tree.maxDepth;

    const nodes =
        collectNodes(root);

    const limit =
        visibleLimit(
            maxDepth,
            detail
        );

    const visibleNodes =
        nodes.filter(
            node =>
                isVisible(
                    node,
                    limit
                )
        );

    const clusters =
        detectClusters(
            visibleNodes
        );

    const communities =
        detectCommunities(
            visibleNodes
        );

    const structure =
        detectStructure(
            visibleNodes
        );

    drawBackground(
        detail
    );

    let peakDensity = 0;

    if (
        densityToggle &&
        densityToggle.checked
    ) {

        drawDensity(
            nodes,
            limit,
            rotation
        );
    }

    if (
        heatmapToggle &&
        heatmapToggle.checked
    ) {

        peakDensity =
            drawHeatmap(
                visibleNodes,
                rotation
            );
    }

    if (
        linksToggle &&
        linksToggle.checked
    ) {

        drawConnections(
            root,
            limit,
            rotation,
            detail
        );
    }

    if (
        communityToggle &&
        communityToggle.checked
    ) {

        drawCommunities(
            communities,
            rotation
        );
    }

    if (
        clusterToggle &&
        clusterToggle.checked
    ) {

        drawClusters(
            clusters,
            rotation
        );
    }

    if (
        hubToggle &&
        hubToggle.checked
    ) {

        drawHubs(
            structure.hubs,
            rotation
        );
    }

    if (
        bridgeToggle &&
        bridgeToggle.checked
    ) {

        drawBridges(
            structure.bridges,
            rotation
        );
    }

    drawNodes(
        nodes,
        limit,
        rotation,
        detail
    );

    const metrics =
        analyze(
            nodes,
            visibleNodes,
            clusters,
            communities,
            structure,
            peakDensity
        );

    /* ==========================================
       PREP METRICS FOR MEMORY SYSTEM
    ========================================== */

    metrics.visibleNodes =
        visibleNodes.length;

    metrics.totalNodes =
        nodes.length;

    metrics.depth =
        maxDepth;

    /* ==========================================
       TEMPORAL MEMORY
    ========================================== */

    recordEmergenceFrame(
        metrics
    );

    const persistence =
        calculatePersistence();

    metrics.memoryScore =
        persistence.memoryScore;

    metrics.communityPersistence =
        persistence.communityPersistence;

    metrics.hubPersistence =
        persistence.hubPersistence;

    metrics.bridgePersistence =
        persistence.bridgePersistence;

    metrics.stableCommunities =
        persistence.stableCommunities;

    const growth =
        calculateGrowthMetrics();

        metrics.communityGrowth =
            growth.communityGrowth;

        metrics.hubGrowth =
            growth.hubGrowth;

        metrics.bridgeGrowth =
            growth.bridgeGrowth;

        metrics.clusterGrowth =
            growth.clusterGrowth;

        metrics.stabilityIndex =
            growth.stabilityIndex;

        metrics.emergenceDirection =
            growth.emergenceDirection;

    /* ==========================================
       UI UPDATE
    ========================================== */

    updateTelemetry(
        metrics
    );

    updateHUD(
        visibleNodes.length,
        nodes.length,
        maxDepth
    );
}

/* ==========================================================
   CONTROLS
========================================================== */

/* ==========================================================
   CONTROLS
========================================================== */

bindSliderLabelUpdates();

if (seedBtn) {

    seedBtn.addEventListener(
        "click",
        () => {

            seed =
                Math.floor(
                    Math.random() *
                    999999
                );

            emergenceHistory = [];
        }
    );
}

if (resetBtn) {

    resetBtn.addEventListener(
        "click",
        () => {

            scaleSlider.value = 75;
            detailSlider.value = 20;
            rotationSlider.value = 0;
            driftSlider.value = 50;

            emergenceHistory = [];

            updateSliderLabels();
        }
    );
}

/* ==========================================================
   START
========================================================== */

animate();