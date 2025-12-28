import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

// Color palettes for different chart types
const COLORS = {
  primary: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'],
  priority: {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981'
  },
  status: {
    completed: '#10B981',
    active: '#3B82F6',
    overdue: '#EF4444'
  }
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Pie Chart Component
export function TaskPieChart({ data, title, dataKey = "value", nameKey: _nameKey = "name" }) {
  return (
    <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
      <h4 className="font-medium mb-3 text-center">{title}</h4>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey={dataKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Bar Chart Component
export function TaskBarChart({ data, title, xKey = "name", yKey = "value", color = "#3B82F6" }) {
  return (
    <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
      <h4 className="font-medium mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey={xKey} stroke="var(--text-secondary)" />
          <YAxis stroke="var(--text-secondary)" />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Line Chart Component
export function TaskLineChart({ data, title, xKey = "name", yKey = "value", color = "#3B82F6" }) {
  return (
    <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
      <h4 className="font-medium mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey={xKey} stroke="var(--text-secondary)" />
          <YAxis stroke="var(--text-secondary)" />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Area Chart Component
export function TaskAreaChart({ data, title, xKey = "name", yKey = "value", color = "#3B82F6" }) {
  return (
    <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
      <h4 className="font-medium mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey={xKey} stroke="var(--text-secondary)" />
          <YAxis stroke="var(--text-secondary)" />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            fill={`${color}20`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Pictogram Component (using icons and bars)
export function TaskPictogram({ data, title, icon: Icon, maxValue }) {
  return (
    <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
      <h4 className="font-medium mb-3">{title}</h4>
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = maxValue ? (item.value / maxValue) * 100 : 0;
          const iconCount = Math.ceil(item.value / 5); // Show 1 icon per 5 items

          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm font-medium min-w-[80px]">{item.name}</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(iconCount, 10) }, (_, i) => (
                    <Icon key={i} size={12} className="text-blue-500" />
                  ))}
                  {iconCount > 10 && <span className="text-xs text-[var(--text-secondary)]">+{iconCount - 10}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium min-w-[30px] text-right">{item.value}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Multi-series Bar Chart
export function MultiBarChart({ data, title, series = [] }) {
  return (
    <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
      <h4 className="font-medium mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="name" stroke="var(--text-secondary)" />
          <YAxis stroke="var(--text-secondary)" />
          <Tooltip content={<CustomTooltip />} />
          {series.map((s, index) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              fill={s.color || COLORS.primary[index % COLORS.primary.length]}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Donut Chart with center text
export function DonutChart({ data, title, centerText, centerSubtext }) {
  return (
    <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
      <h4 className="font-medium mb-3 text-center">{title}</h4>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-current">
            {centerText}
          </text>
          <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="text-sm fill-current opacity-70">
            {centerSubtext}
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}