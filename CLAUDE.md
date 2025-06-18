# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Customer Support Agent

### Setup & Development
- **Install dependencies**: `npm install`
- **Run dev server**: `npm run dev`
- **Lint**: `npm run lint`
- **Build**: `npm run build` (full UI), see package.json for variants

### Code Style
- **TypeScript**: Use strict mode with proper interfaces
- **Components**: Create function components with React hooks
- **State Management**: Use React hooks for state management
- **UI Components**: Utilize shadcn/ui component library
- **Formatting**: Follow Next.js ESLint configuration
- **Naming**: Use PascalCase for components, camelCase for variables/functions
- **Types**: Add appropriate TypeScript interfaces and types
- **Imports**: Group imports by external libraries, then internal modules
- **Error Handling**: Use try/catch blocks with appropriate error logging

### Intercom API docs
- Available at https://developers.intercom.com/docs/references/introduction
- For **users**, use https://developers.intercom.com/docs/references/rest-api/api.intercom.io/contacts
- For **conversations**, use https://developers.intercom.com/docs/references/rest-api/api.intercom.io/conversations
