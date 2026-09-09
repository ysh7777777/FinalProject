document.getElementById('btnSubmitRating').addEventListener('click', function (event) {
    // 檢查使用者是否有選取星星 (根據您的實作調整 selector)
    const hasRating = document.querySelector('input[name="rating"]:checked');

    if (!hasRating) {
        alert('請先點選星星進行評分喔！');
        return;
    }

    // 成功後跳出提示視窗
    alert('已收到您的回饋，祝您順心');

    // 提示完後跳轉畫面或重新整理
    window.location.href = '/Home/Index';
});