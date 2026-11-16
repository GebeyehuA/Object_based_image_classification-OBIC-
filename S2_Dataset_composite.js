

/*  
DATASET CREATION 

Requirements:

  - roi = region of interest 

  - period_of_interest = Define the period of interest to be used to download and process the bands in order to create the dataset.
                         Insert the   MM-DD-YYYY of the start data and the MM'-DD'-YYYY' of the end data
                         ee.Filter.date('2017-01-01', '2019-12-31');

  - inBands 
    select the input bands based on Sentinel 2 images with different resolutions.
    This are used for the definition of the spectral indices and also for the selection of the subsequent "outBands"
    [B1,B2,B3,B4,B5,B6,B7,B8,B8A,B9,B11,B12,AOT,WVP,SCL,TCI_R,TCI_G,TCI_B,QA10,QA20,QA60,MSK_CLDPRB,MSK_SNWPRB]


  - outBands
    the output bands which include the inBands and the other spectral indices defined by
    predBands = inBands.concat("NDVI","NDVI_STD","NDVI_MAX","BSI","BSI_STD","BSI_MAX")

*/

var period_of_interest = ee.Filter.date('2019-01-01', '2019-05-31');
var inBands = ["B2","B3","B4","B6","B8","B11"];
var outBands = inBands.concat("NDVI","NDVI_STD","BSI");

// 1) Define a region of interest.  **************************************************************************
var roi = Beresa_ws; 
Map.addLayer(roi,{},'Beresa water shade',false);  
Map.centerObject(roi,9);  

//Function to mask the clouds in Sentinel-2
function maskS2clouds(image) {
  var qa = image.select('QA60');

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask).divide(10000);
}

//Build the Sentinel 2 collection, filtered by date, bounds and percentage of cloud cover 
var dataset = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filter(period_of_interest)
                  .filterBounds(roi)
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',10))
                  .map(maskS2clouds);
print("Sentinel 2 Image Collection",dataset);


//Add NDVI and BSI spectral indices
var addNDVI = function(image) {var ndvi = image.normalizedDifference(['B8', 'B4'])
  .rename('NDVI')
  .copyProperties(image,['system:time_start']);
  return image.addBands(ndvi);
};

var addBSI = function(image) {var bsi = image.expression(
  '((RED + SWIR) - (NIR + BLUE)) / ((RED + SWIR) + (NIR + BLUE)) ', 
  {
    'RED': image.select('B4'), 
    'BLUE': image.select('B2'),
    'NIR': image.select('B8'),
    'SWIR': image.select('B11'),

  }
)
  .rename('BSI')
  .copyProperties(image,['system:time_start']);
  return image.addBands(bsi);
};

//Collection with all images also containing the NDVI and BSI indices
var collection = dataset.select(inBands).map(addNDVI).map(addBSI);
print(collection,'Collection with inBands and Statistic indices');

// Define and calculate the median bands and the other index statistics
var band_median = collection.select(inBands).median();
var ndvimax = collection.select('NDVI').reduce(ee.Reducer.max()).rename("NDVI_MAX");
var ndvimean = collection.select('NDVI').reduce(ee.Reducer.mean()).rename("NDVI");
var ndvistd = collection.select('NDVI').reduce(ee.Reducer.stdDev()).float().rename("NDVI_STD");
var bsimax = collection.select('BSI').reduce(ee.Reducer.max()).rename("BSI_MAX");
var bsimean = collection.select('BSI').reduce(ee.Reducer.mean()).rename("BSI");
var bsistd = collection.select('BSI').reduce(ee.Reducer.stdDev()).float().rename("BSI_STD");

//Add the index statistics to the median bands and clip the dataset with the ROI
var compclip = band_median.addBands(ndvimax).addBands(ndvimean).addBands(ndvistd).addBands(bsimax).addBands(bsimean).addBands(bsistd).clip(roi);
print("Composition", compclip);

//Select and extract the images with the desideres bands defined as outBands
var final_bands= compclip.select(outBands);
print("Bands of the final image", final_bands);

//Visualization of the final dataset using RGB and CIR
Map.addLayer(final_bands, {  min: 0.0, max: 0.3, bands: ['B4', 'B3', 'B2'],}, 'RGB');
Map.addLayer(final_bands, {  min: 0.0, max: 0.3, bands: ['B8', 'B4', 'B3'],}, 'CIR');

//Export the image to an Earth Engine asset
Export.image.toAsset({
  image: final_bands,
  region: roi,
  description: 'S2_Dataset_composite',   
  scale: 20, 
  crs: 'EPSG:32637'  
});


