// Game Configuration
const CONFIG = {
    // Dynamic width based on screen size, max 450
    width: Math.min(window.innerWidth, 450), 
    height: Math.min(window.innerHeight, 800), // Fit height too
    wallThickness: 20,
    deadLineY: 150, // Lower it a bit for mobile visibility
    deadLineTimer: 2000, // Time in ms before game over triggers
    fruitTypes: [
        { radius: 15, color: '#F00', label: '🍒', score: 1 },    // Cherry
        { radius: 25, color: '#F55', label: '🍓', score: 3 },    // Strawberry
        { radius: 35, color: '#A0F', label: '🍇', score: 6 },    // Grape
        { radius: 45, color: '#FA0', label: '🍊', score: 10 },   // Dekopon
        { radius: 58, color: '#F80', label: '🍎', score: 15 },   // Persimmon (Orange-ish)
        { radius: 72, color: '#F44', label: '🍎', score: 21 },   // Apple (Red)
        { radius: 85, color: '#FFD', label: '🍐', score: 28 },   // Pear
        { radius: 100, color: '#FBC', label: '🍑', score: 36 },  // Peach
        { radius: 115, color: '#FF0', label: '🍍', score: 45 },  // Pineapple
        { radius: 135, color: '#8F8', label: '🍈', score: 55 },  // Melon
        { radius: 160, color: '#0F0', label: '🍉', score: 66 },  // Watermelon
    ]
};

// Aliases
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Events = Matter.Events,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint,
      Body = Matter.Body;

// Game State
let engine, render, runner;
let currentFruit = null;
let nextFruitType = 0;
let canDrop = true;
let score = 0;
let gameOver = false;
let deadLineTimerStart = null;

// Initialize Game
function init() {
    // 1. Create Engine
    engine = Engine.create();
    
    // 2. Create Renderer
    const container = document.getElementById('game-container');
    
    // Adjust canvas size to window if smaller than config (responsive)
    const renderWidth = Math.min(document.documentElement.clientWidth, CONFIG.width);
    const renderHeight = Math.min(document.documentElement.clientHeight, CONFIG.height);

    render = Render.create({
        element: container,
        engine: engine,
        options: {
            width: renderWidth,
            height: renderHeight,
            wireframes: false,
            background: 'transparent',
            pixelRatio: window.devicePixelRatio // Sharp rendering on Retina/Mobile
        }
    });

    // Update CONFIG to match actual render size if changed
    CONFIG.width = renderWidth;
    CONFIG.height = renderHeight;

    // 3. Create Walls (Container)
    const ground = Bodies.rectangle(CONFIG.width / 2, CONFIG.height, CONFIG.width, CONFIG.wallThickness * 2, { 
        isStatic: true,
        render: { fillStyle: '#bcaaa4' }
    });
    const leftWall = Bodies.rectangle(0, CONFIG.height / 2, CONFIG.wallThickness, CONFIG.height, { 
        isStatic: true,
        render: { fillStyle: '#bcaaa4' }
    });
    const rightWall = Bodies.rectangle(CONFIG.width, CONFIG.height / 2, CONFIG.wallThickness, CONFIG.height, { 
        isStatic: true,
        render: { fillStyle: '#bcaaa4' }
    });
    
    // Dead Line Sensor (Visual only, logic handled separately)
    // We'll draw this manually in afterRender event
    
    Composite.add(engine.world, [ground, leftWall, rightWall]);

    // 4. Input Handling (Mouse/Touch)
    // We won't use Matter.MouseConstraint for dragging fruits directly (that's cheating!)
    // Instead, we'll track mouse X position for the dropper.
    
    container.addEventListener('mousemove', (e) => updateDropperPosition(e));
    container.addEventListener('touchmove', (e) => {
        e.preventDefault(); // Prevent scrolling
        updateDropperPosition(e.touches[0]);
    }, { passive: false });
    
    container.addEventListener('click', (e) => dropFruit());
    container.addEventListener('touchstart', (e) => {
        e.preventDefault();
        dropFruit();
    }, { passive: false });

    // 5. Collision Events
    Events.on(engine, 'collisionStart', handleCollisions);
    
    // 6. Game Loop Events
    Events.on(render, 'afterRender', drawUI);

    // Start Engine & Renderer
    Render.run(render);
    runner = Runner.create();
    Runner.run(runner, engine);
    
    // Initial Setup
    spawnNextFruitPreview();
}

function updateDropperPosition(e) {
    if (!canDrop || gameOver) return;
    
    const rect = render.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Clamp X position within walls
    const limit = CONFIG.width - CONFIG.wallThickness - 20; // Margin
    const clampedX = Math.max(CONFIG.wallThickness + 20, Math.min(x, limit));
    
    // We visualize the dropper position in drawUI
    render.mousePosition = { x: clampedX, y: 50 };
}

function spawnNextFruitPreview() {
    // Simple logic: weighted random for smaller fruits initially
    const maxStartLevel = 3; // 0=Cherry, 1=Strawberry, 2=Grape, 3=Dekopon
    nextFruitType = Math.floor(Math.random() * (maxStartLevel + 1));
    
    // Update HTML preview
    const previewEl = document.getElementById('next-preview');
    previewEl.innerText = CONFIG.fruitTypes[nextFruitType].label;
    previewEl.style.fontSize = '30px';
}

function dropFruit() {
    if (!canDrop || gameOver) return;
    
    canDrop = false;
    
    const x = render.mousePosition ? render.mousePosition.x : CONFIG.width / 2;
    const y = 50; // Drop height
    const typeIndex = nextFruitType;
    
    // Create the fruit body
    const fruit = createFruit(x, y, typeIndex);
    
    Composite.add(engine.world, fruit);
    
    // Prepare next turn
    spawnNextFruitPreview();
    
    // Cooldown
    setTimeout(() => {
        canDrop = true;
    }, 500);
}

function createFruit(x, y, typeIndex) {
    const type = CONFIG.fruitTypes[typeIndex];
    const fruit = Bodies.circle(x, y, type.radius, {
        restitution: 0.3, // Bounciness
        friction: 0.1,
        label: 'fruit_' + typeIndex, // Store type in label for collision
        render: {
            fillStyle: type.color,
            lineWidth: 2,
            strokeStyle: '#000' // Simple border
        }
    });
    // Add custom property for easier access
    fruit.gameType = typeIndex;
    fruit.isMerging = false; // Flag to prevent double-merging
    return fruit;
}

function handleCollisions(event) {
    const pairs = event.pairs;
    
    for (let i = 0; i < pairs.length; i++) {
        const bodyA = pairs[i].bodyA;
        const bodyB = pairs[i].bodyB;

        // Check if both are fruits
        if (bodyA.gameType !== undefined && bodyB.gameType !== undefined) {
            if (bodyA.gameType === bodyB.gameType) {
                // Merge condition met!
                
                // Avoid double processing (e.g. if multiple collisions happen same frame)
                if (bodyA.isMerging || bodyB.isMerging) continue;
                
                // Only merge if not the largest fruit
                if (bodyA.gameType < CONFIG.fruitTypes.length - 1) {
                    mergeFruits(bodyA, bodyB);
                }
            }
        }
    }
}

function mergeFruits(bodyA, bodyB) {
    bodyA.isMerging = true;
    bodyB.isMerging = true;
    
    // Remove old bodies
    Composite.remove(engine.world, [bodyA, bodyB]);
    
    // Calculate new position (midpoint)
    const midX = (bodyA.position.x + bodyB.position.x) / 2;
    const midY = (bodyA.position.y + bodyB.position.y) / 2;
    
    // Create new, larger fruit
    const newTypeIndex = bodyA.gameType + 1;
    const newFruit = createFruit(midX, midY, newTypeIndex);
    
    Composite.add(engine.world, newFruit);
    
    // Update Score
    // Formula: sum of scores of merged fruits? Or just the new fruit score?
    // Original game gives points based on the fruit created.
    score += CONFIG.fruitTypes[newTypeIndex].score;
    document.getElementById('score').innerText = score;
    
    // Optional: Add pop effect or sound here
}

function drawUI() {
    const ctx = render.context;
    
    // 1. Draw "Dead Line"
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.deadLineY);
    ctx.lineTo(CONFIG.width, CONFIG.deadLineY);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]); // Reset
    
    // 2. Draw "Dropper" guide line (if waiting for input)
    if (canDrop && !gameOver && render.mousePosition) {
        ctx.beginPath();
        ctx.moveTo(render.mousePosition.x, 50);
        ctx.lineTo(render.mousePosition.x, CONFIG.height);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw current fruit preview at dropper
        const type = CONFIG.fruitTypes[nextFruitType];
        ctx.beginPath();
        ctx.arc(render.mousePosition.x, 50, type.radius, 0, 2 * Math.PI);
        ctx.fillStyle = type.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        
        // Draw label (emoji)
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(type.label, render.mousePosition.x, 50);
    }
    
    // 3. Draw labels on all active fruits
    const bodies = Composite.allBodies(engine.world);
    for (let body of bodies) {
        if (body.gameType !== undefined) {
            const type = CONFIG.fruitTypes[body.gameType];
            ctx.fillStyle = '#000';
            // Scale font size slightly with radius
            ctx.font = `${Math.min(type.radius, 30)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Rotate label with body
            ctx.save();
            ctx.translate(body.position.x, body.position.y);
            ctx.rotate(body.angle);
            ctx.fillText(type.label, 0, 0);
            ctx.restore();
            
            // Check Game Over Condition
            // If a fruit stays above the deadline and is "resting" (low velocity)
            if (body.position.y < CONFIG.deadLineY && body.velocity.y > -0.1 && body.velocity.y < 0.1) {
                // Simplified check: usually needs a timer
                // triggerGameOver(); 
                // For prototype: just visual warning or log
            }
        }
    }
    
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
        ctx.fillStyle = '#fff';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CONFIG.width / 2, CONFIG.height / 2);
        ctx.font = '20px Arial';
        ctx.fillText('Click to Restart', CONFIG.width / 2, CONFIG.height / 2 + 50);
    }
}

// Start
window.onload = init;
