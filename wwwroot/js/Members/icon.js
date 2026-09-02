// DOMContentLoaded 方法先將物件準備
document.addEventListener('DOMContentLoaded', function () {

    // 控制「原密碼」眼睛
    const toggleOldPassword = document.querySelector('#toggleOldPassword');
    if (toggleOldPassword) {
        toggleOldPassword.addEventListener('click', function () {
            const oldPasswordInput = document.querySelector('#oldPassword');  // 舊密碼輸入框
            const img = this.querySelector('img');
            // 防止網頁壞掉的處理
            if (!oldPasswordInput || !img) {
                return;
            }
            // 眼睛 icon 檔案路徑
            const currentSrc = img.getAttribute('src');

            if (oldPasswordInput.type === 'password') {
                oldPasswordInput.type = 'text';  // 顯示密碼
                img.src = currentSrc.replace('eye-fill.svg', 'eye-slash-fill.svg');  // 變閉眼
            } else {
                oldPasswordInput.type = 'password';  // 隱藏密碼
                img.src = currentSrc.replace('eye-slash-fill.svg', 'eye-fill.svg');  // 變張眼
            }
        });
    }

    // 控制「密碼」眼睛
    const togglepassword = document.querySelector('#togglePassword');
    if (togglepassword) {
        togglepassword.addEventListener('click', function () {
            
            const passwordInput = document.querySelector('#passWord');  // 密碼輸入框
            const img = this.querySelector('img');  // 密碼圖示
            // 防止網頁壞掉的處理
            if (!passwordInput || !img) {
                return;
            }
            // 圖片 icon 路徑
            const currentSrc = img.getAttribute('src');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';      // 隱藏密碼
                img.src = currentSrc.replace('eye-fill.svg', 'eye-slash-fill.svg');  // 張眼
            } else {
                passwordInput.type = 'password';  // 顯示密碼
                img.src = currentSrc.replace('eye-slash-fill.svg', 'eye-fill.svg'); // 閉眼
            }
        });
    }

    // 控制「確認密碼」眼睛
    const toggleConfirmpassword = document.querySelector('#toggleConfirmPassword');
    if (toggleConfirmpassword) {
        toggleConfirmpassword.addEventListener('click', function () {
            const confirmpasswordInput = document.querySelector('#confirmPassword');
            const img = this.querySelector('img');

            if (!confirmpasswordInput || !img) {
                return;
            }

            const currentSrc = img.getAttribute('src');

            if (confirmpasswordInput.type === 'password') {
                confirmpasswordInput.type = 'text';
                img.src = currentSrc.replace('eye-fill.svg', 'eye-slash-fill.svg');
            } else {
                confirmpasswordInput.type = 'password';
                img.src = currentSrc.replace('eye-slash-fill.svg', 'eye-fill.svg');
            }
        });
    }

    // 啟用 Bootstrap 表單驗證
    // 搜尋所有加上 .needs-validation 標籤
    const forms = document.querySelectorAll('.needs-validation');
    // 串列
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();  // 限制網頁跳轉
                event.stopPropagation(); // 直到修改正確，才放人
            }
            form.classList.add('was-validated');  // 錯誤: 紅字呈現
        }, false);
    });

});