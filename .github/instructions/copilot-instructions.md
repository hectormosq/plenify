
# Project Overview
Plenify is a personal finance management application designed to help users track their income, expenses, and financial goals. Build as a local-first application, it leverages TinyBase for data storage and synchronization. first as a web application and some responsive design, with plans to expand to mobile platforms in the future.

## Folder Structure
- `client/`: Contains the frontend codebase. Currently using Next.js with TypeScript but the goal is to use base React + Typescript.
- `server/`: Contains the backend codebase. Currently using Node.js with Express and TypeScript.

## Libraries and Frameworks
- Frontend: Next.js, React, TypeScript
- Backend: Node.js, Express, TypeScript
- Database: TinyBase for local-first data storage
- State Management: Xstate for global state management
- Form Handling: React Hook Form for form management
- UI Component Library: MUI for React components + custom components

## UI Guidelines
- Use MUI components for consistency and responsiveness. wrapped in custom components for styling and standardization.
- priorized the use of styled components instead of native html elements.
- It is in dark mode by default, with a toggle for light mode.
- prefer class-based styling over inline styles.

## Coding Standards
- Always use TypeScript interfaces
- Prefer unknown over any
- Small, reusable components

## Testing
- Use Jest for unit testing
