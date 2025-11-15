create database linegirl;
use linegirl;






CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);




-- ตัวอย่างที่ 1: เพิ่มผู้ใช้ที่เป็น Customer
INSERT INTO users (username, email, phone, password, role, created_at) 
VALUES 
(
  'test_customer_1', 
  'customer1@example.com', 
  '0810001111', 
  'password123', 
  'customer', 
  NOW()
);

-- ตัวอย่างที่ 2: เพิ่มผู้ใช้ที่เป็น Shop (ร้านค้า)
INSERT INTO users (username, email, phone, password, role, created_at) 
VALUES 
(
  'test_shop_1', 
  'shop1@example.com', 
  '0820002222', 
  'password123', 
  'shop', 
  NOW()
);

-- ตัวอย่างที่ 3: เพิ่มผู้ใช้ที่เป็น Shop (ร้านค้า)
INSERT INTO users (username, email, phone, password, role, created_at) 
VALUES 
(
  'test_shop_2', 
  'shop2@example.com', 
  '0820003333', 
  'password123', 
  'shop', 
  NOW()
);


-- ตัวอย่างที่ 4: เพิ่มผู้ใช้ที่เป็น Admin (แอดมิน)
INSERT INTO users (username, email, phone, password, role, created_at) 
VALUES 
(
  'test_admin_1', 
  'admin1@example.com', 
  '0820004444', 
  'password123', 
  'admin', 
  NOW()
);







CREATE TABLE Restaurant (
    -- Primary Key
    Restaurant_Id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, 
    
    -- ข้อมูลร้านค้า
    name VARCHAR(255) NOT NULL,              -- ชื่อร้าน (บังคับกรอก)
    description TEXT NULL,                    -- คำอธิบายร้าน (อาจจะไม่มีก็ได้)
    opening_hours VARCHAR(100) NULL,          -- เวลาเปิด-ปิด (เก็บเป็นข้อความ เช่น "10:00 - 22:00")
    phone VARCHAR(20) NOT NULL,               -- เบอร์โทรศัพท์ (บังคับกรอก)
    address TEXT NOT NULL,                    -- ที่อยู่ (บังคับกรอก)
    latitude DECIMAL(10, 8) NULL,             -- ละติจูด (สำหรับแผนที่)
    longitude DECIMAL(11, 8) NULL,            -- ลองจิจูด (สำหรับแผนที่)
    image_url VARCHAR(500) NULL,              -- URL หรือ Path ของรูปภาพร้านค้า
    is_open BOOLEAN DEFAULT TRUE,             -- สถานะเปิด/ปิดร้าน (ค่าเริ่มต้นคือ เปิด)
    branch VARCHAR(100),
	slug VARCHAR(255),
    type VARCHAR(100),
    rating DECIMAL(3, 2) DEFAULT 0.00,  -- 
    reviewCount INT DEFAULT 0,
    
    

    -- Foreign Key ไปยังตาราง User
    -- *** สำคัญ: ตรวจสอบให้แน่ใจว่าชนิดข้อมูล (INT UNSIGNED) ตรงกับ User_Id ในตาราง User ***
    owner_user_id INT  NOT NULL,      -- ID ของเจ้าของร้าน (จากตาราง User)

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- วันเวลาที่สร้างข้อมูล

   
    FOREIGN KEY (owner_user_id) REFERENCES users(id)
        ON DELETE CASCADE -- ถ้า User ถูกลบ ร้านค้าของ User นั้นก็จะถูกลบไปด้วย (หรืออาจจะเปลี่ยนเป็น SET NULL ถ้าต้องการเก็บข้อมูลร้านไว้)
        ON UPDATE CASCADE -- ถ้า User_Id เปลี่ยน ข้อมูลในนี้ก็จะเปลี่ยนตาม
);

-- คำสั่ง INSERT ที่อ้างอิงตาม Schema 


INSERT INTO Restaurant 
(
  -- ข้อมูลร้านค้า (ตาม Schema)
  name, 
  description, 
  opening_hours, 
  phone, 
  address, 
  latitude, 
  longitude, 
  image_url, 
  is_open, 
  branch,
  slug, 
  type, 
  
  -- Foreign Key (ตัวเชื่อม)
  owner_user_id --
  
  -- (Restaurant_Id และ created_at จะถูกสร้างอัตโนมัติ)
) 
VALUES 
(
  -- ข้อมูลร้านค้า
  'MK Restaurant (SQL)', 
  'ร้านสุกี้ MK (ข้อมูลจาก SQL)', 
  '10:00 - 22:00', 
  '1642', 
  '99/19 หมู่ 2 ต.บางเตย อ.สามพราน จ.นครปฐม 73210 (Central Salaya)', 
  '13.8050', 
  '100.3015',
  '/uploads/restaurants/restaurant-1761983425209-192095472.jpg', 
  true, 
  'Central Salaya', 
  'mk-restaurant-salaya', 
  'Thai Food', 
  
  -- Foreign Key (ตัวเชื่อม)
  2  -- 
);






INSERT INTO Restaurant 
(
  -- ข้อมูลร้านค้า (ตาม Schema)
  name, 
  description, 
  opening_hours, 
  phone, 
  address, 
  latitude, 
  longitude, 
  image_url, 
  branch,
  slug, 
  type, 
  
  -- Foreign Key (ตัวเชื่อม)
  owner_user_id
) 
VALUES 
(
  -- ข้อมูลร้านค้า
  'Secret Recipe (SQL)', 
  'ร้านเค้กและอาหารจานเดียว (ข้อมูลจาก SQL)', 
  '10:00 - 20:00', 
  '029998888', 
  'ชั้น 1, Central Westgate', 
  '13.8812',          -- (ละติจูด สมมติ)
  '100.4116',         -- (ลองจิจูด สมมติ)
  '/uploads/restaurants/restaurant-1762421093326-654172667.png', --
  'Central Westgate', 
  'secret-recipe-westgate', 
  'Dessert', 
  
  -- Foreign Key (ตัวเชื่อม)
  3 -- 
);






CREATE TABLE Menu (
    -- Primary Key
    Menu_Id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Foreign Key ไปยังตาราง Restaurant
    -- *** สำคัญ: ตรวจสอบให้แน่ใจว่าชนิดข้อมูล (INT UNSIGNED) ตรงกับ Restaurant_Id ในตาราง Restaurant ***
    Restaurant_Id INT UNSIGNED NOT NULL,

    -- ข้อมูลเมนู
    name VARCHAR(255) NOT NULL,              -- ชื่อเมนู (บังคับกรอก)
    description TEXT NULL,                    -- คำอธิบายเมนู (อาจจะไม่มีก็ได้)
    price DECIMAL(10, 2) NOT NULL,            -- ราคา (บังคับกรอก, เก็บเป็นทศนิยม 2 ตำแหน่ง)
    image_url VARCHAR(500) NULL,              -- URL หรือ Path ของรูปภาพเมนู
    is_available BOOLEAN DEFAULT TRUE,        -- สถานะพร้อมขาย (ค่าเริ่มต้นคือ พร้อมขาย)
    category VARCHAR(100) NOT NULL,           -- หมวดหมู่ (เช่น อาหารจานหลัก, เครื่องดื่ม) (บังคับกรอก)

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- วันเวลาที่สร้างข้อมูล
    -- updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- (Optional) ถ้าต้องการเก็บเวลาแก้ไขล่าสุด

    -- กำหนด Foreign Key Constraint
    FOREIGN KEY (Restaurant_Id) REFERENCES Restaurant(Restaurant_Id)
        ON DELETE CASCADE -- ถ้า Restaurant ถูกลบ เมนูของร้านนั้นก็จะถูกลบไปด้วย
        ON UPDATE CASCADE, -- ถ้า Restaurant_Id เปลี่ยน ข้อมูลในนี้ก็จะเปลี่ยนตาม

    -- (Optional) เพิ่ม Index เพื่อเพิ่มประสิทธิภาพ
    INDEX idx_restaurant_id (Restaurant_Id),
    INDEX idx_category (category),
    INDEX idx_name (name)
);



INSERT INTO Menu (Restaurant_Id, name, description, price, image_url, is_available, category, created_at) 
VALUES 
(
  1,  -- 
  'สุกี้ชุดสุดคุ้ม (SQL)', 
  'ชุดผักสด หมู และอาหารทะเล สำหรับ 2 ท่าน', 
  499.00, 
  '/uploads/menus/menu-1761984055869-178807044.jpg', --
  true, 
  'Main Course', 
  NOW()
);


INSERT INTO Menu (Restaurant_Id, name, description, price, image_url, is_available, category, created_at) 
VALUES 
(
  2,  -- 
  'เค้กช็อกโกแลต (SQL)', 
  'เค้กช็อกโกแลตเข้มข้น', 
  120.00, 
  '/uploads/menus/menu-1762421389505-368900497.png', --
  true, 
  'Dessert', 
  NOW()
);



-- 1. ตาราง OrderCart (ตะกร้าหลัก/ใบสั่งซื้อ)
CREATE TABLE OrderCart (
    OrderCart_Id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Foreign Keys
    User_Id INT  NOT NULL,       -- ID ของลูกค้าที่สั่ง
    Restaurant_Id INT UNSIGNED NOT NULL, -- ID ของร้านค้าที่ถูกสั่ง
    
    -- Order Details
    total_amount DECIMAL(10, 2) NOT NULL, -- ราคารวมของออเดอร์นี้
    
    -- 🎯 ERD ของคุณระบุว่าเป็น ENUM 
    -- (คุณสามารถเปลี่ยนค่าใน ENUM ได้ตามต้องการ)
    status ENUM('Pending', 'Cooking', 'Ready', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    payment_status ENUM('Unpaid', 'Paid', 'Refunded') NOT NULL DEFAULT 'Unpaid',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (User_Id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Restaurant_Id) REFERENCES Restaurant(Restaurant_Id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_user_id (User_Id),
    INDEX idx_restaurant_id (Restaurant_Id)
);

-- 2. ตาราง OrderItem (รายการสินค้าในตะกร้า)
CREATE TABLE OrderItem (
    OrderItem_Id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Foreign Keys
    OrderCart_Id INT UNSIGNED NOT NULL, -- ID ของใบสั่งซื้อ (จาก OrderCart)
    Menu_Id INT UNSIGNED NOT NULL,       -- ID ของเมนูที่สั่ง (จาก Menu)
    
    -- Item Details
    quantity INT UNSIGNED NOT NULL DEFAULT 1, -- จำนวนชิ้น
    price DECIMAL(10, 2) NOT NULL,            -- ราคาต่อชิ้น (ณ เวลาที่สั่งซื้อ)
    special_instructions TEXT NULL,           -- คำขอพิเศษ (เช่น "ไม่เผ็ด")
    
    FOREIGN KEY (OrderCart_Id) REFERENCES OrderCart(OrderCart_Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Menu_Id) REFERENCES Menu(Menu_Id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_ordercart_id (OrderCart_Id)
);

-- 3. ตาราง Payment (ข้อมูลการชำระเงิน)
CREATE TABLE Payment (
    Payment_Id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Foreign Key
    OrderCart_Id INT UNSIGNED NOT NULL, -- ID ของใบสั่งซื้อ (จาก OrderCart)
    
    -- Payment Details
    -- 🎯 ERD ของคุณระบุว่าเป็น ENUM
    payment_method ENUM('Cash', 'PromptPay') NOT NULL DEFAULT 'Cash',
    amount DECIMAL(10, 2) NOT NULL,     -- จำนวนเงินที่จ่าย
    
    -- 🎯 ERD ของคุณระบุว่าเป็น ENUM
    status ENUM('Pending', 'Completed', 'Failed') NOT NULL DEFAULT 'Pending',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (OrderCart_Id) REFERENCES OrderCart(OrderCart_Id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_ordercart_id (OrderCart_Id)
);





CREATE TABLE Review (
    Review_Id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Foreign Keys
    User_Id INT  NOT NULL,
    Restaurant_Id INT UNSIGNED NOT NULL,
    Menu_Id INT UNSIGNED NOT NULL, 
    
    -- Review Details
    rating INT NOT NULL, -- คะแนน (เช่น 1-5)
    comment TEXT NULL,   -- คอมเมนต์
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (User_Id) REFERENCES users(id) ON DELETE cascade ON UPDATE CASCADE, -- ถ้า User หาย ให้เก็บ Review ไว้
    FOREIGN KEY (Restaurant_Id) REFERENCES Restaurant(Restaurant_Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Menu_Id) REFERENCES Menu(Menu_Id) ON DELETE CASCADE ON UPDATE CASCADE,
    
  
    -- UNIQUE KEY uk_user_menu (User_Id, Menu_Id),
    
    INDEX idx_restaurant_id (Restaurant_Id),
    INDEX idx_menu_id (Menu_Id)
);



CREATE TABLE hero_banners (
    banner_id INT AUTO_INCREMENT PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- (SQL นี้สำหรับ hero_banners)
INSERT INTO hero_banners (image_url, is_active, sort_order, created_at) 
VALUES 
(
  '/uploads/banners/banner-1762095538222-858731244.jpg', --
  true, 
  1, 
  NOW()
);

INSERT INTO hero_banners (image_url, is_active, sort_order, created_at) 
VALUES 
(
  '/uploads/banners/banner-1762095316362-682343411.jpg', --
  true, 
  2, 
  NOW()
);