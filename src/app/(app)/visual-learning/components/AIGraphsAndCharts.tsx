
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter } from 'recharts';
import { Send, BarChart3, TrendingUp, Download, Sparkles, Lightbulb } from 'lucide-react';

const AIChartsFeature = () => {
  const [userInput, setUserInput] = useState('');
  const [currentChart, setCurrentChart] = useState<any>(null); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState('');

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
    modern: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b'],
  };

  const detectChartType = (input: string) => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('bar') || lowerInput.includes('column')) return 'bar';
    if (lowerInput.includes('line') || lowerInput.includes('trend') || lowerInput.includes('over time')) return 'line';
    if (lowerInput.includes('pie') || lowerInput.includes('portion') || lowerInput.includes('percentage')) return 'pie';
    if (lowerInput.includes('area') || lowerInput.includes('filled')) return 'area';
    if (lowerInput.includes('scatter') || lowerInput.includes('correlation')) return 'scatter';
    return 'bar';
  };

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

  const generateInsights = (chartType: string, data: any[], key: string) => {
    const values = data.map(item => item[key]);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const maxItem = data.find(item => item[key] === max);
    const minItem = data.find(item => item[key] === min);

    const insights = [
      `📊 Highest: ${max.toLocaleString()} for ${maxItem.name || maxItem.subject || maxItem.month || maxItem.year}`,
      `📉 Lowest: ${min.toLocaleString()} for ${minItem.name || minItem.subject || minItem.month || minItem.year}`,
      `📈 Average: ${avg.toFixed(2)}`,
      `🎯 Pattern: ${max > avg * 2 ? 'High variance' : 'Moderate distribution'}`
    ];
    return insights.join('\n');
  };

  const handleGenerateChart = () => {
    if (!userInput.trim()) return;
    setIsGenerating(true);
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
      width: '100%', height: 320, data: data,
      margin: { top: 15, right: 15, left: -10, bottom: 15 }
    };

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey={name} stroke="#6366f1" fontSize={10} />
              <YAxis stroke="#6366f1" fontSize={10}/>
              <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontSize: '12px' }} />
              <Legend wrapperStyle={{fontSize: "10px"}}/>
              <Bar dataKey={key} fill={colors[0]} radius={[4, 4, 0, 0]}>
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
              <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontSize: '12px' }} />
              <Legend wrapperStyle={{fontSize: "10px"}}/>
              <Line type="monotone" dataKey={key} stroke={colors[0]} strokeWidth={2.5} dot={{ fill: colors[0], strokeWidth: 1, r: 3 }} activeDot={{ r: 5, stroke: colors[0], strokeWidth: 1 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey={key} fontSize={10}>
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontSize: '12px' }} />
               <Legend wrapperStyle={{fontSize: "10px"}}/>
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
              <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontSize: '12px' }} />
              <Area type="monotone" dataKey={key} stroke={colors[0]} fill={`url(#gradient${0})`} strokeWidth={2} />
              <defs>
                <linearGradient id="gradient0" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[0]} stopOpacity={0.7}/>
                  <stop offset="95%" stopColor={colors[0]} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
               <Legend wrapperStyle={{fontSize: "10px"}}/>
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-3 sm:p-4 dark:from-slate-900 dark:via-slate-800 dark:to-sky-900 dark:text-gray-200">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-md sm:rounded-lg">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:w-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:text-transparent">
              AI Graphs &amp; Charts
            </h1>
            <Sparkles className="w-5 h-5 sm:w-6 sm:w-6 text-yellow-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base">
            Ask for any chart in natural language - AI will create it instantly!
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-100 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="E.g., 'Bar chart for country populations'"
                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-slate-600 rounded-md sm:rounded-lg focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none text-sm sm:text-base bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                onKeyPress={(e) => e.key === 'Enter' && handleGenerateChart()}
              />
            </div>
            <button
              onClick={handleGenerateChart}
              disabled={isGenerating || !userInput.trim()}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md sm:rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium transition-all duration-200 transform hover:scale-105"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Generate
                </>
              )}
            </button>
          </div>

          <div className="mt-2 sm:mt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Try:</p>
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {exampleQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => setUserInput(query)}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gray-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-700 rounded-sm sm:rounded-md text-xs text-gray-700 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        </div>

        {currentChart && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 border border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5 sm:gap-2">
                    {currentChart.type === 'bar' && <BarChart3 className="w-4 h-4 sm:w-5 sm:w-5 text-indigo-500 dark:text-indigo-400" />}
                    {currentChart.type === 'line' && <TrendingUp className="w-4 h-4 sm:w-5 sm:w-5 text-indigo-500 dark:text-indigo-400" />}
                    {currentChart.type === 'pie' && <BarChart3 className="w-4 h-4 sm:w-5 sm:w-5 text-indigo-500 dark:text-indigo-400" />}
                    {currentChart.type === 'area' && <TrendingUp className="w-4 h-4 sm:w-5 sm:w-5 text-indigo-500 dark:text-indigo-400" />}
                    AI Generated Chart
                  </h2>
                  <button className="p-1 sm:p-1.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-sm sm:rounded-md transition-colors">
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:w-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
                <div className="h-64 sm:h-72 md:h-80">
                  {renderChart()}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 border border-gray-100 dark:border-slate-700">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                  <Lightbulb className="w-4 h-4 sm:w-5 sm:w-5 text-yellow-500" />
                  AI Insights
                </h3>
                <div className="space-y-2 text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                  {insights.split('\n').map((insight, index) => (
                    <div key={index} className="p-2 sm:p-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-sm sm:rounded-md border-l-2 sm:border-l-4 border-indigo-400 dark:border-indigo-500 text-xs">
                      {insight}
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-slate-700">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 mb-1.5 sm:mb-2">Available Types</h4>
                  <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                    {[
                        {icon: BarChart3, label: "Bar Charts", colorClass: "text-indigo-500 dark:text-indigo-400"},
                        {icon: TrendingUp, label: "Line Charts", colorClass: "text-green-500 dark:text-green-400"},
                        {icon: BarChart3, label: "Pie Charts", colorClass: "text-purple-500 dark:text-purple-400"},
                        {icon: TrendingUp, label: "Area Charts", colorClass: "text-orange-500 dark:text-orange-400"},
                    ].map(item => (
                        <div key={item.label} className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-gray-50 dark:bg-slate-700 rounded-sm sm:rounded-md">
                        <item.icon className={`w-3 h-3 sm:w-3.5 sm:w-3.5 ${item.colorClass}`} />
                        <span className="text-xs">{item.label}</span>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!currentChart && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
             {[
                {icon: Sparkles, title: "AI-Powered", description: "Describe charts in natural language."},
                {icon: BarChart3, title: "Multiple Chart Types", description: "Supports bar, line, pie, area charts."},
                {icon: Lightbulb, title: "Smart Insights", description: "Get AI-generated explanations."}
             ].map((feature, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
                <div className={`p-2 sm:p-2.5 rounded-md sm:rounded-lg w-fit mb-2 sm:mb-3 ${index === 0 ? 'bg-indigo-100 dark:bg-indigo-900/50' : index === 1 ? 'bg-green-100 dark:bg-green-900/50' : 'bg-purple-100 dark:bg-purple-900/50'}`}>
                    <feature.icon className={`w-4 h-4 sm:w-5 sm:w-5 ${index === 0 ? 'text-indigo-600 dark:text-indigo-400' : index === 1 ? 'text-green-600 dark:text-green-400' : 'text-purple-600 dark:text-purple-400'}`} />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-1.5">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">{feature.description}</p>
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChartsFeature;
