async function handleChangePassword(e) {

    e.preventDefault();

    const oldPassword = document.getElementById('oldPassword')?.value || '';
    const newPassword = document.getElementById('passWord')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';

    if (newPassword !== confirmPassword) {
        alert('「新密碼」與「確認密碼」不一致，請重新確認！');
        return; // 不一致就直接攔截，不送去後端
    }

    const tokenInput = document.querySelector('input[name="__RequestVerificationToken"]');
    const token = tokenInput ? tokenInput.value : '';

    try {
        const response = await fetch('/Change', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': token
            },
            body: JSON.stringify({
                OldPassword: oldPassword,
                NewPassword: newPassword,
                ConfirmPassword: confirmPassword
            })
        });

        // 處理 Auth 驗證失敗
        if (response.status === 401 || response.status === 403) {
            alert('登入已逾期或尚未登入，請先登入會員！');
            location.href = '/Login';
            return;
        }

        const text = await response.text();
        const result = text ? JSON.parse(text) : {};

        if (response.ok && result.success) {
            alert(result.message || '修改成功！');
            location.href = '/Login';
        } else {
            alert(result.message || '修改失敗，請確認原密碼是否正確');
        }
    } catch (error) {
        console.error('發送請求時發生錯誤:', error);
    }
}