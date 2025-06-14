
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
      height: 380,   // Adjusted height for chart area for compactness
      data: data,
      margin: { top: 20, right: 20, left: 0, bottom: 20 } // Adjusted margins
    };

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey={name} stroke="#6366f1" fontSize={10} />
              <YAxis stroke="#6366f1" fontSize={10}/>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  fontSize: '12px'
                }} 
              />
              <Legend wrapperStyle={{fontSize: "12px"}}/>
              <Bar dataKey={key} fill={colors[0]} radius={[6, 6, 0, 0]}>
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
              <XAxis dataKey={name} stroke="#6366f1" fontSize={10}/>
              <YAxis stroke="#6366f1" fontSize={10}/>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  fontSize: '12px'
                }} 
              />
              <Legend wrapperStyle={{fontSize: "12px"}}/>
              <Line 
                type="monotone" 
                dataKey={key} 
                stroke={colors[0]} 
                strokeWidth={3} // Slightly thinner line
                dot={{ fill: colors[0], strokeWidth: 1, r: 4 }} // Smaller dots
                activeDot={{ r: 6, stroke: colors[0], strokeWidth: 1 }} // Smaller active dot
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
                outerRadius={100} // Smaller radius
                fill="#8884d8"
                dataKey={key}
                fontSize={10}
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  fontSize: '12px'
                }} 
              />
               <Legend wrapperStyle={{fontSize: "12px"}}/>
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey={name} stroke="#6366f1" fontSize={10}/>
              <YAxis stroke="#6366f1" fontSize={10}/>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  fontSize: '12px'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey={key} 
                stroke={colors[0]} 
                fill={`url(#gradient${0})`}
                strokeWidth={2.5} // Thinner stroke
              />
              <defs>
                <linearGradient id="gradient0" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[0]} stopOpacity={0.7}/>
                  <stop offset="95%" stopColor={colors[0]} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
               <Legend wrapperStyle={{fontSize: "12px"}}/>
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const exampleQueries = [
    "Bar chart for country populations",
    "Line chart student scores",
    "Pie chart climate temperature",
    "Area chart technology growth"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4 sm:p-6 dark:from-slate-900 dark:via-slate-800 dark:to-sky-900 dark:text-gray-200">
      <div className="max-w-4xl mx-auto"> {/* Reduced max-width */}
        {/* Header */}
        <div className="text-center mb-6"> {/* Reduced margin-bottom */}
          <div className="flex items-center justify-center gap-2.5 mb-3"> {/* Reduced gap and margin */}
            <div className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg"> {/* Reduced padding and rounding */}
              <BarChart3 className="w-7 h-7 text-white" /> {/* Reduced icon size */}
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:text-transparent"> {/* Reduced font size */}
              AI Graphs &amp; Charts
            </h1>
            <Sparkles className="w-7 h-7 text-yellow-500" /> {/* Reduced icon size */}
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-base"> {/* Reduced font size */}
            Ask for any chart in natural language - AI will create it instantly!
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 mb-6 border border-gray-100 dark:border-slate-700"> {/* Reduced padding and rounding */}
          <div className="flex gap-3"> {/* Reduced gap */}
            <div className="flex-1">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g., 'Bar chart for country populations'"
                className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-slate-600 rounded-lg focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none text-base bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500" /* Reduced padding, font-size */
                onKeyPress={(e) => e.key === 'Enter' && handleGenerateChart()}
              />
            </div>
            <button
              onClick={handleGenerateChart}
              disabled={isGenerating || !userInput.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm font-medium transition-all duration-200 transform hover:scale-105" /* Reduced padding, font-size, gap */
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> {/* Reduced spinner size */}
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> {/* Reduced icon size */}
                  Generate
                </>
              )}
            </button>
          </div>

          {/* Example Queries */}
          <div className="mt-3"> {/* Reduced margin */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Try:</p> {/* Reduced font size and margin */}
            <div className="flex flex-wrap gap-1.5"> {/* Reduced gap */}
              {exampleQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => setUserInput(query)}
                  className="px-2.5 py-1 bg-gray-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-700 rounded-md text-xs text-gray-700 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors" /* Reduced padding, font-size, rounding */
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Display */}
        {currentChart && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> {/* Reduced gap */}
            {/* Chart */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 border border-gray-100 dark:border-slate-700"> {/* Reduced padding and rounding */}
                <div className="flex items-center justify-between mb-4"> {/* Reduced margin */}
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"> {/* Reduced font size */}
                    {currentChart.type === 'bar' && <BarChart3 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />} {/* Reduced icon size */}
                    {currentChart.type === 'line' && <TrendingUp className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />} {/* Reduced icon size */}
                    {currentChart.type === 'pie' && <BarChart3 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />} {/* Reduced icon size, should be PieChart icon */}
                    {currentChart.type === 'area' && <TrendingUp className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />} {/* Reduced icon size */}
                    AI Generated Chart
                  </h2>
                  <button className="p-1.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md transition-colors"> {/* Reduced padding and rounding */}
                    <Download className="w-4 h-4 text-gray-600 dark:text-gray-300" /> {/* Reduced icon size */}
                  </button>
                </div>
                <div className="h-80"> {/* Reduced chart height */}
                  {renderChart()}
                </div>
              </div>
            </div>

            {/* Insights Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 border border-gray-100 dark:border-slate-700"> {/* Reduced padding and rounding */}
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2"> {/* Reduced font size and margin */}
                  <Lightbulb className="w-5 h-5 text-yellow-500" /> {/* Reduced icon size */}
                  AI Insights
                </h3>
                <div className="space-y-2.5 text-gray-700 dark:text-gray-300 text-sm"> {/* Reduced spacing and font size */}
                  {insights.split('\n').map((insight, index) => (
                    <div key={index} className="p-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-md border-l-4 border-indigo-400 dark:border-indigo-500 text-xs"> {/* Reduced padding and font size */}
                      {insight}
                    </div>
                  ))}
                </div>
                
                {/* Chart Type Indicators */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700"> {/* Reduced margins */}
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">Available Types</h4> {/* Reduced font size and margin */}
                  <div className="grid grid-cols-2 gap-1.5"> {/* Reduced gap */}
                    {[
                        {icon: BarChart3, label: "Bar Charts", colorClass: "text-indigo-500 dark:text-indigo-400"},
                        {icon: TrendingUp, label: "Line Charts", colorClass: "text-green-500 dark:text-green-400"},
                        {icon: BarChart3, label: "Pie Charts", colorClass: "text-purple-500 dark:text-purple-400"}, // Should be PieChart icon
                        {icon: TrendingUp, label: "Area Charts", colorClass: "text-orange-500 dark:text-orange-400"},
                    ].map(item => (
                        <div key={item.label} className="flex items-center gap-1.5 p-1.5 bg-gray-50 dark:bg-slate-700 rounded-md"> {/* Reduced padding and gap */}
                        <item.icon className={`w-3.5 h-3.5 ${item.colorClass}`} /> {/* Reduced icon size */}
                        <span className="text-xs">{item.label}</span> {/* Reduced font size */}
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        {!currentChart && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"> {/* Reduced gap and margin */}
             {[
                {icon: Sparkles, title: "AI-Powered", description: "Describe charts in natural language."},
                {icon: BarChart3, title: "Multiple Chart Types", description: "Supports bar, line, pie, area charts."},
                {icon: Lightbulb, title: "Smart Insights", description: "Get AI-generated explanations."}
             ].map((feature, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-shadow"> {/* Reduced padding and rounding */}
                <div className={`p-2.5 rounded-lg w-fit mb-3 ${index === 0 ? 'bg-indigo-100 dark:bg-indigo-900/50' : index === 1 ? 'bg-green-100 dark:bg-green-900/50' : 'bg-purple-100 dark:bg-purple-900/50'}`}> {/* Reduced padding and margin */}
                    <feature.icon className={`w-5 h-5 ${index === 0 ? 'text-indigo-600 dark:text-indigo-400' : index === 1 ? 'text-green-600 dark:text-green-400' : 'text-purple-600 dark:text-purple-400'}`} /> {/* Reduced icon size */}
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1.5">{feature.title}</h3> {/* Reduced font size and margin */}
                <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p> {/* Reduced font size */}
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChartsFeature;
