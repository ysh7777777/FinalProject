document.addEventListener('DOMContentLoaded', function () {

    const passengerBtn = document.getElementById('passengerTab');
    const driverBtn = document.getElementById('driverTab');
    const loginBtn = document.getElementById('loginBtn');

    // 預設起始狀態為 乘客端
    let currentRole = 'passenger';

    // 處理 Tab 切換
    passengerBtn?.addEventListener('click', () => currentRole = 'passenger');
    driverBtn?.addEventListener('click', () => currentRole = 'driver');

    // 獨立處理登入發送
    loginBtn?.addEventListener('click', async (e) => {
        e.preventDefault();

        const account = document.getElementById('account').value.trim();
        const password = document.getElementById('passWord').value.trim();

        if (!account || !password) {
            alert("請輸入帳號與密碼");
            return;
        }

        loginBtn.disabled = true;

        try {
            const response = await fetch('/Login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Role: currentRole, Account: account, Password: password })
            });

            const resData = await response.json().catch(() => ({}));
            handleLoginResult(resData, currentRole);

        } catch (error) {
            alert("伺服器連線失敗");
        } finally {
            loginBtn.disabled = false;
        }
    });
});

// 處理結果: 成功或失敗
function handleLoginResult(resData, role) {
    if (resData.success) {
        alert(resData.message || "登入成功！");
        window.location.href = '/Home/Index';
        return;
    }

    alert(resData.message || "登入失敗");
    if (role === 'passenger' && resData.needRegister) {
        window.location.href = '/Join';
    }
}