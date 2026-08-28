-- =============================================
-- 請記得分段執行
-- =============================================

-- 建立資料庫
CREATE DATABASE RideHailingDB;
GO

USE RideHailingDB;
GO

-- 1. 會員表 (Member)
CREATE TABLE member (
    account NVARCHAR(50) PRIMARY KEY,    -- 會員帳號 (主鍵)
    password NVARCHAR(255) NOT NULL,     -- 密碼 (加密後字串，必填)
    full_name NVARCHAR(50) NOT NULL,     -- 會員姓名 (必填)
    gender NVARCHAR(10),                 -- 性別
    email NVARCHAR(254) NOT NULL,        -- 電子郵件 (必填)
    phone_number VARCHAR(20) NOT NULL,    -- 聯絡電話 (必填)
    birthday DATE NOT NULL               --生日(必填)
);

-- 2. 會員常用地址表 (MemberSavedAddress)
CREATE TABLE member_saved_address (
    address_id INT IDENTITY(1,1) PRIMARY KEY, -- 地址紀錄編號 (主鍵，自動遞增)
    account NVARCHAR(50) NOT NULL,            -- 所屬會員帳號 (外鍵，必填)
    label NVARCHAR(20) NOT NULL,              -- 地址標籤 (例如：家、公司、醫院，必填)
    address_text NVARCHAR(200) NOT NULL,      -- 詳細地址 (必填)
    latitude DECIMAL(9, 6),                   -- 地址緯度 (Map 常用座標)
    longitude DECIMAL(9, 6),                  -- 地址經度 (Map 常用座標)
    FOREIGN KEY (account) REFERENCES member(account) ON DELETE CASCADE -- 會員刪除時同步刪除相關地址
);

-- 3. 車輛表 (Vehicle)
CREATE TABLE vehicle (
    license_plate VARCHAR(10) PRIMARY KEY, -- 車牌號碼 (主鍵)
    base_location NVARCHAR(50),            -- 常駐據點 / 駐點位置
    vehicle_type NVARCHAR(20),             -- 車輛類型 (如：轎車、休旅車)
    max_passengers TINYINT,                -- 最大載客人數
    max_luggage TINYINT,                   -- 最大行李件數
    child_seats TINYINT DEFAULT 0,         -- 兒童座椅數量 (預設 0)
    base_fare INT,                         -- 起跳基本運費
    vehicle_status NVARCHAR(10)            -- 車輛狀態 (如：可用、維修中)
);

-- 3-1. 車輛表型錄 (VehicleMenu) (08/23 益)
CREATE TABLE vehicle_menu (
    vehicle_id INT IDENTITY(1,1) PRIMARY KEY, -- 車型流水編號 (主鍵)
    vehicle_type NVARCHAR(20),                -- 車輛類型 (如：轎車、休旅車)
    max_passengers TINYINT,                   -- 最大載客人數
    max_luggage TINYINT,                      -- 最大行李件數
    child_seats TINYINT DEFAULT 0,            -- 兒童座椅數量 (預設 0)
    base_fare INT,                            -- 起跳基本運費
    image_title NVARCHAR(100) NOT NULL,       -- 圖片名稱 / 標題 (例如：地圖導航示意圖、架構圖，必填)
    image_url NVARCHAR(500),                  -- 圖片網址 / 檔案路徑
    description NVARCHAR(500)                 -- 圖片說明 / 備註

);

-- 4. 司機表 (Driver)
CREATE TABLE driver (
    driver_id VARCHAR(15) PRIMARY KEY, -- 司機編號 (主鍵)
    driver_name NVARCHAR(50) NOT NULL, -- 司機姓名 (必填)
    base_location NVARCHAR(50),        -- 服務據點 / 駐點位置
    password NVARCHAR(255) NOT NULL    -- 登入密碼 (必填)
);

-- 5. 司機值班表 (DriverShiftSchedule)
CREATE TABLE driver_shift_schedule (
    shift_id VARCHAR(15) PRIMARY KEY,  -- 排班編號 (主鍵)
    driver_id VARCHAR(15) NOT NULL,    -- 司機編號 (外鍵，必填)
    license_plate VARCHAR(10),         -- 該班次駕駛車牌 (外鍵)
    shift_date DATE,                   -- 值班日期
    shift_start TIME,                  -- 上班開始時間
    shift_end TIME,                    -- 下班結束時間
    driver_status NVARCHAR(10),        -- 司機當前狀態 (如：待命、接單中、休息)
    FOREIGN KEY (driver_id) REFERENCES driver(driver_id),        -- 連結至司機表
    FOREIGN KEY (license_plate) REFERENCES vehicle(license_plate) -- 連結至車輛表
);

-- 6. 司機即時 GPS 位置紀錄表 (DriverLocationLog) [新增 - 地圖即時定位用]
CREATE TABLE driver_location_log (
    location_id BIGINT IDENTITY(1,1) PRIMARY KEY, -- 定位紀錄編號 (主鍵，自動遞增)
    driver_id VARCHAR(15) NOT NULL,              -- 司機編號 (外鍵，必填)
    latitude DECIMAL(9, 6) NOT NULL,             -- 當前緯度 (Latitude)
    longitude DECIMAL(9, 6) NOT NULL,            -- 當前經度 (Longitude)
    heading SMALLINT,                            -- 車頭朝向角度 (0-360度，用於地圖車輛圖示旋轉)
    updated_at DATETIME2 DEFAULT GETDATE(),      -- 座標更新時間
    FOREIGN KEY (driver_id) REFERENCES driver(driver_id) ON DELETE CASCADE
);

-- 7. 行程訂單表 (Trip) [新增地圖座標欄位]
CREATE TABLE trip (
    order_no VARCHAR(15) PRIMARY KEY,       -- 訂單編號 (主鍵)
    account NVARCHAR(50) NOT NULL,          -- 叫車會員帳號 (外鍵，必填)
    trip_status NVARCHAR(10),               -- 行程狀態 (如：待派車、行程中、已完成、已取消)
    departure_time SMALLDATETIME,           -- 預計出發時間
    estimated_duration INT,                 -- 預估行程時間 (分鐘)
    pickup_location NVARCHAR(200),          -- 上車地點名稱/地址
    pickup_lat DECIMAL(9, 6),               -- 上車點緯度 (新增：地圖定位與導航)
    pickup_lng DECIMAL(9, 6),               -- 上車點經度 (新增：地圖定位與導航)
    destination NVARCHAR(200),              -- 下車地點名稱/地址
    destination_lat DECIMAL(9, 6),          -- 下車點緯度 (新增：地圖定位與導航)
    destination_lng DECIMAL(9, 6),          -- 下車點經度 (新增：地圖定位與導航)
    license_plate VARCHAR(10),              -- 接單車牌 (外鍵)
    assigned_driver_id VARCHAR(15),         -- 接單司機編號 (外鍵)
    vehicle_type NVARCHAR(20),              -- 乘客指定的偏好車型
    passenger_count TINYINT,                -- 搭乘人數
    luggage_count TINYINT,                  -- 行物/行李件數
    child_seat_count TINYINT NOT NULL
    CONSTRAINT DF_trip_child_seat_count DEFAULT 0, -- 所需嬰兒座椅數量
    completed_at SMALLDATETIME,             -- 訂單結束時間 (用於完成訂單排序)
    canceled_at SMALLDATETIME,              -- 訂單取消時間 (用於取消訂單排序)
    FOREIGN KEY (account) REFERENCES member(account),                 -- 連結至會員表
    FOREIGN KEY (license_plate) REFERENCES vehicle(license_plate),     -- 連結至車輛表
    FOREIGN KEY (assigned_driver_id) REFERENCES driver(driver_id),     -- 連結至司機表
    CONSTRAINT CK_trip_child_seat_count 
    CHECK (child_seat_count BETWEEN 0 AND 3)
);

-- 8. 地圖熱點 / 地標表 (MapLandmark) [新增 - 用於地圖搜尋自動補全或快取]
CREATE TABLE map_landmark (
    landmark_id INT IDENTITY(1,1) PRIMARY KEY, -- 地標編號 (主鍵，自動遞增)
    landmark_name NVARCHAR(100) NOT NULL,      -- 地標名稱 (如：台北車站、高鐵台中站)
    address_text NVARCHAR(200),                -- 詳細地址
    latitude DECIMAL(9, 6) NOT NULL,           -- 地標緯度
    longitude DECIMAL(9, 6) NOT NULL           -- 地標經度
);

-- 9. 專題圖片表 (ProjectImage)
CREATE TABLE project_image (
    image_id INT IDENTITY(1,1) PRIMARY KEY, -- 圖片紀錄編號 (主鍵，自動遞增)
    image_title NVARCHAR(100) NOT NULL,     -- 圖片名稱 / 標題 (例如：地圖導航示意圖、架構圖，必填)
    image_url NVARCHAR(500),                -- 圖片網址 / 檔案路徑
    description NVARCHAR(500)               -- 圖片說明 / 備註
);
