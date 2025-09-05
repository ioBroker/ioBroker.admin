# ioBroker.admin Development Instructions

**CRITICAL: Always follow these instructions first and only fallback to search or bash commands when the information here is incomplete or found to be in error.**

ioBroker.admin is a complex monorepo that provides the web-based administration interface for ioBroker home automation systems. It consists of a React/TypeScript frontend, Express.js backend, and multiple shared component packages.

## Working Effectively

### Required Node.js Version
- **ALWAYS use Node.js 20** - specified in `.nvmrc`
- Check version: `node --version` should show v20.x.x

### Bootstrap and Install Dependencies
- **Environment Setup**: Set `PUPPETEER_SKIP_DOWNLOAD=true` to avoid network issues with Chrome downloads
- **Install Command**: `PUPPETEER_SKIP_DOWNLOAD=true npm run install-monorepo`
- **Install Time**: Takes 1-2 minutes. NEVER CANCEL.
- **Expected Output**: Installs dependencies for root + 4 workspace packages (adapter-react-v5, dm-gui-components, jsonConfig, admin)

### Build Process
- **Build Command**: `npm run build`
- **Build Time**: Takes 1-2 minutes. NEVER CANCEL. Set timeout to 5+ minutes.
- **What it does**: 
  - Cleans previous builds with `npm run clean` 
  - Runs Lerna to build all 4 packages in dependency order
  - Frontend builds with Vite + TypeScript
  - Backend compiles TypeScript to `build-backend/`
  - Frontend builds to `adminWww/`

### Development Server
- **Start Command**: `npm run start`
- **URL**: http://localhost:3000/ (Vite dev server)
- **Startup Time**: 10-15 seconds. Development server will show "VITE ready" message.
- **What it runs**: Vite development server with hot reload for React frontend
- **Backend**: For full functionality, you need a running ioBroker instance (typically on port 8081)

## Validation and Testing

### Linting
- **Command**: `npm run lint`
- **Time**: 30-60 seconds. NEVER CANCEL.
- **What it checks**: Backend and frontend TypeScript/JavaScript code across all packages
- **Expected**: May show some linting errors in development - this is normal

### Testing
- **Unit Tests**: `npm test` (in packages/admin/) - Takes <5 seconds
- **Package Tests**: Validates package.json and io-package.json structure
- **GUI Tests**: `npm run test:gui` - **REQUIRES Chrome/Puppeteer** (will fail in restricted environments)

### Manual Validation Steps
**ALWAYS perform these validation steps after making changes:**
1. **Build Validation**: Run `npm run build` and ensure it completes without errors
2. **Development Server**: Start `npm run start` and verify it loads at http://localhost:3000/
3. **Linting**: Run `npm run lint` to check code style (some errors are acceptable in development)
4. **Basic UI Test**: Open http://localhost:3000/ and verify the admin interface loads (shows ioBroker admin panel)

## Project Structure and Key Locations

### Monorepo Layout
```
/
├── packages/
│   ├── admin/                    # Main adapter package
│   │   ├── src/                  # Backend TypeScript source
│   │   ├── src-admin/            # React frontend source
│   │   ├── adminWww/            # Built frontend (generated)
│   │   ├── build-backend/       # Built backend (generated)
│   │   └── test/                # Test files
│   ├── adapter-react-v5/        # React components for ioBroker adapters
│   ├── dm-gui-components/       # Device management UI components  
│   └── jsonConfig/              # JSON-based configuration system
├── lerna.json                   # Lerna monorepo configuration
└── package.json                 # Root package with workspace scripts
```

### Important Files
- **Frontend Entry**: `packages/admin/src-admin/src/index.tsx`
- **Backend Entry**: `packages/admin/src/main.ts`
- **Build Scripts**: `packages/admin/tasks.js`
- **Frontend Config**: `packages/admin/src-admin/vite.config.ts`
- **JSON Config Schema**: `packages/jsonConfig/SCHEMA.md`

### Key Commands Reference
```bash
# Quick setup (run once)
PUPPETEER_SKIP_DOWNLOAD=true npm run install-monorepo

# Development workflow
npm run build              # Build all packages (1-2 min)
npm run start             # Start dev server on :3000
npm run lint              # Check code style
npm test                  # Run tests (in packages/admin/)

# Individual package operations
npm run build:backend -w packages/admin    # Build only backend
npm run start -w packages/admin           # Start only admin dev server
```

## Common Development Tasks

### Making Frontend Changes
1. Navigate to `packages/admin/src-admin/src/`
2. Edit React/TypeScript files
3. Development server auto-reloads changes
4. **Always test**: Open http://localhost:3000/ to verify changes

### Making Backend Changes  
1. Navigate to `packages/admin/src/`
2. Edit TypeScript files
3. Run `npm run build:backend -w packages/admin` to compile
4. **Always test**: Restart any running ioBroker instance to pick up changes

### Working with JSON Configuration
1. Check `packages/jsonConfig/SCHEMA.md` for complete documentation
2. Example configs in `packages/jsonConfig/schemas/`
3. **Always validate**: Test configuration changes in the admin interface

### Adding Dependencies
- **Root dependencies**: Add to root `package.json` 
- **Package-specific**: Add to individual package's `package.json`
- **Rule**: All devDependencies should be in root `package.json` except for inter-workspace dependencies

## Troubleshooting

### Common Issues
- **Puppeteer fails**: Set `PUPPETEER_SKIP_DOWNLOAD=true` environment variable
- **Build fails**: Ensure Node.js 20 is installed and run `npm run clean` first
- **GUI tests fail**: Chrome/Puppeteer not available - expected in sandboxed environments
- **Port 3000 busy**: Stop existing Vite dev servers or use different port

### Network Limitations
- **Puppeteer downloads fail**: Always use `PUPPETEER_SKIP_DOWNLOAD=true`
- **npm install issues**: Use `-f` flag if needed: `npm i -f`
- **GUI tests won't work**: Require browser downloads that may be blocked

### Build Artifacts
- **Never commit**: `node_modules/`, `adminWww/`, `build-backend/`, `src-admin/build/`
- **Always commit**: Source files in `src/`, `src-admin/src/`, configuration files

## Architecture Notes

This is a sophisticated ioBroker adapter providing:
- **Web Interface**: React-based admin UI for ioBroker configuration
- **WebSocket Communication**: Real-time communication with ioBroker instances  
- **Adapter Management**: Install, configure, and manage other ioBroker adapters
- **JSON Configuration**: Flexible configuration system for adapters
- **Multi-language Support**: Internationalization throughout the interface

The frontend communicates with ioBroker instances via WebSockets on port 8081 (or proxy during development). The admin interface provides comprehensive management of the entire ioBroker ecosystem.