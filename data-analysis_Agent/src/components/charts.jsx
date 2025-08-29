import React, { useState, useMemo, useCallback, memo } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ChevronDown, BarChart3, PieChart as PieIcon, TrendingUp, Zap, Activity } from 'lucide-react';

// Memoized dropdown component to prevent unnecessary re-renders
const Dropdown = memo(({ isOpen, setIsOpen, value, options, onChange, placeholder }) => (
  <div className="relative">
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-4 py-2.5 text-left flex items-center justify-between min-w-[200px]"
    >
      <span className={value ? "text-white" : "text-gray-400"}>
        {value || placeholder}
      </span>
      <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && (
      <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => {
              onChange(option);
              setIsOpen(false);
            }}
            className="block w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors"
          >
            {option}
          </button>
        ))}
      </div>
    )}
  </div>
));

// Memoized custom tooltip to prevent re-renders
const CustomTooltip = memo(({ active, payload, label, xAxis }) => {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
      <p className="text-cyan-400 font-semibold">{`${xAxis}: ${label}`}</p>
      {payload.map((entry, index) => (
        <p key={index} style={{ color: entry.color }} className="font-medium">
          {`${entry.dataKey}: ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}`}
        </p>
      ))}
    </div>
  );
});

// Pre-define colors and chart types to avoid recreation
const COLORS = [
  '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#6366F1', '#84CC16', '#F97316', '#14B8A6'
];

const CHART_TYPES = [
  { id: 'bar', name: 'Bar Chart', icon: BarChart3 },
  { id: 'line', name: 'Line Chart', icon: TrendingUp },
  { id: 'area', name: 'Area Chart', icon: Activity },
  { id: 'pie', name: 'Pie Chart', icon: PieIcon },
  { id: 'scatter', name: 'Scatter Plot', icon: Zap }
];

// Memoized chart renderer to prevent unnecessary re-renders
const ChartRenderer = memo(({ chartType, data, xAxis, yAxis, colors }) => {
  const chartProps = useMemo(() => ({
    width: '100%',
    height: 400,
    data,
    margin: { top: 20, right: 30, left: 20, bottom: 60 }
  }), [data]);

  const customTooltip = useCallback((props) => 
    <CustomTooltip {...props} xAxis={xAxis} />, [xAxis]);

  if (!data.length) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No data to display</p>
          <p className="text-sm mt-2">Please select valid X and Y axes</p>
        </div>
      </div>
    );
  }

  switch (chartType) {
    case 'line':
      return (
        <ResponsiveContainer {...chartProps}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey={xAxis} 
              stroke="#9CA3AF" 
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip content={customTooltip} />
            <Line 
              type="monotone" 
              dataKey={yAxis} 
              stroke={colors[0]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );

    case 'area':
      return (
        <ResponsiveContainer {...chartProps}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey={xAxis} 
              stroke="#9CA3AF"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip content={customTooltip} />
            <Area 
              type="monotone" 
              dataKey={yAxis} 
              stroke={colors[1]}
              fill={`${colors[1]}40`}
              strokeWidth={1}
            />
          </AreaChart>
        </ResponsiveContainer>
      );

    case 'pie':
      return (
        <ResponsiveContainer {...chartProps}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={customTooltip} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'scatter':
      return (
        <ResponsiveContainer {...chartProps}>
          <ScatterChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey={xAxis} 
              stroke="#9CA3AF"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis dataKey={yAxis} stroke="#9CA3AF" />
            <Tooltip content={customTooltip} />
            <Scatter 
              dataKey={yAxis} 
              fill={colors[2]}
            />
          </ScatterChart>
        </ResponsiveContainer>
      );

    default: // bar
      return (
        <ResponsiveContainer {...chartProps}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey={xAxis} 
              stroke="#9CA3AF"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip content={customTooltip} />
            <Bar 
              dataKey={yAxis} 
              fill={colors[3]}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );
  }
});

const Charts = ({ csvdata }) => {
  const [selectedChart, setSelectedChart] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [isXDropdownOpen, setIsXDropdownOpen] = useState(false);
  const [isYDropdownOpen, setIsYDropdownOpen] = useState(false);
  const [isChartDropdownOpen, setIsChartDropdownOpen] = useState(false);

  // Optimize column analysis with aggressive memoization
  const columnAnalysis = useMemo(() => {
    if (!csvdata || csvdata.length === 0) return { numerical: [], categorical: [], all: [] };

    const columns = Object.keys(csvdata[0]);
    const numerical = [];
    const categorical = [];

    // Sample only first 20 rows for performance, cache results
    const sampleSize = Math.min(20, csvdata.length);
    const sample = csvdata.slice(0, sampleSize);

    columns.forEach(col => {
      const values = sample.map(row => row[col]).filter(val => val != null);
      const numericCount = values.filter(val => {
        const num = Number(val);
        return !isNaN(num) && isFinite(num);
      }).length;
      
      if (numericCount > values.length * 0.6) {
        numerical.push(col);
      } else {
        categorical.push(col);
      }
    });

    return { numerical, categorical, all: columns };
  }, [csvdata]);

  // Memoized callbacks for dropdown handlers
  const handleXAxisChange = useCallback((value) => setXAxis(value), []);
  const handleYAxisChange = useCallback((value) => setYAxis(value), []);
  const handleChartChange = useCallback((value) => setSelectedChart(value), []);

  // Set default axes when data loads (optimized)
  React.useEffect(() => {
    if (columnAnalysis.all.length > 0) {
      if (!xAxis) {
        setXAxis(columnAnalysis.categorical[0] || columnAnalysis.all[0]);
      }
      if (!yAxis && columnAnalysis.numerical.length > 0) {
        setYAxis(columnAnalysis.numerical[0]);
      }
    }
  }, [columnAnalysis.all.length, columnAnalysis.categorical, columnAnalysis.numerical, xAxis, yAxis]);

  // Highly optimized chart data preparation
  const chartData = useMemo(() => {
    if (!csvdata || !xAxis || !yAxis || csvdata.length === 0) return [];

    // Limit data points for performance
    const maxPoints = selectedChart === 'pie' ? 10 : 1000;
    const workingData = csvdata.slice(0, maxPoints);

    if (selectedChart === 'pie') {
      // Optimized pie chart grouping
      const grouped = {};
      workingData.forEach(item => {
        const key = String(item[xAxis] || 'Unknown');
        const value = Number(item[yAxis]) || 0;
        grouped[key] = (grouped[key] || 0) + value;
      });

      return Object.entries(grouped)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
    }

    // Optimized data transformation for other charts
    const result = [];
    workingData.forEach(item => {
      const xVal = item[xAxis];
      const yVal = Number(item[yAxis]);
      
      if (xVal != null && !isNaN(yVal) && isFinite(yVal)) {
        result.push({
          [xAxis]: xVal,
          [yAxis]: yVal
        });
      }
    });

    return result;
  }, [csvdata, xAxis, yAxis, selectedChart]);

  // Early return for no data
  if (!csvdata || csvdata.length === 0) {
    return (
      <div className="mt-8 border border-gray-700 rounded-lg p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Data Available</h3>
          <p className="text-gray-500">Upload a CSV file to start creating visualizations</p>
        </div>
      </div>
    );
  }

  const currentChartType = CHART_TYPES.find(t => t.id === selectedChart);

  return (
    <div className="mt-8 border border-gray-700 rounded-lg p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          Data Visualization
        </h2>
        
        <div className="flex flex-wrap gap-3 items-center">
          {/* Optimized Chart Type Selector */}
          <div className="relative">
            <button
              onClick={() => setIsChartDropdownOpen(!isChartDropdownOpen)}
              className="text-black bg-blue-200 hover:bg-black focus:ring-4 focus:outline-none focus:ring-blue-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-200 dark:hover:bg-black dark:focus:ring-blue-800 hover:text-blue-400 hover:border-blue-400 border border-transparent text-black text-sm rounded-lg px-4 py-2.5 flex items-center gap-2 font-medium transition-colors"
            >
              {React.createElement(currentChartType?.icon || BarChart3, { className: "w-4 h-4" })}
              {currentChartType?.name}
              <ChevronDown className={`w-4 h-4 transition-transform ${isChartDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isChartDropdownOpen && (
              <div className="absolute z-50 mt-1 right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-lg min-w-[180px]">
                {CHART_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      handleChartChange(type.id);
                      setIsChartDropdownOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    {React.createElement(type.icon, { className: "w-4 h-4" })}
                    {type.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optimized Axis Selection */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">
            X-Axis {selectedChart === 'pie' ? '(Category)' : ''}
          </label>
          <Dropdown
            isOpen={isXDropdownOpen}
            setIsOpen={setIsXDropdownOpen}
            value={xAxis}
            options={selectedChart === 'pie' ? columnAnalysis.categorical : columnAnalysis.all}
            onChange={handleXAxisChange}
            placeholder="Select X-axis"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">
            Y-Axis {selectedChart === 'pie' ? '(Values)' : '(Numerical)'}
          </label>
          <Dropdown
            isOpen={isYDropdownOpen}
            setIsOpen={setIsYDropdownOpen}
            value={yAxis}
            options={columnAnalysis.numerical}
            onChange={handleYAxisChange}
            placeholder="Select Y-axis"
          />
        </div>
      </div>

      {/* Optimized Chart Display */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <ChartRenderer 
          chartType={selectedChart}
          data={chartData}
          xAxis={xAxis}
          yAxis={yAxis}
          colors={COLORS}
        />
      </div>

      {/* Optimized Data Summary */}
      <div className="mt-4 flex flex-wrap gap-6 text-sm text-gray-400">
        <span>Data points: {chartData.length.toLocaleString()}</span>
        <span>Chart type: {currentChartType?.name}</span>
        {xAxis && <span>X-axis: {xAxis}</span>}
        {yAxis && <span>Y-axis: {yAxis}</span>}
      </div>
    </div>
  );
};

export default Charts;