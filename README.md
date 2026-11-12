# Grand Horrizon – Hotel Reservation & Billing Management System
### Academic DBMS Project using SQLite

---

## 1. Project Overview

**Grand Horrizon** is a local, full-stack Hotel Management & Billing System designed for a comprehensive college Database Management System (DBMS) demonstration. It showcases real relational database design, permanent file-based persistence, SQL queries, multi-user role-based access control, and a responsive dashboard interface.

- **Hotel Name:** Grand Horrizon
- **Hotel Address:** Plot 24, Demo Avenue, White Town, Puducherry – 605001
- **Database Engine:** SQLite (stored permanently at `server/database/hotel.db`)
- **Technology Stack:**
  - **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Recharts
  - **Backend:** Node.js, Express.js, SQLite driver, bcryptjs, CORS
  - **Runner:** npm & concurrently

---

## 2. Default Login Credentials

| Role | Username | Password | Privileges |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Full access: CRUD on all tables, audit history, DB backup, user & room management |
| **Receptionist** | `reception` | `reception123` | Guest check-in/out, bookings, guest directory, room availability toggling |
| **Accountant** | `accounts` | `accounts123` | Tax invoices, discount approvals, multi-mode payment collection |

> Quick login buttons are also provided directly on the Login page for immediate one-click testing.

---

## 3. Database Architecture & Schema (9 Tables)

The permanent SQLite database file is located at:
```
server/database/hotel.db
```

### Relational Tables:

1. **`Users`**: Stores system operators with roles (`admin`, `receptionist`, `accountant`), salted password hashes, and active session tokens.
2. **`Guests`**: Guest profiles, phone contact, email, ID proof type, ID number, and permanent address.
3. **`Room_Types`**: Room categories (Standard, Deluxe, Presidential Suite), base nightly tariffs, and guest capacity.
4. **`Rooms`**: Individual room records, room numbers (unique), foreign key to `Room_Types`, status (`available`, `occupied`, `maintenance`), and floor assignment.
5. **`Reservations`**: Booking master records, foreign key to `Guests`, check-in/out dates, status (`confirmed`, `checked_in`, `checked_out`, `cancelled`), and creator user.
6. **`Reservation_Rooms`**: Junction table supporting multi-room bookings under a single reservation (Many-to-Many).
7. **`Invoices`**: Itemized billing records, room charges, 18% GST tax calculation, discount amounts, total payable, and payment status (`pending`, `partial`, `paid`).
8. **`Payments`**: Payment transaction ledger, foreign key to `Invoices`, payment methods (`cash`, `upi`, `card`, `bank_transfer`), transaction reference/UTR, and cashier user ID.
9. **`Audit_Logs`**: Database alteration history recording operator ID, action type (`CREATE`, `UPDATE`, `DELETE`), target table name, record ID, and JSON snapshots of old and new values.

---

## 4. SQL Operations Implemented

This project directly executes raw SQL queries against the SQLite database:

- **`CREATE TABLE IF NOT EXISTS`**: Automatic relational table creation on server startup with constraints, foreign keys, and indexes.
- **`INSERT INTO`**: Creating guests, reservations, invoices, payments, and audit entries.
- **`SELECT ... WHERE`**: Dynamic filtering of rooms, guests, date intervals, and invoices.
- **`UPDATE ... SET`**: Room status transitions (available ↔ occupied), invoice balance updates, discount applications.
- **`DELETE FROM`**: Safe deletion with foreign key integrity checks.
- **`INNER JOIN` & `LEFT JOIN`**: Multi-table joins connecting reservations to guests, rooms, categories, invoices, and audit users.
- **`GROUP BY` & `ORDER BY`**: Room category distribution, recent activity feeds.
- **`COUNT(*)` & `SUM()`**: Aggregating occupancy rates, total revenue collected, and outstanding balances.

---

## 5. Local Execution Commands

From the root project folder:

### 1. Install all dependencies:
```bash
npm install
```
*(Automatically triggers `npm install` for both `server/` and `client/`)*

### 2. Run the application in development mode:
```bash
npm run dev
```
- Starts the **Express API Backend** at `http://localhost:3000`
- Starts the **Vite React Frontend** at `http://localhost:5173`

### 3. Build for production:
```bash
npm run build
```

---

## 6. Verification of Data Persistence

To test that data is permanently saved in SQLite:
1. Start the application: `npm run dev`
2. Log in as `reception` / `reception123`.
3. Register a new guest and create a booking.
4. Stop the server (`Ctrl + C` in terminal).
5. Start the server again (`npm run dev`).
6. All registered guests, bookings, and invoices will persist exactly as saved in `server/database/hotel.db`.
7. You can also download a direct copy of `hotel.db` anytime via the **Database & Audit** module as Admin.

---

## 7. Running Raw SQL Queries (Web UI & VS Code Terminal)

You have two simple ways to execute raw SQL queries that persist permanently in `hotel.db`:

### Option A: Interactive Web Console (Recommended for Viva)
1. Log in to the web app as `admin` / `admin123`.
2. Go to **Database & Audit** in the sidebar.
3. Click the **"Interactive SQL Query Runner"** tab.
4. Type any SQL query (e.g. `SELECT`, `INSERT`, `UPDATE`, `DELETE`) or click one of the quick templates, then click **"Run SQL"**.
5. The result is auto-committed directly into `hotel.db` and immediately visible on all website pages.

### Option B: VS Code Terminal CLI Tool
Open the terminal in VS Code and run:
```bash
# Run a single SQL statement
node sql.js "SELECT * FROM Guests;"
node sql.js "INSERT INTO Guests (name, phone) VALUES ('Aarav', '9876543210');"

# Or start the interactive SQL prompt
npm run sql
```
*(Note: Popular VS Code extensions like "SQLite Viewer" run queries inside an in-memory browser sandbox and do not save to disk upon closing. Use Option A or Option B for guaranteed disk persistence.)*
