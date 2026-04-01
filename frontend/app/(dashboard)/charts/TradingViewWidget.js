import { useEffect, useRef } from "react";

const TradingViewWidget = ({ symbol }) => {
  const containerRef = useRef();

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    script.innerHTML = JSON.stringify({
        autosize: true,
        symbol,
        interval: "60",
        timezone: "Asia/Jakarta",
        theme: "dark",
        style: "1",
        locale: "en",
        hide_top_toolbar: false,
        hide_legend: false,
        allow_symbol_change: true,
        withdateranges: true,
        details: false,
        hotlist: false,
        calendar: false,
    });

    containerRef.current.appendChild(script);
  }, [symbol]);

  return <div ref={containerRef} style={{ height: "380px", width: "100%" }} />;
};

export default TradingViewWidget;