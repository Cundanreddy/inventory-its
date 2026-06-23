export const REGIONS = ["Bengaluru", "Pune"];
export const INVENTORY_CATEGORIES = ["3PL AA/CP", "P3 Accessories", "3PL GAS"];
export const STATUS_LIST = ["Available", "Reserved", "Allocated", "Returned", "Lost", "Damaged", "Repair", "Retired"];
export const ENGINEERS = ["Alice Kumar", "Bob Sharma", "Carol Nair", "David Menon", "Eve Singh"];

export const INITIAL_INVENTORY = [
  { id: "AAP-001", name: "Test Bench Alpha", type: "Test Bench", category: "3PL AA/CP", serial: "TB-2024-001", asset: "AST-1001", barcode: "P3-IND-000001", region: "Bengaluru", engineer: "Alice Kumar", receivedDate: "2025-01-10", returnDate: "", status: "Allocated", remarks: "Good condition", quantity: 1, allocationDate: "2025-03-01", expectedReturn: "2025-06-30" },
  { id: "AAP-002", name: "Head Unit Display", type: "Head Unit", category: "3PL AA/CP", serial: "HU-2024-002", asset: "AST-1002", barcode: "P3-IND-000002", region: "Bengaluru", engineer: "", receivedDate: "2025-02-15", returnDate: "", status: "Available", remarks: "", quantity: 1, allocationDate: "", expectedReturn: "" },
  { id: "ACC-001", name: "Laptop Dell XPS", type: "Laptop", category: "P3 Accessories", serial: "LPT-001", asset: "AST-2001", barcode: "P3-IND-000003", region: "Bengaluru", engineer: "Bob Sharma", receivedDate: "2025-01-20", returnDate: "", status: "Allocated", remarks: "", quantity: 1, allocationDate: "2025-02-10", expectedReturn: "2025-07-01" },
  { id: "ACC-002", name: "USB-C Hub", type: "USB Cable", category: "P3 Accessories", serial: "USB-002", asset: "AST-2002", barcode: "P3-IND-000004", region: "Pune", engineer: "", receivedDate: "2025-03-01", returnDate: "", status: "Available", remarks: "", quantity: 5, allocationDate: "", expectedReturn: "" },
  { id: "GAS-001", name: "Audio Box Premium", type: "Audio Box", category: "3PL GAS", serial: "AUD-001", asset: "AST-3001", barcode: "P3-IND-000005", region: "Pune", engineer: "Carol Nair", receivedDate: "2025-01-05", returnDate: "", status: "Allocated", remarks: "", quantity: 1, allocationDate: "2025-01-15", expectedReturn: "2025-06-15" },
  { id: "GAS-002", name: "Microphone Studio", type: "Microphone", category: "3PL GAS", serial: "MIC-002", asset: "AST-3002", barcode: "P3-IND-000006", region: "Bengaluru", engineer: "", receivedDate: "2025-04-01", returnDate: "", status: "Available", remarks: "", quantity: 2, allocationDate: "", expectedReturn: "" },
  { id: "AAP-003", name: "USB Cable Lot", type: "USB", category: "3PL AA/CP", serial: "USB-003", asset: "AST-1003", barcode: "P3-IND-000007", region: "Pune", engineer: "David Menon", receivedDate: "2025-03-10", returnDate: "", status: "Damaged", remarks: "Broken connector", quantity: 3, allocationDate: "2025-03-15", expectedReturn: "2025-05-01" },
  { id: "ACC-003", name: "Wireless Mouse", type: "Mouse", category: "P3 Accessories", serial: "MSE-003", asset: "AST-2003", barcode: "P3-IND-000008", region: "Bengaluru", engineer: "", receivedDate: "2025-02-01", returnDate: "", status: "Reserved", remarks: "", quantity: 1, allocationDate: "", expectedReturn: "" },
];

export const INITIAL_AUDIT = [
  { id: 1, user: "Admin", action: "Inventory Allocated", item: "AAP-001", prev: "Available", next: "Allocated", timestamp: "2025-03-01 09:00" },
  { id: 2, user: "Admin", action: "Inventory Allocated", item: "ACC-001", prev: "Available", next: "Allocated", timestamp: "2025-02-10 10:30" },
  { id: 3, user: "Admin", action: "Status Changed", item: "AAP-003", prev: "Allocated", next: "Damaged", timestamp: "2025-04-20 14:00" },
];
