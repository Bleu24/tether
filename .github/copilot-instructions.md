---
applyTo: "**"
---
# Project general coding standards

## Naming Conventions
- Use PascalCase for component names, interfaces, and type aliases
- Use camelCase for variables, functions, and methods
- Prefix private class members with hash (#)
- Use ALL_CAPS for constants

## Error Handling
- Use try/catch blocks for async operations
- Implement proper error boundaries in React components
- Always log errors with contextual information

## Project Context
- The project is called Tether and it's about building an MVP for a dating app, this contains matching algorithms, recommendation system, and basic CRUD
- The technology we're going to use is Next.js, Node.js (Backend), MySQL for persistent DB

## Folder Structures
- for private folders prefix it with underscore (_)
- when creating a file or folder check the workspace if there is already available, then check if there is a grouping folders (example (landing) folder is a folder that next doesn't take on its route but it can be used to group folders that can be routed)

## Writing README.md
- write a guide on how to setup the project
- make sure each documented piece is concisely written