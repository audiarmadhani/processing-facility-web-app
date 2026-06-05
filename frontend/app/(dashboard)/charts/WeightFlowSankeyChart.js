"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import * as d3 from 'd3';

const API_BASE = 'https://processing-facility-backend.onrender.com/api';

const NODE_COLORS = {
  pipeline: '#1976d2',
  stored: '#2e7d32',
  loss: '#d32f2f',
};

function getNodeColor(name) {
  if (name.includes('Loss')) return NODE_COLORS.loss;
  if (name.startsWith('Stored:')) return NODE_COLORS.stored;
  return NODE_COLORS.pipeline;
}

const WeightFlowSankeyChart = ({
  timeframe = 'this_month',
  coffeeType = '',
  batchNumber = '',
  height = '550px',
}) => {
  const chartRef = useRef(null);
  const [sankeyData, setSankeyData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ timeframe });
        if (coffeeType) params.set('coffeeType', coffeeType);
        if (batchNumber) params.set('batchNumber', batchNumber);

        const response = await fetch(`${API_BASE}/weight-flow-sankey?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data?.links?.length) {
          setSankeyData([]);
          setMeta(data?.meta || null);
          return;
        }
        setSankeyData(data.links);
        setMeta(data.meta || null);
      } catch (err) {
        console.error('Error fetching weight flow sankey:', err);
        setError(err.message || 'Failed to load weight flow data');
        setSankeyData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe, coffeeType, batchNumber]);

  const drawChart = useCallback((data) => {
    if (!chartRef.current || !data?.length) return;

    d3.select(chartRef.current).selectAll('*').remove();

    const containerWidth = chartRef.current.clientWidth || 800;
    const containerHeight = chartRef.current.clientHeight || 500;
    const margin = { top: 20, right: 200, bottom: 20, left: 130 };
    const width = containerWidth - margin.left - margin.right;
    const chartHeight = containerHeight - margin.top - margin.bottom;

    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const sankeyGenerator = sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .size([width, chartHeight]);

    const nodes = Array.from(new Set([
      ...data.map((d) => d.from_node),
      ...data.map((d) => d.to_node),
    ])).map((name) => ({ name }));

    const links = data.map((d) => ({
      source: nodes.findIndex((n) => n.name === d.from_node),
      target: nodes.findIndex((n) => n.name === d.to_node),
      value: d.value,
      from_node: d.from_node,
      to_node: d.to_node,
    }));

    const { nodes: layoutNodes, links: layoutLinks } = sankeyGenerator({
      nodes: nodes.map((d) => ({ ...d })),
      links: links.map((d) => ({ ...d })),
    });

    const linkStroke = theme.palette.mode === 'dark' ? '#64b5f680' : '#1976d280';
    const textFill = theme.palette.mode === 'dark' ? '#fff' : '#000';
    const totalReceiving = data
      .filter((l) => l.from_node === 'Receiving')
      .reduce((sum, l) => sum + l.value, 0);

    let tooltip = d3.select('body').select('.weight-flow-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body')
        .append('div')
        .attr('class', 'weight-flow-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('text-align', 'center')
        .style('background', 'rgba(0,0,0,0.85)')
        .style('color', '#fff')
        .style('padding', '6px 8px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', 9999);
    }

    svg.append('g')
      .selectAll('path')
      .data(layoutLinks)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke-width', (d) => Math.max(1, d.width || 1))
      .attr('stroke', linkStroke)
      .attr('fill', 'none')
      .attr('opacity', 0.5)
      .on('mouseover', (event, d) => {
        const pct = totalReceiving > 0
          ? ((d.value / totalReceiving) * 100).toFixed(1)
          : '—';
        tooltip.transition().duration(150).style('opacity', 0.95);
        tooltip.html(`
          ${d.from_node || d.source?.name} → ${d.to_node || d.target?.name}<br/>
          Weight: ${d.value.toFixed(2)} kg<br/>
          ${totalReceiving > 0 ? `${pct}% of receiving` : ''}
        `)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        tooltip.transition().duration(300).style('opacity', 0);
      });

    const nodeGroup = svg.append('g')
      .selectAll('g')
      .data(layoutNodes)
      .join('g');

    nodeGroup.append('rect')
      .attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0)
      .attr('fill', (d) => getNodeColor(d.name))
      .attr('opacity', 0.85);

    nodeGroup.append('text')
      .attr('transform', (d) => {
        if (d.x0 < width / 2) {
          return `rotate(-90, ${d.x0 - 6}, ${(d.y0 + d.y1) / 2})`;
        }
        return `rotate(90, ${d.x1 + 6}, ${(d.y0 + d.y1) / 2})`;
      })
      .attr('x', (d) => (d.x0 < width / 2 ? d.x0 - 6 : d.x1 + 6))
      .attr('y', (d) => (d.y0 + d.y1) / 2)
      .attr('text-anchor', 'middle')
      .text((d) => d.name)
      .attr('fill', textFill)
      .attr('font-size', '11px');
  }, [theme]);

  useEffect(() => {
    if (sankeyData?.length) {
      drawChart(sankeyData);
    }
  }, [sankeyData, drawChart]);

  useEffect(() => {
    if (!chartRef.current) return undefined;
    const resizeObserver = new ResizeObserver(() => {
      if (sankeyData?.length) drawChart(sankeyData);
    });
    resizeObserver.observe(chartRef.current);
    return () => resizeObserver.disconnect();
  }, [sankeyData, drawChart]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', p: 2, color: 'error.main' }}>
        <Typography variant="body1">{error}</Typography>
      </Box>
    );
  }

  if (!sankeyData?.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
        <Typography variant="body1" color="text.secondary">
          No weight flow data for the selected filters.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height, width: '100%' }}>
      {meta && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {meta.batchCount} batches · {meta.totalReceivingWeight?.toLocaleString()} kg receiving
          {meta.reorderedBatchCount > 0 ? ` · ${meta.reorderedBatchCount} reordered for monotonic flow` : ''}
        </Typography>
      )}
      <div ref={chartRef} style={{ height: 'calc(100% - 24px)', width: '100%' }} />
    </Box>
  );
};

export default WeightFlowSankeyChart;
