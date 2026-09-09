document.addEventListener("DOMContentLoaded", function () {
    const imageInput =
        document.getElementById("imageInput");
    const previewContainer =
        document.getElementById("previewContainer");
    const uploadArea =
        document.getElementById("uploadArea");
    const description =
        document.getElementById("Description");
    const charCount =
        document.getElementById("charCount");
    // ==========================================
    // 文字數量
    // ==========================================
    if (description) {
        description.addEventListener("input", function () {
            charCount.textContent =
                `${this.value.length} / 1000`;
        });
    }
    // ==========================================
    // 圖片選擇
    // ==========================================
    if (imageInput) {
        imageInput.addEventListener("change", function () {
            handleFiles(this.files);
        });
    }
    // ==========================================
    // 拖曳上傳
    // ==========================================
    if (uploadArea) {
        uploadArea.addEventListener("dragover", function (e) {
            e.preventDefault();
            uploadArea.classList.add("dragover");
        });
        uploadArea.addEventListener("dragleave", function () {
            uploadArea.classList.remove("dragover");
        });
        uploadArea.addEventListener("drop", function (e) {
            e.preventDefault();
            uploadArea.classList.remove("dragover");
            handleFiles(e.dataTransfer.files);
        });
    }

    /* ================= 處理圖片 - 只能放一張(將cshtml中input的multiple拿掉) ================= */
    function handleFiles(files) {
        // 沒有圖片
        if (!files || files.length === 0) { return; }
        // 只取第一張
        const file = files[0];
        // 檔案類型
        if (file.type !== "image/jpeg" && file.type !== "image/png")
        { alert("只允許上傳 JPG、JPEG、PNG 圖片。");
            return; }
        // 5MB
        if (file.size > 5 * 1024 * 1024) {
            alert(`圖片「${file.name}」超過 5MB。`);
            return; }
        // 如果已經有圖片，不允許再加入
        if (previewContainer.querySelector(".preview-item")) {
            alert("只能上傳一張圖片。");
            return; }
        createPreview(file);
    }
    //處理圖片 - 可以放多張(需要再多件一個圖的資料表)
    /* function handleFiles(files) {
        Array.from(files).forEach(function (file) {
            // 檔案類型
            if (
                file.type !== "image/jpeg" &&
                file.type !== "image/png"
            ) {
                alert("只允許上傳 JPG、JPEG、PNG 圖片。");
                return;
            }
            // 5MB
            if (file.size > 5 * 1024 * 1024) {
                alert(
                    `圖片「${file.name}」超過 5MB。`
                );
                return;
            }
            createPreview(file);
        });
    } */

    // ==========================================
    // 建立圖片預覽
    // ==========================================
    function createPreview(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const col =
                document.createElement("div");
            col.className =
                "col-6 col-md-4 col-lg-3 preview-item";
            col.innerHTML = `
                <div class="preview-card">
                    <img src="${e.target.result}"
                         alt="圖片預覽">
                    <button type="button"
                            class="remove-image"
                            title="移除圖片">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            `;
            const removeButton =
                col.querySelector(".remove-image");
            removeButton.addEventListener(
                "click",
                function () {
                    col.remove();
                }
            );
            previewContainer.appendChild(col);
        };
        reader.readAsDataURL(file);
    }
});