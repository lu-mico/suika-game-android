# Suika Game Clone (Watermelon Game) - Game Design Document

## 1. Overview
A physics-based puzzle game where players drop fruits into a container. Identical fruits merge upon contact to create larger fruits, aiming to create the largest fruit (Watermelon) and achieve a high score without overflowing the container.

## 2. Core Mechanics
- **Dropping:** Player controls the horizontal position of a fruit at the top of the container and releases it.
- **Physics:** Fruits fall and bounce/roll based on 2D physics (gravity, collisions).
- **Merging:** When two identical fruits collide, they disappear and are replaced by the next larger fruit in the evolution chain at the collision point.
- **Game Over:** If fruits stack up and cross the top boundary line of the container for a certain time, the game ends.

## 3. Fruit Evolution Chain (Smallest to Largest)
1.  Cherry (Smallest)
2.  Strawberry
3.  Grape
4.  Dekopon (Orange)
5.  Persimmon
6.  Apple
7.  Pear
8.  Peach
9.  Pineapple
10. Melon
11. Watermelon (Largest)

## 4. Technical Stack
- **Engine/Library:** Matter.js (2D Physics Engine) + p5.js or plain Canvas API for rendering.
- **Language:** HTML5 / JavaScript.
- **Platform:** Web Browser.

## 5. Development Phases
1.  **Setup:** Basic HTML/JS structure with Matter.js.
2.  **Physics:** Implement container walls and falling objects.
3.  **Input:** Mouse/Touch control to drop fruits.
4.  **Game Logic:** Collision detection and merging logic.
5.  **Visuals:** Placeholder colors/sizes for fruits.
6.  **Polish:** Score tracking, "Next Fruit" preview, Game Over state.
