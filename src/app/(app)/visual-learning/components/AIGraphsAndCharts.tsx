
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter } from 'recharts';
import { Send, BarChart3, TrendingUp, Download, Sparkles, Lightbulb } from 'lucide-react';

const AIChartsFeature = () => {
  const [userInput, setUserInput] = useState('');
  const [currentChart, setCurrentChart] = useState<any>(null); // Use 'any' for now, can be typed better
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState('');

  // Sample datasets for different topics
  const sampleData = {
    countries: [
      { name: 'China', population: 1439323776, gdp: 14342 },
      { name: 'India', population: 1380004385, gdp: 3176 },
      { name: 'USA', population: 331002651, gdp: 21433 },
      { name: 'Indonesia', population: 273523615, gdp: 1119 },
      { name: 'Pakistan', population: 220892340, gdp: 348 }
    ],
    students: [
      { subject: 'Mathematics', score: 85, students: 120 },
      { subject: 'Science', score: 78, students: 115 },
      { subject: 'English', score: 92, students: 130 },
      { subject: 'History', score: 76, students: 95 },
      { subject: 'Geography', score: 81, students: 88 }
    ],
    climate: [
      { month: 'Jan', temperature: 15, rainfall: 45 },
      { month: 'Feb', temperature: 18, rainfall: 35 },
      { month: 'Mar', temperature: 22, rainfall: 60 },
      { month: 'Apr', temperature: 25, rainfall: 80 },
      { month: 'May', temperature: 28, rainfall: 120 },
      { month: 'Jun', temperature: 32, rainfall: 150 }
    ],
    technology: [
      { year: '2019', users: 3.2, growth: 8.2 },
      { year: '2020', users: 4.1, growth: 28.1 },
      { year: '2021', users: 4.8, growth: 17.1 },
      { year: '2022', users: 5.2, growth: 8.3 },
      { year: '2023', users: 5.6, growth: 7.7 }
    ]
  };

  const colorSchemes = {
    vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'],
    modern: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b'],
    educational: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'],
    gradient: ['#667eea', '#764ba2', '#f5576c', '#4facfe', '#43e97b', '#f093fb', '#00f2fe']
  };

  // AI-powered chart type detection
  const detectChartType = (input: string) => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('bar') || lowerInput.includes('column')) return 'bar';
    if (lowerInput.includes('line') || lowerInput.includes('trend') || lowerInput.includes('over time')) return 'line';
    if (lowerInput.includes('pie') || lowerInput.includes('portion') || lowerInput.includes('percentage')) return 'pie';
    if (lowerInput.includes('area') || lowerInput.includes('filled')) return 'area';
    if (lowerInput.includes('scatter') || lowerInput.includes('correlation')) return 'scatter';
    
    // Default intelligent selection based on data type
    return 'bar';
  };

  // AI-powered data selection
  const selectData = (input: string) => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('country') || lowerInput.includes('population') || lowerInput.includes('gdp')) {
      return { data: sampleData.countries, key: 'population', name: 'name' };
    }
    if (lowerInput.includes('student') || lowerInput.includes('subject') || lowerInput.includes('score')) {
      return { data: sampleData.students, key: 'score', name: 'subject' };
    }
    if (lowerInput.includes('climate') || lowerInput.includes('temperature') || lowerInput.includes('weather')) {
      return { data: sampleData.climate, key: 'temperature', name: 'month' };
    }
    if (lowerInput.includes('technology') || lowerInput.includes('users') || lowerInput.includes('growth')) {
      return { data: sampleData.technology, key: 'users', name: 'year' };
    }
    
    return { data: sampleData.countries, key: 'population', name: 'name' };
  };

  // AI-powered insights generation
  const generateInsights = (chartType: string, data: any[], key: string) => {
    const values = data.map(item => item[key]);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const maxItem = data.find(item => item[key] === max);
    const minItem = data.find(item => item[key] === min);

    const insights = [
      `📊 The highest value is ${max.toLocaleString()} for ${maxItem.name || maxItem.subject || maxItem.month || maxItem.year}`,
      `📉 The lowest value is ${min.toLocaleString()} for ${minItem.name || minItem.subject || minItem.month || minItem.year}`,
      `📈 The average value across all data points is ${avg.toFixed(2)}`,
      `🎯 The data shows a ${max > avg * 2 ? 'high variance' : 'moderate distribution'} pattern`
    ];

    return insights.join('\n');
  };

  const handleGenerateChart = () => {
    if (!userInput.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const chartType = detectChartType(userInput);
      const { data, key, name } = selectData(userInput);
      const generatedInsights = generateInsights(chartType, data, key);
      
      setCurrentChart({ type: chartType, data, key, name });
      setInsights(generatedInsights);
      setIsGenerating(false);
    }, 1500);
  };

  const renderChart = () => {
    if (!currentChart) return null;

    const { type, data, key, name } = currentChart;
    const colors = colorSchemes.modern;

    const commonProps = {
      width: '100%', // Recharts ResponsiveContainer handles actual width
      height: 400,   // Fixed height for the chart area
      data: data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey={name} stroke="#6366f1" />
              <YAxis stroke="#6366f1" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }} 
              />
              <Legend />
              <Bar dataKey={key} fill={colors[0]} radius={[8, 8, 0, 0]}>
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey={name} stroke="#6366f1" />
              <YAxis stroke="#6366f1" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={key} 
                stroke={colors[0]} 
                strokeWidth={4}
                dot={{ fill: colors[0], strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: colors[0], strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey={key}
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey={name} stroke="#6366f1" />
              <YAxis stroke="#6366f1" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey={key} 
                stroke={colors[0]} 
                fill={`url(#gradient${0})`}
                strokeWidth={3}
              />
              <defs>
                <linearGradient id="gradient0" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const exampleQueries = [
    "Bar chart for country populations",
    "Line chart showing student scores over subjects",
    "Pie chart for climate temperature distribution",
    "Area chart for technology user growth"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6 dark:from-slate-900 dark:via-slate-800 dark:to-sky-900 dark:text-gray-200">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:text-transparent">
              AI Graphs &amp; Charts
            </h1>
            <Sparkles className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Ask for any chart in natural language - AI will create it instantly!</p>
        </div>

        {/* Input Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-8 border border-gray-100 dark:border-slate-700">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g., 'Bar chart for country populations' or 'Line chart showing temperature trends'"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none text-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                onKeyPress={(e) => e.key === 'Enter' && handleGenerateChart()}
              />
            </div>
            <button
              onClick={handleGenerateChart}
              disabled={isGenerating || !userInput.trim()}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-all duration-200 transform hover:scale-105"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Generate Chart
                </>
              )}
            </button>
          </div>

          {/* Example Queries */}
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => setUserInput(query)}
                  className="px-3 py-1 bg-gray-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Display */}
        {currentChart && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    {currentChart.type === 'bar' && <BarChart3 className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />}
                    {currentChart.type === 'line' && <TrendingUp className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />}
                    {currentChart.type === 'pie' && <BarChart3 className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />} {/* Should be PieChart icon */}
                    {currentChart.type === 'area' && <TrendingUp className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />}
                    AI Generated Chart
                  </h2>
                  <button className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
                    <Download className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
                <div className="h-96"> {/* Ensure parent has a defined height for ResponsiveContainer */}
                  {renderChart()}
                </div>
              </div>
            </div>

            {/* Insights Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-slate-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-yellow-500" />
                  AI Insights
                </h3>
                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                  {insights.split('\n').map((insight, index) => (
                    <div key={index} className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg border-l-4 border-indigo-400 dark:border-indigo-500">
                      {insight}
                    </div>
                  ))}
                </div>
                
                {/* Chart Type Indicators */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Available Chart Types</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <BarChart3 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      <span className="text-sm">Bar Charts</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-green-500 dark:text-green-400" />
                      <span className="text-sm">Line Charts</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <BarChart3 className="w-4 h-4 text-purple-500 dark:text-purple-400" /> {/* Should be PieChart icon */}
                      <span className="text-sm">Pie Charts</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                      <span className="text-sm">Area Charts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        {!currentChart && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl w-fit mb-4">
                <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">AI-Powered</h3>
              <p className="text-gray-600 dark:text-gray-400">Just describe what chart you want in natural language, and AI will create it automatically.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl w-fit mb-4">
                <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Multiple Chart Types</h3>
              <p className="text-gray-600 dark:text-gray-400">Supports bar charts, line charts, pie charts, area charts, and more with modern styling.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl w-fit mb-4">
                <Lightbulb className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Smart Insights</h3>
              <p className="text-gray-600 dark:text-gray-400">Get automatic insights and analysis from your data with AI-generated explanations.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChartsFeature;

    