DROP TABLE IF EXISTS inventory_transactions;
DROP TABLE IF EXISTS raw_materials;
DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products_catalog;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER,
    full_name TEXT NOT NULL,
    login TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(role_id) REFERENCES roles(id)
);

CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_info TEXT,
    assigned_manager_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(assigned_manager_id) REFERENCES users(id)
);

CREATE TABLE products_catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'П/М', 'Рукав', 'Полурукав'
    weight_formula TEXT
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    manager_id INTEGER,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount REAL DEFAULT 0,
    is_fully_paid BOOLEAN DEFAULT 0,
    FOREIGN KEY(client_id) REFERENCES clients(id),
    FOREIGN KEY(manager_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    width REAL,
    length REAL,
    flap REAL,
    thickness REAL,
    quantity INTEGER,
    price_per_unit REAL,
    total_cost REAL,
    total_weight REAL,
    raw_material_id INTEGER,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products_catalog(id)
);

CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    amount REAL,
    payment_type TEXT, -- 'cash', 'cashless'
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(created_by) REFERENCES users(id)
);

CREATE TABLE order_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    status_code TEXT, -- 'RECEIVED', 'CAST', 'READY', 'SHIPPED'
    changed_by INTEGER,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(changed_by) REFERENCES users(id)
);

CREATE TABLE raw_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT, -- 'ПНД', 'ПВД'
    critical_limit REAL
);

CREATE TABLE inventory_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_material_id INTEGER,
    transaction_type TEXT, -- 'INCOME', 'RESERVE', 'ADJUSTMENT'
    weight REAL,
    order_id_ref INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY(raw_material_id) REFERENCES raw_materials(id),
    FOREIGN KEY(order_id_ref) REFERENCES orders(id),
    FOREIGN KEY(created_by) REFERENCES users(id)
);
