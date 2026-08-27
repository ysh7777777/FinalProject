document.addEventListener('DOMContentLoaded', async function () {
    const authMenu = document.getElementById('authMenu');

    try {
        // 檢查目前登入狀態
        const res = await fetch('/list-cookies');
        const data = await res.json();

        // 若已登入，切換 UI 呈現
        if (data.success) {
            const roleName = data.role === 'driver' ? '司機' : '乘客';

            authMenu.innerHTML = `
                <span style="color: #fff; margin-right: 10px;">
                    你好，${data.account} (${roleName})
                </span>
                <button id="logoutBtn" class="btn btn-outline-light btn-sm">登出</button>
            `;

            // 綁定登出按鈕事件
            document.getElementById('logoutBtn').addEventListener('click', async () => {
                await fetch('/Logout', { method: 'POST' });
                alert("已成功登出！");
                window.location.reload(); // 重新整理頁面刷新 UI
            });
        }
    } catch (err) {
        console.log("尚未登入");
    }
});