# ioBroker.admin Development Instructions

**CRITICAL: Always follow these instructions first and only fallback to search or bash commands when the information here is incomplete or found to be in error.**

## 🚨 CRITICAL ISSUE MANAGEMENT POLICY

**NEVER automatically close issues with PR merges. All issues must be manually validated before closing.**

### Issue Handling Rules
1. **NEVER** use keywords that auto-close issues in PR titles, descriptions, or commit messages:
   - Prohibited: "fix", "fixes", "fixed", "close", "closes", "closed", "resolve", "resolves", "resolved"
   - Use instead: "address", "implement", "handle", "improve", "related to", "regarding"

2. **Reference issues neutrally**: Use "Related to #123" instead of "Fixes #123"

3. **Add 'fixed' label**: When a PR fully addresses an issue, manually add the "fixed" label to the issue (if you have permissions)

4. **Manual validation required**: Issues should only be closed manually by maintainers after proper review and validation, not automatically by PR merges

---

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

### Adding change log
- **Update README.md**: Add to chapter "Changelog" new entry about changes in form `- (@copilot) description of the changes`. Create as a first subchapter `### **WORK IN PROGRESS**`if not exists. Later it will be used by automatic release.

**CRITICAL: do not close the issue after merging of PR into master branch, as this issue must be manually validated before closing!**

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

## CoPilot Pull Request and Issue Management

### 🚨 CRITICAL: Issue Auto-Closing Prevention

**PRIMARY RULE: Do not close issues automatically with PR merges. Issues must be manually validated after release.**

### Issue Handling Guidelines
When creating PRs that address GitHub issues, follow these specific practices:

**NEVER** use GitHub keywords that automatically close issues (like "fixes", "closes", "resolves") in PR titles or descriptions. Instead:

1. **Link without closing**: Reference issues using neutral language:
   - Use "Related to #123" instead of "Fixes #123"
   - Use "Addresses #123" instead of "Closes #123"
   - Use "Implements #123" instead of "Resolves #123"

2. **Add issue comments**: After creating a PR, add a comment to the referenced issue with:
   - Link to the PR
   - Brief description of the changes made
   - Request for review/testing if applicable

3. **Set issue labels**: When a PR fully addresses an issue, **ALWAYS** manually set the "fixed" label on the issue (if you have permissions). This is preferred over auto-closing.

### Changelog Management
**ALWAYS** add a user-focused changelog entry for every PR to the README.md file:

1. **Location**: Add entries under the "### **WORK IN PROGRESS**" section in README.md
2. **Format**: Follow the existing changelog format:
   ```
   - (@your-username) Brief user-focused description of the change
   ```
3. **Style**: Keep entries concise and focused on user impact, not technical implementation details
4. **Examples**:
   - Good: "Fixed login issues with special characters in passwords"
   - Bad: "Refactored authentication service to handle URL encoding"

### Example PR Description Template
```
## Summary
Brief description of changes made.

## Related Issues
Related to #123

## Changes Made
- List of key changes
- User-visible improvements
- Bug fixes

## Testing
- How changes were tested
- Manual validation steps performed

## Changelog Entry Added
- Added entry to WORK IN PROGRESS section in README.md
```

Remember: Issues should be closed manually by maintainers after proper review and validation, not automatically by PR merges.

### Prohibited Keywords in PR Content
**NEVER use these keywords in PR titles, descriptions, or commit messages** as they will automatically close issues:

#### Absolutely Prohibited Auto-Closing Keywords:
- "fix", "fixes", "fixed", "fixing"
- "close", "closes", "closed", "closing"  
- "resolve", "resolves", "resolved", "resolving"

#### Use These Neutral Alternatives Instead:
- "address", "addresses", "addressed", "addressing"
- "implement", "implements", "implemented", "implementing"  
- "handle", "handles", "handled", "handling"
- "improve", "improves", "improved", "improving"
- "update", "updates", "updated", "updating"
- "related to", "regarding", "concerning", "about"
- "work on", "working on", "worked on"

#### Safe Linking Phrases:
- "Related to #123"
- "Addresses issue #123"
- "Implements feature requested in #123"
- "Handles problem described in #123"
- "Improves situation in #123"

### Required Actions for Every PR
1. **Update README.md**: Add changelog entry under "### **WORK IN PROGRESS**"
2. **Reference issues**: Use "Related to #123" format in PR description (NEVER use auto-closing keywords)
3. **Add 'fixed' label**: If the PR fully addresses an issue, manually add the "fixed" label to the issue
4. **Comment on issues**: Add a comment with PR link and summary
5. **Test thoroughly**: Include testing details in PR description
6. **Manual validation reminder**: Include note that issue requires manual validation before closing