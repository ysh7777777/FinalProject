document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const passengerBtn = document.getElementById('passengerTab');
    const driverBtn = document.getElementById('driverTab');
    const loginBtn = document.getElementById('loginBtn');
    const accountInput = document.getElementById('account');
    const accountValidationMessage = document.getElementById('accountValidationMessage');

    if (!loginForm || !loginBtn || !accountInput) {
        return;
    }

    function updateAccountRules() {
        const isDriver = driverBtn?.checked === true;

        accountInput.maxLength = isDriver ? 15 : 6;
        accountInput.pattern = isDriver
            ? '[A-Za-z0-9]{1,15}'
            : '[A-Za-z0-9]{6}';
        accountInput.placeholder = isDriver
            ? '輸入司機帳號（例如 D001）'
            : '輸入6位英數';

        if (accountValidationMessage) {
            accountValidationMessage.textContent = isDriver
                ? '請輸入司機帳號（1～15 位英數）'
                : '請輸入帳號（6 位英數）';
        }

        accountInput.setCustomValidity('');
        loginForm.classList.remove('was-validated');
    }

    passengerBtn?.addEventListener('change', updateAccountRules);
    driverBtn?.addEventListener('change', updateAccountRules);
    updateAccountRules();

    // 使用表單 submit 事件，讓點擊按鈕及按 Enter 都能登入。
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!loginForm.checkValidity()) {
            loginForm.classList.add('was-validated');
            return;
        }

        const account = document.getElementById('account')?.value.trim() ?? '';
        const password = document.getElementById('passWord')?.value ?? '';
        const currentRole = driverBtn?.checked ? 'driver' : 'passenger';
        const requestVerificationToken = loginForm.querySelector(
            'input[name="__RequestVerificationToken"]'
        )?.value;

        if (!account || !password) {
            alert('請輸入帳號與密碼');
            return;
        }

        loginBtn.disabled = true;

        try {
            const response = await fetch(loginForm.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': requestVerificationToken ?? ''
                },
                body: JSON.stringify({
                    role: currentRole,
                    account,
                    password
                })
            });

            const resData = await response.json().catch(() => ({}));
            handleLoginResult(resData, currentRole);
        } catch (error) {
            alert('伺服器連線失敗');
        } finally {
            loginBtn.disabled = false;
        }
    });
});

function handleLoginResult(resData, role) {
    if (resData.success) {
        alert(resData.message || '登入成功！');
        window.location.assign(
            resData.redirectUrl || (role === 'driver' ? '/Driver/Index' : '/Home/Index')
        );
        return;
    }

    alert(resData.message || '登入失敗');
    if (role === 'passenger' && resData.needRegister) {
        window.location.assign('/Join');
    }
}
