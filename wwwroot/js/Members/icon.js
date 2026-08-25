document.addEventListener('DOMContentLoaded', function () {

    // 控制「密碼」眼睛
    const togglepassword = document.querySelector('#togglePassword');
    if (togglepassword) {
        togglepassword.addEventListener('click', function () {
            
            const passwordInput = document.querySelector('#passWord');
            const img = this.querySelector('img');

            if (!passwordInput || !img) {
                return;
            }

            const currentSrc = img.getAttribute('src');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                img.src = currentSrc.replace('eye-fill.svg', 'eye-slash-fill.svg');
            } else {
                passwordInput.type = 'password';
                img.src = currentSrc.replace('eye-slash-fill.svg', 'eye-fill.svg');
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
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });

});