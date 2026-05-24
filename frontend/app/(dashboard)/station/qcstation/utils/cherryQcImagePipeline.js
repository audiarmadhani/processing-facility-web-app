import axios from 'axios';
import { API_BASE_URL } from '../constants';

const ROBOFLOW_URL =
  'https://detect.roboflow.com/coffee-cherry-ripeness/1?api_key=ynuuAcMjAI6jxTNKshV1';

const CANVAS_WIDTH = 3840;
const CANVAS_HEIGHT = 2160;
const SMALL_WIDTH = 640;
const SMALL_HEIGHT = 360;

export async function analyzeWithRoboflow(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(ROBOFLOW_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const data = response.data;
    if (!data?.predictions?.length) {
      console.warn('No predictions found in API response.');
      return { predictions: [], unripe: 0, semi_ripe: 0, ripe: 0, overripe: 0 };
    }

    const ripenessCounts = { unripe: 0, semi_ripe: 0, ripe: 0, overripe: 0 };
    data.predictions.forEach(({ confidence, class: ripenessClass }) => {
      if (confidence >= 0.1) ripenessCounts[ripenessClass]++;
    });

    const total = Object.values(ripenessCounts).reduce((sum, count) => sum + count, 0);
    const percentages = Object.fromEntries(
      Object.entries(ripenessCounts).map(([key, count]) => [
        key,
        total ? ((count / total) * 100).toFixed(2) : 0,
      ])
    );

    return { predictions: data.predictions, ...percentages };
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

export function averageRipenessResults(analysisResults) {
  const averaged = { unripe: 0, semi_ripe: 0, ripe: 0, overripe: 0 };

  analysisResults.forEach((result) => {
    averaged.unripe += parseFloat(result.unripe || 0);
    averaged.semi_ripe += parseFloat(result.semi_ripe || 0);
    averaged.ripe += parseFloat(result.ripe || 0);
    averaged.overripe += parseFloat(result.overripe || 0);
  });

  const count = analysisResults.length || 1;
  averaged.unripe /= count;
  averaged.semi_ripe /= count;
  averaged.ripe /= count;
  averaged.overripe /= count;

  return {
    unripe: averaged.unripe.toFixed(2),
    semi_ripe: averaged.semi_ripe.toFixed(2),
    ripe: averaged.ripe.toFixed(2),
    overripe: averaged.overripe.toFixed(2),
  };
}

function drawOverlayText(ctx, canvas, overlayMeta) {
  const {
    batchNumber,
    farmerName,
    ripeness,
    color,
    foreignMatter,
    overallQuality,
  } = overlayMeta;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(10, canvas.height - 240, 400, 240);
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';

  const ripenessLabel = Array.isArray(ripeness) ? ripeness.join(', ') : ripeness || '';
  const colorLabel = Array.isArray(color) ? color.join(', ') : color || '';

  const labels = [
    `Batch Number: ${batchNumber}`,
    `Farmer Name: ${farmerName}`,
    `Ripeness: ${ripenessLabel}`,
    `Color: ${colorLabel}`,
    `Foreign Matter: ${foreignMatter}`,
    `Overall Quality: ${overallQuality}`,
    `Date: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`,
  ];

  labels.forEach((text, i) => ctx.fillText(text, 20, canvas.height - 210 + i * 30));
}

function drawBoundingBoxes(ctx, canvas, predictions) {
  const colorMap = {
    unripe: '#00FF00',
    semi_ripe: '#FFFF00',
    ripe: '#FF0000',
    overripe: '#8B0000',
  };

  const { width: smallWidth, height: smallHeight } = predictions[0].image || {
    width: SMALL_WIDTH,
    height: SMALL_HEIGHT,
  };
  const scaleX = canvas.width / smallWidth;
  const scaleY = canvas.height / smallHeight;

  predictions
    .filter(({ confidence }) => confidence > 0.1)
    .forEach(({ x, y, width: w, height: h, class: ripenessClass, confidence }) => {
      const boxColor = colorMap[ripenessClass] || '#FFFFFF';
      const xScaled = x * scaleX;
      const yScaled = y * scaleY;
      const widthScaled = w * scaleX;
      const heightScaled = h * scaleY;

      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 8;
      ctx.strokeRect(
        xScaled - widthScaled / 2,
        yScaled - heightScaled / 2,
        widthScaled,
        heightScaled
      );

      ctx.fillStyle = boxColor;
      ctx.font = 'bold 36px Arial';
      ctx.fillText(
        `${ripenessClass} ${(confidence * 100).toFixed(1)}%`,
        xScaled - widthScaled / 2,
        yScaled - heightScaled / 2 - 10
      );
    });
}

function drawRipenessCounts(ctx, canvas, averages) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(canvas.width - 400, canvas.height - 180, 400, 240);
  ctx.fillStyle = '#fff';
  ctx.font = '36px Arial';

  const labels = [
    `Unripe: ${averages.unripe}`,
    `Semi-Ripe: ${averages.semi_ripe}`,
    `Ripe: ${averages.ripe}`,
    `Overripe: ${averages.overripe}`,
  ];
  labels.forEach((text, i) => ctx.fillText(text, canvas.width - 380, canvas.height - 140 + i * 40));
}

export function buildAnnotatedCanvas(plainCanvas, lastAnalysis, averages, overlayMeta) {
  const annotatedCanvas = document.createElement('canvas');
  const annotatedContext = annotatedCanvas.getContext('2d');
  annotatedCanvas.width = CANVAS_WIDTH;
  annotatedCanvas.height = CANVAS_HEIGHT;
  annotatedContext.drawImage(plainCanvas, 0, 0);

  if (lastAnalysis?.predictions?.length > 0) {
    drawBoundingBoxes(annotatedContext, annotatedCanvas, lastAnalysis.predictions);
    drawRipenessCounts(annotatedContext, annotatedCanvas, averages);
  }

  drawOverlayText(annotatedContext, annotatedCanvas, overlayMeta);
  return annotatedCanvas;
}

async function uploadImage(file, batchNum) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('batchNumber', batchNum);
  formData.append('module', 'Cherry-QC');

  await axios.post(`${API_BASE_URL}/api/upload-image`, formData);
}

function canvasToJpegFile(canvas, filename) {
  const imageSrc = canvas.toDataURL('image/jpeg', 1);
  const byteString = atob(imageSrc.split(',')[1]);
  const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  const blob = new Blob([ab], { type: mimeString });
  return new File([blob], filename, { type: 'image/jpeg' });
}

export async function uploadPlainAndAnnotated(plainCanvas, annotatedCanvas, batchNumber) {
  const cleanBatchNumber = batchNumber.trim().replace(/\s+/g, '');
  const plainFile = canvasToJpegFile(plainCanvas, `image_${cleanBatchNumber}_plain.jpeg`);
  const annotatedFile = canvasToJpegFile(
    annotatedCanvas,
    `image_${cleanBatchNumber}_annotated.jpeg`
  );

  await Promise.all([
    uploadImage(plainFile, cleanBatchNumber),
    uploadImage(annotatedFile, cleanBatchNumber),
  ]);
}

export function captureFromWebcam(video) {
  const plainCanvas = document.createElement('canvas');
  const plainContext = plainCanvas.getContext('2d');
  plainCanvas.width = CANVAS_WIDTH;
  plainCanvas.height = CANVAS_HEIGHT;
  plainContext.drawImage(video, 0, 0, plainCanvas.width, plainCanvas.height);
  return plainCanvas;
}

export function captureFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const plainCanvas = document.createElement('canvas');
        const plainContext = plainCanvas.getContext('2d');
        plainCanvas.width = CANVAS_WIDTH;
        plainCanvas.height = CANVAS_HEIGHT;
        const scale = Math.min(
          CANVAS_WIDTH / img.width,
          CANVAS_HEIGHT / img.height
        );
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (CANVAS_WIDTH - w) / 2;
        const y = (CANVAS_HEIGHT - h) / 2;
        plainContext.fillStyle = '#000';
        plainContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        plainContext.drawImage(img, x, y, w, h);
        resolve(plainCanvas);
      };
      img.onerror = () => reject(new Error('Failed to load image file.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

async function runInferencePasses(plainCanvas) {
  const analysisResults = [];

  for (let i = 0; i < 3; i++) {
    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = SMALL_WIDTH;
    smallCanvas.height = SMALL_HEIGHT;
    smallCanvas.getContext('2d').drawImage(plainCanvas, 0, 0, smallCanvas.width, smallCanvas.height);

    const blob = await new Promise((resolve) => {
      smallCanvas.toBlob(resolve, 'image/jpeg', 0.8);
    });

    const analysisResult = await analyzeWithRoboflow(blob);
    analysisResults.push(analysisResult);

    if (i < 2) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return analysisResults;
}

export async function runCherryQcAnalysis(plainCanvas, overlayMeta) {
  const analysisResults = await runInferencePasses(plainCanvas);
  const averages = averageRipenessResults(analysisResults);
  const lastAnalysis = analysisResults[analysisResults.length - 1];
  const annotatedCanvas = buildAnnotatedCanvas(plainCanvas, lastAnalysis, averages, overlayMeta);

  await uploadPlainAndAnnotated(plainCanvas, annotatedCanvas, overlayMeta.batchNumber);

  return averages;
}

export function hasMlResults(row) {
  const fields = [
    row?.unripePercentage,
    row?.semiripePercentage,
    row?.ripePercentage,
    row?.overripePercentage,
  ];
  return fields.some((v) => v != null && parseFloat(v) > 0);
}
