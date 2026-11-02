from pathlib import Path
import base64
import io
import json
import random

import joblib
import numpy as np
from PIL import Image, ImageOps
from flask import Flask, jsonify, render_template, request
from werkzeug.exceptions import RequestEntityTooLarge

try:
    import fitz
except ImportError:
    fitz = None


BASE_DIR = Path(__file__).resolve().parent

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024

MODEL_PATH = BASE_DIR / "models" / "breast_ultrasound_pca_linear_svm.joblib"
DEMO_META_PATH = BASE_DIR / "data" / "demo_metadata.json"
DEMO_DIR = BASE_DIR / "static" / "images" / "demo"

bundle = joblib.load(MODEL_PATH)
scaler = bundle["scaler"]
pca = bundle["pca"]
model = bundle["model"]

with DEMO_META_PATH.open("r", encoding="utf-8") as f:
    demo_metadata = json.load(f)


def image_to_data_uri(image):
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def prepare_image(image):
    image = ImageOps.exif_transpose(image)
    image = image.convert("L")
    image = image.resize((128, 128), Image.Resampling.LANCZOS)
    return image


def image_from_upload(upload):
    raw = upload.read()
    if not raw:
        raise ValueError("The uploaded file is empty.")

    name = (upload.filename or "").lower()
    mimetype = (upload.mimetype or "").lower()

    is_pdf = name.endswith(".pdf") or mimetype == "application/pdf"

    if is_pdf:
        if fitz is None:
            raise ValueError("PDF support is not available on this server.")
        document = fitz.open(stream=raw, filetype="pdf")
        if document.page_count < 1:
            raise ValueError("The PDF does not contain a page.")
        page = document.load_page(0)
        pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        image = Image.open(io.BytesIO(pixmap.tobytes("png")))
        return prepare_image(image)

    try:
        image = Image.open(io.BytesIO(raw))
        if getattr(image, "n_frames", 1) > 1:
            image.seek(0)
        return prepare_image(image)
    except Exception as exc:
        raise ValueError(
            "Unsupported or unreadable file. Use JPG, JPEG, PNG, WEBP, BMP, TIFF, GIF or PDF."
        ) from exc


def predict_pil(image):
    array = np.asarray(image, dtype=np.float32).reshape(1, -1)
    scaled = scaler.transform(array)
    reduced = pca.transform(scaled)
    prediction = int(model.predict(reduced)[0])
    return bundle["class_names"][prediction]


@app.route("/")
def home():
    return render_template("home.html")


@app.route("/analysis")
def learning():
    return render_template("learning.html")


@app.route("/predict")
def predict_page():
    return render_template("predict.html")


@app.post("/api/predict-upload")
def predict_upload():
    if "file" not in request.files:
        return jsonify({"ok": False, "error": "No file was uploaded."}), 400

    upload = request.files["file"]
    if not upload.filename:
        return jsonify({"ok": False, "error": "Please select a file."}), 400

    try:
        image = image_from_upload(upload)
        predicted = predict_pil(image)
        return jsonify({
            "ok": True,
            "source": "Uploaded scan",
            "predicted": predicted,
            "actual": None,
            "correct": None,
            "preview": image_to_data_uri(image)
        })
    except ValueError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400
    except Exception:
        return jsonify({
            "ok": False,
            "error": "The scan could not be processed. Please try another file."
        }), 500


@app.post("/api/predict-random")
def predict_random():
    record = random.choice(demo_metadata)
    image_path = DEMO_DIR / record["file"]

    image = Image.open(image_path).convert("L")
    image = prepare_image(image)

    predicted = predict_pil(image)
    actual = record["actual"]

    return jsonify({
        "ok": True,
        "source": "Untouched dataset",
        "predicted": predicted,
        "actual": actual,
        "correct": predicted == actual,
        "preview": image_to_data_uri(image),
        "sample_id": record["id"]
    })


@app.errorhandler(RequestEntityTooLarge)
def handle_large_file(error):
    return jsonify({
        "ok": False,
        "error": "The file is too large. Please use a file smaller than 20 MB."
    }), 413


if __name__ == "__main__":
    app.run(debug=True)
