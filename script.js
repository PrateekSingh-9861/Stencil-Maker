const imageInput = document.getElementById("imageInput");
const processButton = document.getElementById("processButton");
const originalCanvas = document.getElementById("originalCanvas");
const stencilCanvas = document.getElementById("stencilCanvas");
const ctxOriginal = originalCanvas.getContext("2d");
const ctxStencil = stencilCanvas.getContext("2d");
const progressBar = document.getElementById("progress");
const progressBarFill = document.getElementById("progress-bar");
let image = new Image();

// Handle image upload and display
imageInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            image.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Draw the image centered and scaled on the canvas
image.onload = () => {
    // Clear the canvas
    ctxOriginal.clearRect(0, 0, originalCanvas.width, originalCanvas.height);

    // Calculate scaling to fit the image within the canvas
    const canvasWidth = originalCanvas.width;
    const canvasHeight = originalCanvas.height;
    const aspectRatio = image.width / image.height;

    let drawWidth, drawHeight;
    if (image.width > image.height) {
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / aspectRatio;
    } else {
        drawHeight = canvasHeight;
        drawWidth = canvasHeight * aspectRatio;
    }

    // Center the image on the canvas
    const offsetX = (canvasWidth - drawWidth) / 2;
    const offsetY = (canvasHeight - drawHeight) / 2;

    // Draw the image
    ctxOriginal.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
};

// Process the image to generate the stencil
processButton.addEventListener("click", async () => {
    if (!image.src) {
        alert("Please upload an image first!");
        return;
    }

    // Show progress bar
    progressBar.style.display = "block";
    progressBarFill.style.width = "0%";

    // Step 1: Load image to OpenCV and convert to grayscale
    progressBarFill.style.width = "30%";
    const src = cv.imread(originalCanvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

    // Step 2: Apply Gaussian Blur with a smaller kernel size for finer smoothing
    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0); // Smaller kernel size (3x3) for finer details

    // Step 3: Apply adaptive thresholding with reduced block size for thinner lines
    const threshold = new cv.Mat();
    const blockSize = 7; // Smaller block size for finer thresholds
    const constant = 5; // Lower constant to reduce line boldness
    cv.adaptiveThreshold(blurred, threshold, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY, blockSize, constant);

    // Step 4: Display processed stencil on stencil canvas
    progressBarFill.style.width = "70%";
    ctxStencil.clearRect(0, 0, stencilCanvas.width, stencilCanvas.height);
    cv.imshow(stencilCanvas, threshold);

    // Clean up OpenCV matrices
    src.delete();
    gray.delete();
    blurred.delete();
    threshold.delete();

    // Hide progress bar
    progressBarFill.style.width = "100%";
    setTimeout(() => {
        progressBar.style.display = "none";
    }, 500);
});
