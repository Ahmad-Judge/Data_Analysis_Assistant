import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, MessageCircle, X, Settings, Loader, Trash2 } from "lucide-react";

const EnhancedChatbot = ({ csvData }) => {
  const [messages, setMessages] = useState([
    { 
      role: "ai", 
      text: "Hi! I'm your CSV Analysis Assistant. Upload a CSV file and I can help you understand your data, suggest visualizations, perform data cleaning, and provide insights. You can also ask me specific questions about your dataset!",
      type: "text"
    },
  ]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_OPENAI_API_KEY || "");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [currentDataset, setCurrentDataset] = useState(null);
  const [isCleaningData, setIsCleaningData] = useState(false);
  const messagesEndRef = useRef(null);

  const customColor = "rgba(0, 208, 255, 0.1)";

  // Update current dataset when csvData changes
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      setCurrentDataset(csvData);
      // Auto-analyze the dataset when it changes
      analyzeDataset(csvData);
    }
  }, [csvData]);

  // Auto scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveApiKey = () => {
    setShowApiKeyInput(false);
    addMessage("ai", "API key saved successfully! Now I can provide advanced analysis of your CSV data.");
  };

  const addMessage = (role, text, type = "text", data = null) => {
    setMessages(prev => [...prev, { role, text, type, data, timestamp: Date.now() }]);
  };

  const analyzeDataset = async (data) => {
    if (!data || data.length === 0) return;
    
    const analysis = performBasicAnalysis(data);
    const summary = generateDataSummary(analysis, data);
    
    addMessage("ai", summary, "analysis", analysis);
    
    if (apiKey) {
      // Perform AI-powered analysis
      await performAIAnalysis(data, analysis);
    }
  };

  const performBasicAnalysis = (data) => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);
    const rowCount = data.length;
    const columnAnalysis = {};

    columns.forEach(col => {
      const values = data.map(row => row[col]).filter(val => val != null && val !== '');
      const uniqueValues = [...new Set(values)];
      const nonNullCount = values.length;
      const nullCount = rowCount - nonNullCount;
      
      // Determine data type
      const numericValues = values.map(val => Number(val)).filter(val => !isNaN(val) && isFinite(val));
      const isNumeric = numericValues.length > values.length * 0.7;
      
      columnAnalysis[col] = {
        type: isNumeric ? 'numeric' : 'categorical',
        totalCount: rowCount,
        nonNullCount,
        nullCount,
        nullPercentage: ((nullCount / rowCount) * 100).toFixed(1),
        uniqueCount: uniqueValues.length,
        uniquePercentage: ((uniqueValues.length / nonNullCount) * 100).toFixed(1),
      };

      if (isNumeric && numericValues.length > 0) {
        columnAnalysis[col].min = Math.min(...numericValues);
        columnAnalysis[col].max = Math.max(...numericValues);
        columnAnalysis[col].mean = (numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(2);
        columnAnalysis[col].median = calculateMedian(numericValues);
      } else {
        // For categorical data, find most common values
        const valueCounts = values.reduce((acc, val) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {});
        columnAnalysis[col].topValues = Object.entries(valueCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5);
      }
    });

    return {
      rowCount,
      columnCount: columns.length,
      columns,
      columnAnalysis,
      numericColumns: columns.filter(col => columnAnalysis[col].type === 'numeric'),
      categoricalColumns: columns.filter(col => columnAnalysis[col].type === 'categorical'),
    };
  };

  const calculateMedian = (numbers) => {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : ((sorted[mid - 1] + sorted[mid]) / 2);
  };

  const generateDataSummary = (analysis, data) => {
    if (!analysis) return "Unable to analyze the dataset.";

    const { rowCount, columnCount, numericColumns, categoricalColumns, columnAnalysis } = analysis;
    
    let summary = `📊 **Dataset Overview:**\n`;
    summary += `• **Rows:** ${rowCount.toLocaleString()}\n`;
    summary += `• **Columns:** ${columnCount}\n`;
    summary += `• **Numeric columns:** ${numericColumns.length} (${numericColumns.join(', ')})\n`;
    summary += `• **Categorical columns:** ${categoricalColumns.length} (${categoricalColumns.join(', ')})\n\n`;

    // Data quality assessment
    const columnsWithNulls = Object.entries(columnAnalysis)
      .filter(([, info]) => info.nullCount > 0)
      .sort(([, a], [, b]) => b.nullPercentage - a.nullPercentage);

    if (columnsWithNulls.length > 0) {
      summary += `🔍 **Data Quality Issues:**\n`;
      columnsWithNulls.slice(0, 3).forEach(([col, info]) => {
        summary += `• **${col}:** ${info.nullPercentage}% missing values\n`;
      });
      summary += `\n`;
    }

    // Visualization suggestions
    summary += `📈 **Visualization Suggestions:**\n`;
    if (numericColumns.length >= 2) {
      summary += `• **Scatter plot:** ${numericColumns[0]} vs ${numericColumns[1]} to see correlations\n`;
      summary += `• **Line chart:** For time-series data if you have date columns\n`;
    }
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      summary += `• **Bar chart:** ${categoricalColumns[0]} (x-axis) vs ${numericColumns[0]} (y-axis)\n`;
      summary += `• **Pie chart:** Distribution of ${categoricalColumns[0]}\n`;
    }
    if (numericColumns.length > 0) {
      summary += `• **Histogram:** Distribution of ${numericColumns[0]}\n`;
    }

    return summary;
  };

  const performAIAnalysis = async (data, basicAnalysis) => {
    if (!apiKey) return;
    
    try {
      setIsLoading(true);
      
      // Prepare data sample for AI analysis
      const sampleSize = Math.min(5, data.length);
      const dataSample = data.slice(0, sampleSize);
      
      const prompt = `Analyze this CSV dataset and provide insights:

Dataset Info:
- Rows: ${basicAnalysis.rowCount}
- Columns: ${basicAnalysis.columnCount}
- Numeric columns: ${basicAnalysis.numericColumns.join(', ')}
- Categorical columns: ${basicAnalysis.categoricalColumns.join(', ')}

Sample data (first ${sampleSize} rows):
${JSON.stringify(dataSample, null, 2)}

Column details:
${Object.entries(basicAnalysis.columnAnalysis).map(([col, info]) => 
  `${col}: ${info.type}, ${info.nullPercentage}% missing`
).join('\n')}

Please provide:
1. What type of data this appears to be (business, scientific, etc.)
2. Key insights and patterns you notice
3. Specific data cleaning recommendations
4. Best visualization recommendations with exact column names
5. Interesting questions this data could help answer

Be specific and actionable in your recommendations.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      const aiInsights = result.choices[0].message.content;
      
      addMessage("ai", `🤖 **AI-Powered Analysis:**\n\n${aiInsights}`, "ai_analysis");
      
    } catch (error) {
      addMessage("ai", `❌ Error getting AI analysis: ${error.message}. Basic analysis is still available above.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserQuery = async (query) => {
    if (!currentDataset) {
      addMessage("ai", "Please upload a CSV file first so I can analyze your data!");
      return;
    }

    if (!apiKey) {
      addMessage("ai", "For detailed analysis and answers to specific questions, please add your OpenAI API key using the settings button.");
      return;
    }

    try {
      setIsLoading(true);
      
      const analysis = performBasicAnalysis(currentDataset);
      const prompt = `You are a data analyst assistant. Answer the user's question about their CSV dataset.

Dataset context:
- Rows: ${analysis.rowCount}
- Columns: ${analysis.columns.join(', ')}
- Numeric columns: ${analysis.numericColumns.join(', ')}
- Categorical columns: ${analysis.categoricalColumns.join(', ')}

User question: ${query}

Provide a helpful, specific answer. If they ask about visualization, suggest exact chart types and column combinations. If they ask about data cleaning, be specific about which columns need attention.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      addMessage("ai", result.choices[0].message.content);
      
    } catch (error) {
      addMessage("ai", `❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    addMessage("user", userMessage);
    setInput("");

    // Handle different types of queries
    if (userMessage.toLowerCase().includes('clean') && (userMessage.toLowerCase().includes('data') || userMessage.toLowerCase().includes('auto'))) {
      await autoCleanDataset();
    } else if (userMessage.toLowerCase().includes('visualiz') || userMessage.toLowerCase().includes('chart') || userMessage.toLowerCase().includes('graph')) {
      if (currentDataset) {
        const analysis = performBasicAnalysis(currentDataset);
        const vizAdvice = generateVisualizationAdvice(analysis);
        addMessage("ai", vizAdvice);
      }
    } else {
      // General query - use AI if available
      await handleUserQuery(userMessage);
    }
  };

  const generateVisualizationAdvice = (analysis) => {
    if (!analysis) return "Please upload a CSV file first.";

    let advice = "📊 **Visualization Recommendations:**\n\n";
    
    const { numericColumns, categoricalColumns } = analysis;

    if (numericColumns.length >= 2) {
      advice += `**For Correlations:**\n`;
      advice += `• Scatter plot: ${numericColumns[0]} (x) vs ${numericColumns[1]} (y)\n`;
      if (numericColumns.length > 2) {
        advice += `• Multi-variable scatter: Try ${numericColumns[2]} as size/color\n`;
      }
    }

    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      advice += `\n**For Categories vs Numbers:**\n`;
      advice += `• Bar chart: ${categoricalColumns[0]} (x) vs ${numericColumns[0]} (y)\n`;
      advice += `• Pie chart: Distribution of ${categoricalColumns[0]}\n`;
    }

    if (numericColumns.length > 0) {
      advice += `\n**For Distribution Analysis:**\n`;
      numericColumns.slice(0, 2).forEach(col => {
        advice += `• Histogram: Distribution of ${col}\n`;
      });
    }

    // Time series detection
    const dateColumns = analysis.columns.filter(col => 
      col.toLowerCase().includes('date') || 
      col.toLowerCase().includes('time') ||
      col.toLowerCase().includes('year')
    );
    
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      advice += `\n**For Time Series:**\n`;
      advice += `• Line chart: ${dateColumns[0]} (x) vs ${numericColumns[0]} (y)\n`;
    }

    return advice;
  };

  const autoCleanDataset = async () => {
    if (!currentDataset || currentDataset.length === 0) {
      addMessage("ai", "❌ No dataset available to clean. Please upload a CSV file first.");
      return;
    }

    setIsCleaningData(true);
    addMessage("ai", "🧹 Starting automatic data cleaning process...");

    try {
      // Perform comprehensive analysis first
      const analysis = performBasicAnalysis(currentDataset);
      const cleaningPlan = generateCleaningPlan(analysis);
      
      addMessage("ai", `📋 **Cleaning Plan:**\n${cleaningPlan.description}\n\nProcessing...`);

      // Apply all cleaning operations
      const cleanedData = await performDataCleaning(currentDataset, analysis, cleaningPlan);
      
      // Generate cleaning report
      const report = generateCleaningReport(currentDataset, cleanedData, cleaningPlan);
      addMessage("ai", `✅ **Data Cleaning Complete!**\n\n${report}`, "cleaning_complete");
      
      // Auto-analyze the cleaned dataset
      setTimeout(() => {
        analyzeDataset(cleanedData);
      }, 1000);
      
    } catch (error) {
      addMessage("ai", `❌ Error during data cleaning: ${error.message}`);
    } finally {
      setIsCleaningData(false);
    }
  };

  const generateCleaningPlan = (analysis) => {
    const plan = {
      operations: [],
      description: ""
    };

    let description = "**Planned Operations:**\n";

    // Handle missing values
    const columnsWithNulls = Object.entries(analysis.columnAnalysis)
      .filter(([, info]) => info.nullCount > 0);

    columnsWithNulls.forEach(([col, info]) => {
      if (parseFloat(info.nullPercentage) > 80) {
        plan.operations.push({ type: 'remove_column', column: col });
        description += `• Remove column "${col}" (${info.nullPercentage}% missing)\n`;
      } else if (info.type === 'numeric') {
        const strategy = parseFloat(info.nullPercentage) > 30 ? 'median' : 'mean';
        plan.operations.push({ type: 'fill_numeric', column: col, strategy, value: info[strategy] });
        description += `• Fill "${col}" missing values with ${strategy} (${info[strategy]})\n`;
      } else {
        const mostCommon = info.topValues?.[0]?.[0] || 'Unknown';
        plan.operations.push({ type: 'fill_categorical', column: col, value: mostCommon });
        description += `• Fill "${col}" missing values with "${mostCommon}"\n`;
      }
    });

    // Remove duplicate rows
    plan.operations.push({ type: 'remove_duplicates' });
    description += `• Remove duplicate rows\n`;

    // Clean numeric columns
    analysis.numericColumns.forEach(col => {
      plan.operations.push({ type: 'clean_numeric', column: col });
      description += `• Clean numeric values in "${col}"\n`;
    });

    plan.description = description;
    return plan;
  };

  const performDataCleaning = async (data, analysis, plan) => {
    let cleanedData = [...data];
    let operationResults = {};

    for (const operation of plan.operations) {
      switch (operation.type) {
        case 'remove_column':
          cleanedData = cleanedData.map(row => {
            const { [operation.column]: removed, ...rest } = row;
            return rest;
          });
          operationResults[operation.type] = (operationResults[operation.type] || 0) + 1;
          break;

        case 'fill_numeric':
          const meanValue = analysis.columnAnalysis[operation.column].mean;
          const medianValue = analysis.columnAnalysis[operation.column].median;
          const fillValue = operation.strategy === 'mean' ? meanValue : medianValue;
          
          cleanedData = cleanedData.map(row => ({
            ...row,
            [operation.column]: row[operation.column] ?? fillValue
          }));
          operationResults[operation.type] = (operationResults[operation.type] || 0) + 1;
          break;

        case 'fill_categorical':
          cleanedData = cleanedData.map(row => ({
            ...row,
            [operation.column]: row[operation.column] || operation.value
          }));
          operationResults[operation.type] = (operationResults[operation.type] || 0) + 1;
          break;

        case 'remove_duplicates':
          const originalLength = cleanedData.length;
          const uniqueData = [];
          const seen = new Set();
          
          cleanedData.forEach(row => {
            const key = JSON.stringify(row);
            if (!seen.has(key)) {
              seen.add(key);
              uniqueData.push(row);
            }
          });
          
          cleanedData = uniqueData;
          operationResults[operation.type] = originalLength - cleanedData.length;
          break;

        case 'clean_numeric':
          cleanedData = cleanedData.map(row => ({
            ...row,
            [operation.column]: isNaN(Number(row[operation.column])) ? 
              row[operation.column] : Number(row[operation.column])
          }));
          operationResults[operation.type] = (operationResults[operation.type] || 0) + 1;
          break;

        default:
          break;
      }
    }

    return cleanedData;
  };

  const generateCleaningReport = (originalData, cleanedData, plan) => {
    let report = `**Cleaning Results:**\n`;
    report += `• Original rows: ${originalData.length.toLocaleString()}\n`;
    report += `• Cleaned rows: ${cleanedData.length.toLocaleString()}\n`;
    
    if (originalData.length !== cleanedData.length) {
      const removed = originalData.length - cleanedData.length;
      report += `• Rows removed: ${removed.toLocaleString()} (${((removed / originalData.length) * 100).toFixed(1)}%)\n`;
    }
    
    const originalColumns = Object.keys(originalData[0] || {}).length;
    const cleanedColumns = Object.keys(cleanedData[0] || {}).length;
    
    if (originalColumns !== cleanedColumns) {
      const removedCols = originalColumns - cleanedColumns;
      report += `• Columns removed: ${removedCols}\n`;
    }
    
    report += `\n**Operations Performed:**\n`;
    plan.operations.forEach(op => {
      switch (op.type) {
        case 'remove_column':
          report += `• Removed column: "${op.column}"\n`;
          break;
        case 'fill_numeric':
          report += `• Filled numeric values in "${op.column}" with ${op.strategy}\n`;
          break;
        case 'fill_categorical':
          report += `• Filled categorical values in "${op.column}" with "${op.value}"\n`;
          break;
        case 'remove_duplicates':
          report += `• Removed duplicate rows\n`;
          break;
        case 'clean_numeric':
          report += `• Cleaned numeric formats in "${op.column}"\n`;
          break;
      }
    });

    return report;
  };

  const clearMessages = () => {
    setMessages([
      { 
        role: "ai", 
        text: "Hi! I'm your CSV Analysis Assistant. Upload a CSV file and I can help you understand your data, suggest visualizations, perform data cleaning, and provide insights. You can also ask me specific questions about your dataset!",
        type: "text"
      },
    ]);
  };

  const formatMessage = (text) => {
    // Convert markdown-like syntax to HTML
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

return (
    <>
      {/* Toggle Button - Responsive positioning and sizing */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 sm:right-6 lg:right-8 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full shadow-2xl transition-all duration-500 z-50 backdrop-blur-sm group overflow-hidden ${
          isOpen 
            ? 'opacity-0 pointer-events-none scale-75' 
            : 'hover:scale-110 hover:shadow-cyan-500/25 active:scale-105 opacity-100'
        }`}
        style={{ 
          backgroundColor: customColor,
          border: `2px solid rgba(0, 208, 255, 0.4)`,
          boxShadow: '0 0 20px rgba(0, 208, 255, 0.2), 0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Animated background pulse */}
        <div 
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-10 group-hover:animate-pulse transition-all duration-700"
          style={{ backgroundColor: 'rgba(0, 208, 255, 0.5)' }}
        />
        
        {/* MessageCircle icon */}
        <div className="relative w-full h-full flex items-center justify-center">
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-cyan-200 drop-shadow-lg group-hover:text-cyan-100 transition-colors duration-200" />
          {currentDataset && (
            <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </div>
        
        {/* Ripple effect on click */}
        <div className="absolute inset-0 rounded-full opacity-0 group-active:opacity-30 group-active:animate-ping bg-white transition-opacity duration-200" />
      </button>

      {/* Chatbot Window - Responsive positioning and sizing */}
      <div
        className={`fixed bottom-0 left-0 right-0 sm:left-auto sm:right-4 lg:right-8 w-full sm:w-[400px] lg:w-[420px] xl:w-[450px] h-[70vh] sm:h-[600px] lg:h-[650px] flex flex-col rounded-t-2xl sm:rounded-t-2xl border-t border-l-0 sm:border-l border-r-0 sm:border-r border-white/20 bg-gradient-to-b from-black/90 to-gray-900/90 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
        }`}
        style={{
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          maxHeight: '90vh'
        }}
      >
        {/* Header - Responsive padding and text */}
        <div 
          className="px-3 sm:px-4 py-2 sm:py-3 border-b border-white/20 flex items-center justify-between"
          style={{ backgroundColor: customColor }}
        >
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-base sm:text-lg text-white flex items-center gap-2">
              CSV Assistant
              {currentDataset && (
                <span className="text-green-400 text-xs bg-green-400/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                  {currentDataset.length} rows
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-400 truncate">AI-Powered Data Analysis</p>
          </div>
          
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            {/* Settings button */}
           {(apiKey && <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="p-1.5 sm:p-2 rounded-full transition-all duration-200 hover:bg-white/10 group"
              title="Configure OpenAI API Key"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-white transition-colors duration-200" />
            </button>)}
            
            {/* Clear button */}
            <button
              onClick={clearMessages}
              className="p-1.5 sm:p-2 rounded-full transition-all duration-200 hover:bg-white/10 group"
              title="Clear Chat"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-white transition-colors duration-200" />
            </button>
            
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 sm:p-2 rounded-full transition-all duration-200 hover:bg-white/10 group"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white transition-colors duration-200" />
            </button>
          </div>
        </div>

        {/* API Key Input - Responsive */}
        {showApiKeyInput && (
          <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/50 border-b border-white/10">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-300">OpenAI API Key (for advanced analysis):</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 bg-black/40 border border-white/20 text-white text-xs rounded-lg focus:ring-cyan-500/50 focus:border-cyan-500/50 px-2 sm:px-3 py-1.5 sm:py-2 placeholder-gray-500"
                />
                <button
                  onClick={saveApiKey}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap"
                  style={{ 
                    backgroundColor: customColor, 
                    border: `1px solid rgba(0, 208, 255, 0.3)`,
                    color: 'rgb(165, 243, 252)'
                  }}
                >
                  Save
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Enables AI-powered insights and answers to specific questions.
              </p>
            </div>
          </div>
        )}

        {/* Messages - Responsive spacing */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 text-xs sm:text-sm">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === "ai" && (
                <span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-900/40 border border-blue-400/30 flex-shrink-0">
                  <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-blue-300" />
                </span>
              )}
              <div
                className={`max-w-[80%] sm:max-w-[75%] px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl ${
                  message.role === "ai"
                    ? "bg-black text-white border border-white/20"
                    : "text-white"
                }`}
                style={message.role === "user" ? { backgroundColor: customColor } : {}}
              >
                <div
                  className="whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{
                    __html: formatMessage(message.text)
                  }}
                />
                {message.type === 'analysis' && (
                  <div className="mt-1 sm:mt-2 text-xs text-gray-400">
                    📊 Dataset analyzed • {message.timestamp && new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-pink-900/40 border border-pink-400/30 flex-shrink-0">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-pink-300" />
                </span>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-2 sm:gap-3 justify-start">
              <span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-900/40 border border-blue-400/30 flex-shrink-0">
                <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-blue-300" />
              </span>
              <div className="bg-black text-white border border-white/20 rounded-xl px-2 sm:px-3 py-1.5 sm:py-2">
                <div className="flex items-center gap-2">
                  <Loader className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-cyan-300" />
                  <span className="text-xs sm:text-sm">
                    {isCleaningData ? 'Cleaning data...' : 'Analyzing...'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions - Responsive grid */}
        {currentDataset && (
          <div className="px-3 sm:px-4 py-2 border-t border-white/10 bg-black/20">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
              <button
                onClick={() => setInput("What visualizations do you recommend for this data?")}
                className="text-xs px-2 sm:px-3 py-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20 transition-all duration-200 truncate"
              >
                📊 Charts
              </button>
              <button
                onClick={() => setInput("Clean my data automatically")}
                className="text-xs px-2 sm:px-3 py-1 rounded-full border border-green-400/30 bg-green-400/10 text-green-300 hover:bg-green-400/20 transition-all duration-200 truncate"
              >
                🧹 Clean
              </button>
              <button
                onClick={() => setInput("What insights can you find in this data?")}
                className="text-xs px-2 sm:px-3 py-1 rounded-full border border-purple-400/30 bg-purple-400/10 text-purple-300 hover:bg-purple-400/20 transition-all duration-200 truncate"
              >
                🔍 Insights
              </button>
              <button
                onClick={() => setInput("What are the data quality issues?")}
                className="text-xs px-2 sm:px-3 py-1 rounded-full border border-yellow-400/30 bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20 transition-all duration-200 truncate"
              >
                ⚠️ Quality
              </button>
            </div>
          </div>
        )}

        {/* Input - Responsive */}
        <div className="flex items-center border-t border-white/20 bg-black/40 p-2">
          <input
            type="text"
            className="flex-1 bg-transparent px-2 sm:px-3 py-2 text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none"
            placeholder={
              !currentDataset 
                ? "Upload CSV to start..." 
                : "Ask about data, charts, or 'clean data'..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(e)}
            disabled={isLoading || !currentDataset}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim() || !currentDataset}
            className="p-1.5 sm:p-2 rounded-full transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            style={{ 
              backgroundColor: customColor, 
              border: `1px solid rgba(0, 208, 255, 0.3)` 
            }}
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-200" />
          </button>
        </div>

        {/* Footer Info - Responsive */}
        {apiKey && currentDataset && (
          <div className="px-3 sm:px-4 py-2 bg-yellow-900/10 border-t border-yellow-600/20">
            <p className="text-yellow-400 text-xs flex items-center gap-2">
              <span>💡</span>
              <span className="truncate">Add OpenAI API key for AI insights!</span>
            </p>
          </div>
        )}
        
        {!currentDataset && (
          <div className="px-3 sm:px-4 py-2 bg-blue-900/10 border-t border-blue-600/20">
            <p className="text-blue-400 text-xs flex items-center gap-2">
              <span>📁</span>
              <span className="truncate">Upload CSV above to analyze data!</span>
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default EnhancedChatbot;