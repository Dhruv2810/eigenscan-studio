# EigenScan Studio

Final three-page Flask web application for the FOML project:

**Breast Cancer Detection from Ultrasound Images Using Eigen-Scan PCA, LDA and SVM**

## Pages

1. Home
   - Project overview
   - Problem statement
   - Objective
   - Links to the analysis and live predictor

2. Comparative Analysis
   - Notebook 1 workflow, outputs, learning and conclusion
   - Metric formulas
   - Notebook 2 workflow, Eigen-Scans, outputs, learning and conclusion
   - Final model selection with complete justification

3. Live Predictor
   - Upload JPG, JPEG, PNG, WEBP, BMP, TIFF, GIF or PDF
   - Randomly select one of the 39 untouched demo scans
   - Animated preprocessing and prediction flow
   - Uses the saved PCA + Linear SVM model selected in Notebook 2

## Final deployed model

- Input: 128 x 128 grayscale image
- StandardScaler fitted only on Notebook 2 training data
- PCA retaining 90% variance
- 118 PCA components
- Linear SVM
- Model selection priority:
  1. Malignant recall
  2. Accuracy
  3. Malignant F1
  4. Malignant precision
  5. Fewer false negatives

## Local run

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open:

`http://127.0.0.1:5000`

## Render deployment

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
gunicorn app:app
```

A `render.yaml` file is included.

## Note

This is an academic project demonstration and is not intended for clinical diagnosis.

Powered By - Dhruv Parekh
