(() => {
    const uploadMode = document.getElementById("uploadMode");
    const randomMode = document.getElementById("randomMode");
    const modeButtons = document.querySelectorAll(".mode-button");

    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");
    const fileSummary = document.getElementById("fileSummary");
    const fileName = document.getElementById("fileName");
    const fileSize = document.getElementById("fileSize");
    const clearFile = document.getElementById("clearFile");
    const predictUploadBtn = document.getElementById("predictUploadBtn");
    const randomPredictBtn = document.getElementById("randomPredictBtn");

    const emptyState = document.getElementById("emptyState");
    const loadingState = document.getElementById("loadingState");
    const resultState = document.getElementById("resultState");
    const errorState = document.getElementById("errorState");

    const loadingPreview = document.getElementById("loadingPreview");
    const progressBar = document.getElementById("progressBar");
    const steps = [...document.querySelectorAll(".process-steps span")];

    const resultImage = document.getElementById("resultImage");
    const predictionText = document.getElementById("predictionText");
    const sourceBadge = document.getElementById("sourceBadge");
    const actualBlock = document.getElementById("actualBlock");
    const actualText = document.getElementById("actualText");
    const correctnessBadge = document.getElementById("correctnessBadge");

    const resetPrediction = document.getElementById("resetPrediction");
    const errorReset = document.getElementById("errorReset");
    const errorText = document.getElementById("errorText");

    let selectedFile = null;

    function switchMode(mode) {
        modeButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.mode === mode));
        uploadMode.classList.toggle("active", mode === "upload");
        randomMode.classList.toggle("active", mode === "random");
        resetStage();
    }

    modeButtons.forEach(btn => btn.addEventListener("click", () => switchMode(btn.dataset.mode)));

    function formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }

    function chooseFile(file) {
        if (!file) return;
        selectedFile = file;
        fileName.textContent = file.name;
        fileSize.textContent = formatSize(file.size);
        fileSummary.classList.remove("hidden");
        predictUploadBtn.disabled = false;

        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = e => {
                loadingPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            loadingPreview.removeAttribute("src");
        }
    }

    fileInput.addEventListener("change", () => chooseFile(fileInput.files[0]));

    ["dragenter", "dragover"].forEach(name => {
        dropZone.addEventListener(name, event => {
            event.preventDefault();
            dropZone.classList.add("dragging");
        });
    });

    ["dragleave", "drop"].forEach(name => {
        dropZone.addEventListener(name, event => {
            event.preventDefault();
            dropZone.classList.remove("dragging");
        });
    });

    dropZone.addEventListener("drop", event => {
        const file = event.dataTransfer.files[0];
        chooseFile(file);
    });

    clearFile.addEventListener("click", () => {
        selectedFile = null;
        fileInput.value = "";
        fileSummary.classList.add("hidden");
        predictUploadBtn.disabled = true;
        loadingPreview.removeAttribute("src");
    });

    function showState(target) {
        [emptyState, loadingState, resultState, errorState].forEach(el => el.classList.add("hidden"));
        target.classList.remove("hidden");
    }

    function resetStage() {
        showState(emptyState);
        progressBar.style.width = "0%";
        steps.forEach(step => step.classList.remove("active", "done"));
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function animateProcessing(preview) {
        if (preview) loadingPreview.src = preview;
        showState(loadingState);

        const milestones = [22, 48, 74, 100];

        for (let i = 0; i < steps.length; i++) {
            if (i > 0) steps[i - 1].classList.remove("active");
            if (i > 0) steps[i - 1].classList.add("done");
            steps[i].classList.add("active");
            progressBar.style.width = `${milestones[i]}%`;
            await wait(360);
        }

        steps[steps.length - 1].classList.remove("active");
        steps[steps.length - 1].classList.add("done");
        await wait(220);
    }

    function displayResult(data) {
        resultImage.src = data.preview;
        predictionText.textContent = data.predicted;
        predictionText.dataset.class = data.predicted.toLowerCase();
        sourceBadge.textContent = data.source;

        if (data.actual) {
            actualBlock.classList.remove("hidden");
            actualText.textContent = data.actual;
            correctnessBadge.textContent = data.correct ? "Correct prediction" : "Incorrect prediction";
            correctnessBadge.classList.toggle("correct", data.correct);
            correctnessBadge.classList.toggle("incorrect", !data.correct);
        } else {
            actualBlock.classList.add("hidden");
        }

        showState(resultState);
    }

    function displayError(message) {
        errorText.textContent = message || "Please try another scan.";
        showState(errorState);
    }

    async function uploadPrediction() {
        if (!selectedFile) return;

        const localPreview = selectedFile.type.startsWith("image/")
            ? URL.createObjectURL(selectedFile)
            : null;

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const requestPromise = fetch("/api/predict-upload", {
                method: "POST",
                body: formData
            }).then(async response => {
                const data = await response.json();
                if (!response.ok || !data.ok) throw new Error(data.error || "Prediction failed.");
                return data;
            });

            await animateProcessing(localPreview);
            const data = await requestPromise;
            displayResult(data);
        } catch (error) {
            displayError(error.message);
        } finally {
            if (localPreview) URL.revokeObjectURL(localPreview);
        }
    }

    async function randomPrediction() {
        try {
            const requestPromise = fetch("/api/predict-random", {
                method: "POST"
            }).then(async response => {
                const data = await response.json();
                if (!response.ok || !data.ok) throw new Error(data.error || "Prediction failed.");
                return data;
            });

            await animateProcessing(null);
            const data = await requestPromise;
            displayResult(data);
        } catch (error) {
            displayError(error.message);
        }
    }

    predictUploadBtn.addEventListener("click", uploadPrediction);
    randomPredictBtn.addEventListener("click", randomPrediction);
    resetPrediction.addEventListener("click", resetStage);
    errorReset.addEventListener("click", resetStage);

    resetStage();
})();