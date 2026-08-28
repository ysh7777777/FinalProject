-- =========================
-- 1. D001 密碼改成 123456
-- =========================
UPDATE driver
SET password = '123456'
WHERE driver_id = 'D001';

-- 2. 網站註冊user21乘客端帳號

-- 3.將範例訂單更改為user21
UPDATE trip
SET account = 'user21'
WHERE order_no IN
(
    'T20260811001'
);

-- 3. 乘客端登入user01，並建立一筆訂單T20260811021，用於測試司機端頁面顯示功能
INSERT INTO trip
(
    order_no,
    account,
    trip_status,
    departure_time,
    estimated_duration,
    pickup_location,
    pickup_lat,
    pickup_lng,
    destination,
    destination_lat,
    destination_lng,
    license_plate,
    assigned_driver_id,
    vehicle_type,
    passenger_count,
    luggage_count,
    completed_at,
    canceled_at
)
VALUES
(
    'T20260811021',
    'user01',
    N'行程中',
    '2026-08-11 16:00:00',
    30,
    N'台北101',
    25.033900,
    121.564500,
    N'松山機場',
    25.063100,
    121.551800,
    'RAB-1234',
    'D001',
    N'轎車',
    2,
    1,
    NULL,
    NULL
);

-- 範例資料重製為待執行
UPDATE trip
SET 
    trip_status = N'待執行',
    completed_at = NULL
WHERE order_no IN (
    'T20260811001',
    'T20260811021'
);

-- 確認是否重置成功
select * from trip




-- 開啟chrome與edge分別登入D001與user21，並確認D001可以接到user21的訂單
-- 開始測試內部功能

-- 乘客端地圖測試url:https://localhost:7083/Passenger/DriverStatus?orderNo=T20260811001

