# Traceability Flow

## Global Initialization
- `App.js` serves as the global router. 
- A `<a href="#main-content" className="skip-to-content">` link was added to jump keyboard focus directly to the `Dashboard.js` container, bypassing any extraneous navigation.

## Component Flow: StudentView / IndividualView
1. The user logs in and the app mounts `Dashboard.js`.
2. `Dashboard.js` mounts the global `<MobileMenu />` floating button.
3. `Dashboard.js` checks the `userType` and routes to `StudentView.js` or `IndividualView.js`.
4. The view fires an `onSnapshot` listener to fetch data from Firebase.
5. While `isDataLoaded` is false, the view renders CSS-based skeleton loaders (`.skeleton` in `index.css`).
6. Once Firebase returns data, `isDataLoaded` toggles to true, rendering the actual data grid.
7. If the user clicks `Delete Goal` in `StudentView.js`, instead of blocking the main thread with a native alert, it triggers `ConfirmationModal.js`, trapping focus for accessibility, then performing the Firebase deletion.

## Component Flow: Modal Success
1. User submits a transaction via `AddTransactionModal.js` or `AddAssetModal.js`.
2. Firebase mutation completes.
3. `isSuccess` state flips to true.
4. Component renders a visual "Saved!" screen overlay (full screen blur with checkmark).
5. After 1500ms, a `setTimeout` fires `onClose()` returning the user back to the dashboard.


## Backend Request Pipeline (Security Hardening)
1. Incoming request hits Express.
2. helmet() injects secure HTTP headers (including HSTS).
3. cors() strictly checks if the origin is http://localhost:3000. If not, request is blocked.
4. express.json() reads the payload. If it exceeds 1mb, it throws a 413 Payload Too Large error, protecting memory.
5. If the request hits /api/auth/*, it passes through uditLogger(), writing the IP and timestamp to the server console.
6. Handlers use the xss() library to sanitize freeform text (like ame\) before forwarding data to Firebase.
7. If the request hits /api/analytics/upload, multer evaluates the file's MIME type. If it is not 	ext/csv or pplication/vnd.ms-excel, the upload is instantly rejected. If valid and under 5MB, it is saved and passed to Python.

## Backend Request Pipeline (Security Hardening)
1. Incoming request hits Express.
2. helmet() injects secure HTTP headers (including HSTS).
3. cors() strictly checks if the origin is http://localhost:3000. If not, request is blocked.
4. express.json() reads the payload. If it exceeds 1mb, it throws a 413 Payload Too Large error, protecting memory.
5. If the request hits /api/auth/*, it passes through auditLogger(), writing the IP and timestamp to the server console.
6. Handlers use the xss library to sanitize freeform text (like name) before forwarding data to Firebase.
7. If the request hits /api/analytics/upload, multer evaluates the file's MIME type. If it is not text/csv or application/vnd.ms-excel, the upload is instantly rejected. If valid and under 5MB, it is saved and passed to Python.

## Pipeline Updates (Security Part 2)
- Frontend: firebaseConfig.js now resolves keys dynamically from the .env file during the Webpack build process, hiding them from the source code.
- Auth Pipeline: Before hitting xss(), incoming registration requests are now strictly parsed by the Zod registrationSchema. If validation fails (e.g., malformed email), it immediately throws a 400 Bad Request.
- Upload Pipeline: Before reaching multer, the /api/analytics/upload route now intercepts the request with verifyFirebaseToken(). It decodes the Authorization header using Firebase Admin and instantly rejects requests lacking a valid JWT token.


### UI/UX Audit Refactoring (Frontend)
1. **index.html & index.css:** Added Outfit Google Font import and root CSS variables for missing semantic colors.
2. **CSS Files (All):** Ran Python scripts to globally replace 'Inter' with 'var(--font-primary)' and ad-hoc hex codes with variables.
3. **Dashboard Views:** Locked overflow-x on 'Dashboard2.css' and 'Dashboard3.css' containers to fix mobile spillage.


### IndividualView Redesign Flow Update
1. Dashboard.js -> Renders IndividualView if active.
2. IndividualView.js -> 
    - Fetches ssets and calculates 
etWorth & P&L.
    - Mounts AssetAllocation (passing ssets and 
etWorth).
    - Mounts Command Center with setIsTransactionModalOpen(true) and setIsTaxModalOpen(true).
    - Mounts TransactionHistory in compactMode={true}.
3. AssetAllocation.js (NEW) -> Aggregates asset types and renders a Recharts Donut chart.

### IndividualView Depth Expansion Flow Update
1. IndividualView.js -> Mounts MarketTicker at the very top of the .theme-pro-mono container.
2. IndividualView.js computes 	axLossOpportunities by reducing the ssets array.
3. IndividualView.js mounts .pro-secondary-layout displaying the Tax, Macro, and Yield cards.
4. IndividualView.js -> Mounts FIREChart at the bottom, passing currentWealth and monthlyBurn.
5. MarketTicker.js -> Uses setInterval every 3s to mutate MOCK_TICKERS prices, triggering CSS flash animations.

### Live Market Data Flow Update
1. MarketTicker.js -> Uses useEffect to poll http://localhost:5000/api/market/ticker every 10 seconds.
2. server.js -> Receives GET request on /api/market/ticker.
3. server.js -> Checks if cache is < 10s old. If yes, returns cache.
4. server.js -> If cache miss, uses yahooFinance.quote() to fetch live data for major indices and tickers.
5. server.js -> Maps response to frontend format, updates cache, and returns JSON.
6. MarketTicker.js -> Receives JSON. Compares new prices with prevTickers to calculate _tick direction ('up'/'down') and updates state to trigger CSS animations.

## Business View Flow Updates
- ctiveTab state manages render of POS vs Overview vs Operations.
- pinPrompt state conditionally renders secure PIN modal.
- confirmDelete state catches destruct actions before execution.

## BusinessView.js Max Score Refactor
- Replaced inline color hex codes (#3b82f6, #ef4444, etc.) with proper CSS design tokens (ar(--accent-blue), ar(--status-danger), etc.) to improve implementation integrity.
- Wrapped rendering calculations in useMemo hooks for performance.
- Added ARIA roles and labels to the pos-tabs in BusinessView.js for perfect accessibility scoring.
- Injected media queries in Dashboard2.css to gracefully fold grid structures on mobile.


## 2026-08-17T19:06:10.405Z
- Modified BusinessView.js: Refactored main component render block to include a Global Context Filter (globalBranch state) positioned above the primary tabs. Swapped out old tabs (Overview/POS/Ops) for the new focused architecture (Dashboard/Ops/CRM).
- Modified Dashboard2.css: Applied the new .theme-business-sapphire variables to BusinessView.js to ensure the light SaaS theme takes over.

## 2026-08-18T03:37:43.106Z
- Modified BusinessView.js: Migrated all legacy pos tab components into their appropriate structural homes (dashboard and ops). Added customerLTV useMemo to parse ledger strings (Bill: [Name]) to calculate lifetime value. Rendered the new CRM Leaderboard and Khata summary in the crm tab.
## Business Dashboard Refactor
- Execution flows through BusinessView.js, but now delegates CRM logic to OpsTab.js and CRMTab.js components, ensuring isolated states and leaner render cycles. The Dashboard layout relies on AICashFlowForecastingChart and SimpleBarChart wrapped in a strict CSS grid.

## BusinessView Aesthetics Upgrade
- Applied premium styling logic to BusinessView.js, OpsTab.js, and CRMTab.js. Replaced generic tabs with segmented controls and enhanced Quick Stats with glassmorphic cards.

## Dashboard Tiered Layout Update
- Altered the flex/grid behavior of BusinessView.js -> dashboard tab to flow sequentially in three horizontal rows instead of a squished 2-column layout.

## StudentView Aesthetics Upgrade
- Wrote a python script to overhaul StudentView.css with radial-gradient backgrounds and heavy backdrop-filter blurs. Manually updated inline colors in StudentView.js to align with the new indigo/emerald brand.

## Scroll Context Fix
- Updated GSAP in StudentView.js to listen to \.sv-root\ instead of the window for scroll events, fixing invisible cards.
