const WITA_TZ = 'Asia/Makassar';

export function parseMeasurementDate(value) {
  if (value === undefined || value === null || value === '') return null;

  const s = String(value).trim();
  const dateOnly = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, y, mo, d] = dateOnly;
    const parsed = new Date(Number(y), Number(mo) - 1, Number(d), 12, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatMeasurementDateWita(value) {
  const date = parseMeasurementDate(value);
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-CA', { timeZone: WITA_TZ });
}

export function optimalMoistureAtHours(hours) {
  return 50 * Math.exp(-0.00858 * hours);
}

export function buildOptimalCurvePoints(enteredAtIso, maxHours = 168, stepHours = 24) {
  if (!enteredAtIso) return [];

  const start = new Date(enteredAtIso);
  if (Number.isNaN(start.getTime())) return [];

  const points = [];
  for (let hours = 0; hours <= maxHours; hours += stepHours) {
    const x = new Date(start.getTime() + hours * 60 * 60 * 1000);
    points.push({ x, y: optimalMoistureAtHours(hours) });
  }
  return points;
}

export function buildMeasuredPoints(measurements) {
  return (measurements || [])
    .map((m, index) => {
      const x = parseMeasurementDate(m.measurement_date);
      const y = parseFloat(m.moisture);
      if (!x || Number.isNaN(y)) return null;
      return {
        x,
        y,
        id: m.id ?? `measurement-${index}`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.x.getTime() - b.x.getTime());
}

export function hoursSinceEntered(enteredAtIso, measurementDate) {
  const entered = enteredAtIso ? new Date(enteredAtIso) : null;
  const measured = parseMeasurementDate(measurementDate);
  if (!entered || !measured || Number.isNaN(entered.getTime())) return null;
  return (measured.getTime() - entered.getTime()) / (1000 * 60 * 60);
}

export function buildMoistureChartData(batch, measurements, highlightedMeasurementId = null) {
  const measuredPoints = buildMeasuredPoints(measurements);
  const enteredAt = batch?.dryingEnteredAt || null;
  const optimalPoints = buildOptimalCurvePoints(enteredAt);

  const measuredMax = measuredPoints.reduce((max, p) => Math.max(max, p.y), 0);
  const optimalMax = optimalPoints.reduce((max, p) => Math.max(max, p.y), 0);
  const yMax = Math.max(60, Math.ceil(Math.max(measuredMax, optimalMax, 50) + 5));

  const highlightKey = highlightedMeasurementId != null ? String(highlightedMeasurementId) : null;

  const datasets = [];

  if (measuredPoints.length > 0) {
    datasets.push({
      label: 'Measured Moisture',
      data: measuredPoints.map((p) => ({ x: p.x, y: p.y })),
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.85)',
      showLine: true,
      tension: 0.2,
      pointRadius: measuredPoints.map((p) =>
        highlightKey && String(p.id) === highlightKey ? 10 : 6
      ),
      pointHoverRadius: measuredPoints.map((p) =>
        highlightKey && String(p.id) === highlightKey ? 12 : 9
      ),
      pointBackgroundColor: measuredPoints.map((p) =>
        highlightKey && String(p.id) === highlightKey
          ? 'rgba(255, 206, 86, 1)'
          : 'rgba(75, 192, 192, 1)'
      ),
    });
  }

  if (optimalPoints.length > 0) {
    datasets.push({
      label: 'Optimal Natural Sun Drying Curve',
      data: optimalPoints,
      borderColor: 'rgba(255, 99, 132, 1)',
      backgroundColor: 'rgba(255, 99, 132, 0.1)',
      borderDash: [6, 4],
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 0,
    });
  }

  return {
    datasets,
    yMax,
    hasOptimalCurve: optimalPoints.length > 0,
    measuredPoints,
  };
}

export function buildMeasurementTableRows(measurements, batch) {
  const enteredAt = batch?.dryingEnteredAt || null;

  return buildMeasuredPoints(measurements).map((point) => {
    const source = (measurements || []).find(
      (m, index) => (m.id ?? `measurement-${index}`) === point.id
    );
    const hours = enteredAt ? hoursSinceEntered(enteredAt, source?.measurement_date) : null;
    const optimal =
      hours != null && hours >= 0 ? optimalMoistureAtHours(hours) : null;
    const delta = optimal != null ? point.y - optimal : null;

    return {
      id: point.id,
      measurement_date: source?.measurement_date,
      dateDisplay: formatMeasurementDateWita(source?.measurement_date),
      moisture: point.y,
      vsOptimal:
        delta != null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%` : '—',
    };
  });
}
