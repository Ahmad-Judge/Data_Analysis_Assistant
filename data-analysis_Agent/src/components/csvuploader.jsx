import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { Upload, Send, Bot, User, MessageCircle, X, Settings, Loader, BarChart3 } from "lucide-react";
import EnhancedChatbot from "./chatBot";
import Chart from "./charts";
const  CSVUploader = () => {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  const detectDataType = (value) => {
    if (value === null || value === undefined || value === '') return 'null';

    // Check if it's a number
    if (!isNaN(value) && !isNaN(parseFloat(value))) {
      return Number.isInteger(parseFloat(value)) ? 'number' : 'number';
    }

    // Check if it's a date
    const dateValue = new Date(value);
    if (!isNaN(dateValue.getTime()) && (value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/\d{1,2}\/\d{1,2}\/\d{4}/))) {
      return 'date';
    }

    // Check if it's boolean
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      return 'boolean';
    }

    return 'text';
  };

  const analyzeColumnTypes = (data) => {
    if (data.length === 0) return {};

    const columnTypes = {};
    const headers = Object.keys(data[0]);

    headers.forEach(header => {
      const values = data.slice(0, 50).map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '');

      if (values.length === 0) {
        columnTypes[header] = 'null';
        return;
      }

      // Count type occurrences
      const typeCounts = {};
      values.forEach(value => {
        const type = detectDataType(value);
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      // Get the most common type
      columnTypes[header] = Object.keys(typeCounts).reduce((a, b) =>
        typeCounts[a] > typeCounts[b] ? a : b
      );
    });

    return columnTypes;
  };

  const processFile = (file) => {
    if (!file) return;

    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        setData(results.data);
        setFilteredData(results.data);
      },
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  // Search functionality
  const handleSearch = (term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(term.toLowerCase())
      )
    );
    setFilteredData(filtered);
  };

  // Export functionality
  const handleExport = () => {
    const dataToExport = searchTerm ? filteredData : data;
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName.replace('.csv', '')}_exported.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
return (
    <div className="bg-black min-h-screen flex justify-center p-3 sm:p-4 lg:p-6">
      <div className="bg-black rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 w-full max-w-7xl">
        {/* Upload Box */}
        {data.length === 0 && (
          <div
            className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center h-48 sm:h-60 flex flex-col items-center justify-center transition-colors
            ${isDragging ? "border-blue-400 bg-blue-50/10" : "border-gray-600"}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csvUpload"
            />
            <Upload className="mx-auto mb-2 sm:mb-3 h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
            <label
              htmlFor="csvUpload"
              className="cursor-pointer text-gray-300 hover:text-white border border-gray-600 hover:bg-gray-700
             focus:ring-4 focus:outline-none focus:ring-blue-500/50 font-medium rounded-lg text-xs sm:text-sm
             px-3 sm:px-5 py-2 sm:py-2.5 text-center transition-all duration-200 flex flex-col items-center"
            >
              Click to upload a CSV file
            </label>
            <div className="text-gray-500 text-xs sm:text-sm mt-2 px-2">
              or drag & drop your CSV file here
            </div>

            {fileName && <p className="mt-2 text-blue-400 text-xs sm:text-sm px-2 break-all">📂 {fileName}</p>}
          </div>
        )}

        {/* Table Preview */}
        {data.length > 0 && (
          <div className="mt-4 sm:mt-8 border border-gray-700 rounded-lg p-3 sm:p-4 lg:p-6">
            {/* Heading with search and buttons */}
            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
              {/* Title and filename */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Data Preview</h2>
                {fileName && (
                  <span className="text-blue-300 text-xs sm:text-sm break-all">{fileName}</span>
                )}
              </div>
              
              {/* Search and buttons container */}
              <div className="ms-auto flex flex-row sm:flex-row gap-3 sm:items-end">
                {/* Search bar */}
                <div className="relative flex-1 sm:max-w-xs">
                  <input
                    type="text"
                    placeholder="Search in data..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="bg-gray-800 border border-gray-600 text-white text-xs sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-8 sm:pl-10 pr-3 py-2 sm:py-2.5 placeholder-gray-400"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2 sm:pl-3 pointer-events-none">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                  {/* Export button */}
                  <button
                    type="button"
                    onClick={handleExport}
                    className="text-black bg-blue-200 hover:bg-black focus:ring-4 focus:outline-none focus:ring-blue-200 font-medium rounded-lg text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 text-center hover:text-blue-400 hover:border-blue-400 border border-transparent transition-all duration-200 flex-1 sm:flex-none"
                  >
                    Export
                  </button>

                  {/* Hidden input */}
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csvUploadReplace"
                  />

                  {/* Import button */}
                  <button
                    type="button"
                    onClick={() => document.getElementById("csvUploadReplace").click()}
                    className="text-gray-900 hover:text-white border border-gray-800 hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 text-center dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-800 transition-all duration-200 flex-1 sm:flex-none"
                  >
                    Import
                  </button>
                </div>
              </div>
            </div>

            {/* Table container with horizontal scroll */}
            <div className="overflow-x-auto rounded-lg border border-gray-800 shadow-2xl -mx-1 sm:mx-0">
              <div className="min-w-full inline-block align-middle">
                <table className="min-w-full bg-gray-950">
                  <thead>
                    <tr className="bg-gray-900 border-b border-gray-700">
                      {data.length > 0 && Object.keys(data[0]).map((key) => {
                        const columnType = analyzeColumnTypes(data)[key];
                        const getTypeColor = (type) => {
                          switch(type) {
                            case 'number': return 'text-purple-400';
                            case 'text': return 'text-cyan-400';
                            case 'date': return 'text-green-400';
                            case 'boolean': return 'text-yellow-400';
                            default: return 'text-gray-400';
                          }
                        };
                        
                        return (
                          <th
                            key={key}
                            className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-white min-w-[120px]"
                          >
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold truncate" title={key}>{key}</span>
                              <span className={`text-xs font-normal ${getTypeColor(columnType)}`}>
                                {columnType}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {(searchTerm ? filteredData : data).slice(0, 10).map((row, i) => (
                      <tr 
                        key={i} 
                        className={`border-b border-gray-800 hover:bg-gray-800/30 transition-colors duration-150 ${
                          i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/30'
                        }`}
                      >
                        {Object.entries(row).map(([key, val], j) => {
                          const columnType = analyzeColumnTypes(data)[key];
                          const getCellStyle = (type, value) => {
                            if (!value && value !== 0) return 'text-gray-500 italic';
                            switch(type) {
                              case 'number': return 'text-purple-300 font-mono';
                              case 'text': return 'text-cyan-200';
                              case 'date': return 'text-green-300';
                              case 'boolean': return 'text-yellow-300';
                              default: return 'text-gray-300';
                            }
                          };
                          
                          return (
                            <td
                              key={j}
                              className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm min-w-[120px]"
                            >
                              <span className={`${getCellStyle(columnType, val)} block truncate`} title={val || val === 0 ? String(val) : '—'}>
                                {val || val === 0 ? String(val) : '—'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Footer info - responsive layout */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-3 sm:mt-4 gap-3 sm:gap-4">
              <p className="text-gray-400 text-xs sm:text-sm">
                Showing first 10 rows of {searchTerm ? filteredData.length : data.length} {searchTerm && 'filtered'} records
                {searchTerm && <span className="text-yellow-400 ml-2 break-all">(searching: "{searchTerm}")</span>}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm">
                <span className="text-gray-500">Total columns: {data.length > 0 ? Object.keys(data[0]).length : 0}</span>
                <div className="flex flex-wrap gap-2 sm:gap-3 text-xs">
                  <span className="text-purple-400">● number</span>
                  <span className="text-cyan-400">● text</span>
                  <span className="text-green-400">● date</span>
                  <span className="text-yellow-400">● boolean</span>
                </div>
              </div>
            </div>
          </div>
        )}
         <Chart csvdata={data}/>
        {/* Enhanced Chatbot Component */}
        <EnhancedChatbot csvData={data} />
      </div>
    </div>
  );
};
export default CSVUploader;