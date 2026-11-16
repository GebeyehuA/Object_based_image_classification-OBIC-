
# Object-Based Image Classification (OBIC) of the Bersa Watershed using Sentinel-2 Imagery

## Overview
This repository contains the workflow, scripts, and documentation for performing **Object-Based Image Classification (OBIC / OBIA)** over the **Bersa watershed**—a small, topographically diverse watershed located in the **Upper Blue Nile (Abay) Basin, Ethiopia**. 

Unlike traditional pixel-based classification methods that rely solely on spectral information and often produce "salt-and-pepper" noise in heterogeneous agricultural landscapes, this implementation groups adjacent pixels into spectrally and spatially homogeneous image objects (segmentation) before classifying Land Use and Land Cover (LULC).

---

## Study Area: Bersa Watershed
* **Location:** Upper Blue Nile (Abay) Basin, Northwestern Ethiopia
* **Landscape Characteristics:** Characterized by rugged topography, smallholder rain-fed agriculture, scattered Eucalyptus plantations, shrublands, grazing lands, and riparian vegetation.
* **Why OBIC?** Smallholder plot fragmentation and steep elevation gradients in the Abay basin create high spectral variance within single land cover classes. OBIC leverages object geometry, texture, and contextual relationships alongside Sentinel-2 spectral bands to improve classification accuracy.

---

## Data Sources
* **Satellite Imagery:** Copernicus Sentinel-2 MSI (Level-2A Surface Reflectance, 10m and 20m spatial resolution).
  * *Bands utilized:* Blue (B2), Green (B3), Red (B4), Red Edge (B5, B6, B7), NIR (B8), and SWIR (B11, B12).
  * *Acquisition Window:* Dry/post-harvest season imagery (typically November–February) to minimize cloud cover and distinguish cropland from natural vegetation.
* **Ancillary Data:**
  * SRTM / Copernicus 30m Digital Elevation Model (DEM) for topographic normalization, slope, and elevation feature layers.
  * Ground truth / reference samples collected via field surveys and high-resolution Google Earth imagery for training and accuracy assessment.

---

## Methodology & Workflow

### 1. Pre-Processing
* Cloud and cloud-shadow masking using the Sentinel-2 Scene Classification Layer (SCL).
* Resampling of 20m bands (Red Edge & SWIR) to 10m resolution using bilinear interpolation.
* Clipping and mosaicking to the Bersa watershed boundary.
* Calculation of spectral indices to enhance class separability:
  * **NDVI** (Normalized Difference Vegetation Index)
  * **NDWI** (Normalized Difference Water Index)
  * **NDBI** (Normalized Difference Built-up Index)
  * **BSI** (Bare Soil Index)

### 2. Image Segmentation
* **Algorithm:** Multi-Resolution Segmentation (MRS) / Simple Linear Iterative Clustering (SLIC) / Shepherd Segmentation *(customize to match your exact implementation)*.
* **Parameters:** Scale parameter, shape, and compactness tuned iteratively to match the average field size of smallholder farms in the Bersa watershed without over-segmenting forest patches.

### 3. Feature Extraction
For each segmented object, the following zonal statistics are computed:
* **Spectral Features:** Mean and standard deviation of Sentinel-2 bands and spectral indices (NDVI, NDWI, BSI).
* **Textural Features:** Gray-Level Co-occurrence Matrix (GLCM) metrics (contrast, entropy, homogeneity) derived from the NIR/Red bands.
* **Geometric Features:** Area, perimeter, compactness, and shape index.
* **Topographic Features:** Mean elevation and slope derived from the DEM.

### 4. Classification
* **Classifier:** Random Forest (RF) / Support Vector Machine (SVM) *(customize as needed)*.
* **Target LULC Classes:**
  1. Cultivated Land (Cropland)
  2. Forest / Plantation (e.g., *Eucalyptus* woodlots)
  3. Shrubland / Bushland
  4. Grassland / Grazing Land
  5. Built-up / Settlements
  6. Bare Land / Rock Outcrops
  7. Water Bodies

### 5. Accuracy Assessment
* Stratified random sampling split into training (70%) and validation (30%) sets.
* Evaluation via **Confusion Matrix**, **Overall Accuracy (OA)**, **Kappa Coefficient**, **Producer’s Accuracy (PA)**, and **User’s Accuracy (UA)**.

---

## Repository Structure
```text
bersa-watershed-obic/
├── data/
│   ├── raw/                  # Sentinel-2 L2A scenes and DEM
│   ├── boundary/             # Bersa watershed shapefile (.shp / .gpkg)
│   └── samples/              # Training and validation polygons
├── scripts/
│   ├── 01_preprocessing.py   # Band stacking, resampling, spectral indices
│   ├── 02_segmentation.py    # Object segmentation and zonal statistics
│   ├── 03_classification.py  # Model training (RF/SVM) and LULC prediction
│   └── 04_validation.py      # Confusion matrix and accuracy metrics
├── outputs/
│   ├── segmented_objects/    # Vector polygons with extracted features
│   ├── maps/                 # Final classified LULC GeoTIFFs and layouts
│   └── metrics/              # Accuracy assessment CSVs and plots
├── environment.yml           # Conda environment dependencies
└── README.md
