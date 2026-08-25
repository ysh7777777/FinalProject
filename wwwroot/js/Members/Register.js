document.addEventListener('DOMContentLoaded', function () {

    // 手機輸入控制（只允許數字）
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
        let isComposing = false;

        phoneInput.addEventListener('keydown', function (e) {
            const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'];
            if (allowedKeys.includes(e.key)) return;

            if (!/^[0-9]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
            }
        });

        phoneInput.addEventListener('compositionstart', () => { isComposing = true; });
        phoneInput.addEventListener('compositionend', function () {
            isComposing = false;
            this.value = this.value.replace(/\D/g, '');
        });

        phoneInput.addEventListener('input', function () {
            if (isComposing) return;
            this.value = this.value.replace(/\D/g, '');
        });

        phoneInput.addEventListener('paste', function (e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            this.value = pastedText.replace(/\D/g, '');
        });
    }


    // 密碼比對與輸入限制 (支援複製貼上)
    const passwordInput = document.getElementById('passWord');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const confirmErrorMsg = document.getElementById('confirmPasswordError');

    function checkPasswordMatch() {
        if (!passwordInput || !confirmPasswordInput) {
            return;
        }

        const pwd = passwordInput.value;
        const confirmPwd = confirmPasswordInput.value;

        if (confirmPwd && pwd !== confirmPwd) {
            confirmPasswordInput.setCustomValidity('兩次輸入的密碼不一致，請重新輸入');
            if (confirmErrorMsg) {
                confirmErrorMsg.textContent = '兩次輸入的密碼不一致，請重新輸入';
            }
        } else {
            confirmPasswordInput.setCustomValidity('');
            if (confirmErrorMsg) {
                confirmErrorMsg.textContent = '請輸入密碼（6~11位英數）';
            }
        }
    }

    if (passwordInput && confirmPasswordInput) {
        [passwordInput, confirmPasswordInput].forEach(input => {
            let isComposing = false;

            input.addEventListener('compositionstart', () => { isComposing = true; });
            input.addEventListener('compositionend', function () {
                isComposing = false;
                this.value = this.value.replace(/[^A-Za-z0-9]/g, '');
                checkPasswordMatch();
            });

            input.addEventListener('input', function () {
                if (isComposing) return;
                this.value = this.value.replace(/[^A-Za-z0-9]/g, '');
                checkPasswordMatch();
            });

            // 貼上事件：允許預設動作並延遲過濾與比對
            input.addEventListener('paste', function () {
                setTimeout(() => {
                    this.value = this.value.replace(/[^A-Za-z0-9]/g, '');
                    checkPasswordMatch();
                }, 0);
            });
        });
    }


 // 監聽表單提交與 API 發送
    const form = document.querySelector('.rg-form');

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault(); // 阻止原生 Form Submit

            checkPasswordMatch();
            form.classList.add('was-validated');

            if (!form.checkValidity()) {
                return;
            }

            // 防止重複按按鈕
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            const payload = {
                account: document.getElementById('account')?.value || '',
                fullname: document.getElementById('fullname')?.value || '',
                gender: document.querySelector('input[name="gender"]:checked')?.value || 'Other',
                birthday: document.getElementById('birthday')?.value || null,
                phoneNumber: (document.getElementById('countryCode')?.value || '') + (document.getElementById('phoneNumber')?.value || ''),
                email: document.getElementById('email')?.value || '',
                password: passwordInput?.value || ''
            };

            // 測試前端是否有資料
            console.log('準備送出的註冊資料：', payload);

            // 推送
            fetch('/Join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(async res => {
                    // 先抓取純文字，避免後端回傳空值或非 JSON 導致 res.json() 報錯
                    const text = await res.text();
                    let data = {};

                    try {
                        data = text ? JSON.parse(text) : {};
                    } catch (err) {
                        console.warn('後端回應非 JSON 格式：', text);
                    }

                    if (!res.ok) {
                        throw new Error(data.message || `註冊失敗 (HTTP ${res.status})`);
                    }
                    return data;
                })
                .then(data => {
                    alert('註冊成功！');
                    window.location.href = '/Login';
                })
                .catch(error => {
                    console.error('註冊失敗：', error);
                    alert(error.message || '註冊失敗，請稍後再試！');
                    if (submitBtn) submitBtn.disabled = false;     // 失敗時解除按鈕禁用
                });
        });
    }
});