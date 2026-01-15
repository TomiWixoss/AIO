import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INTERNAL_SERVICE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4";

const sqlFilePath = path.join(__dirname, "..", "create_system_tools.sql");

console.log("🔧 Đang fix file SQL...\n");
console.log(`📄 File: ${sqlFilePath}\n`);

// Đọc file SQL
let sqlContent = fs.readFileSync(sqlFilePath, "utf8");

// Đếm số lần thay thế
let localhostCount = 0;
let headerCount = 0;

// 1. Thay localhost thành backend
sqlContent = sqlContent.replace(/http:\/\/localhost:4000/g, () => {
  localhostCount++;
  return "http://backend:4000";
});

// 2. Thêm Authorization header vào tất cả headers_template
sqlContent = sqlContent.replace(/"Content-Type":"application\/json"/g, () => {
  headerCount++;
  return `"Content-Type":"application/json","Authorization":"Bearer ${INTERNAL_SERVICE_TOKEN}"`;
});

// Ghi lại file
fs.writeFileSync(sqlFilePath, sqlContent, "utf8");

console.log("✅ Hoàn thành!\n");
console.log(`📊 Thống kê:`);
console.log(`   - Đã thay ${localhostCount} lần: localhost → backend`);
console.log(`   - Đã thêm ${headerCount} Authorization headers`);
console.log(`\n💾 File đã được cập nhật: ${sqlFilePath}`);
