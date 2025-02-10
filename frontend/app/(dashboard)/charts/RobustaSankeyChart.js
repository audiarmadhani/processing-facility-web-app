"use client"; // If using Next.js 13 App Router

import React, { useRef, useEffect } from 'react';
import { Chart } from 'chart.js';
import 'chartjs-chart-sankey';

const RobustaSankeyChart = () => {
    const chartRef = useRef(null);

    useEffect(() => {
        const ctx = chartRef.current.getContext('2d');

        const hardcodedData = [
            { from: 'A', to: 'B', value: 10 },
            { from: 'B', to: 'C', value: 20 },
            { from: 'A', to: 'C', value: 5 },
        ];

        new Chart(ctx, {
            type: 'sankey',
            data: {
                datasets: [{
                    data: hardcodedData,
                    colorFrom: () => '#4c84ff',
                    colorTo: () => '#4c84ff',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { title: { display: true, text: 'Test Sankey' } },
            },
        });
    }, []);

    return <canvas ref={chartRef} />;
};

export default RobustaSankeyChart;