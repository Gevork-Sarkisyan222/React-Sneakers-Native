import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

type IncomeItem = { year: number; month: number; income: number };

interface StatsChartProps {
  data: IncomeItem[];
}

const StatsChart: React.FC<StatsChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => a.year - b.year || a.month - b.month);
    return {
      labels: sorted.map((i) => `${String(i.month).padStart(2, '0')}/${i.year}`),
      datasets: [{ data: sorted.map((i) => i.income), strokeWidth: 2 }],
    };
  }, [data]);

  // now subtract 64 — 16px on each side for the ScrollView and the block with p-4
  const screenWidth = Dimensions.get('window').width - 64;

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(34,128,176,${opacity})`,
    labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
    propsForDots: { r: '4' },
  };

  return (
    <View className="bg-white rounded-2xl shadow p-4">
      <Text className="text-lg font-semibold text-gray-700 mb-2">Income Statistics (DEMO)</Text>
      {data.length > 0 ? (
        <LineChart
          data={chartData}
          width={screenWidth}
          height={200}
          yAxisSuffix=" ₽"
          chartConfig={chartConfig}
          bezier
          style={{ borderRadius: 16 }}
        />
      ) : (
        <View className="h-40 items-center justify-center">
          <Text className="text-gray-400">No data to display</Text>
        </View>
      )}
    </View>
  );
};

export default StatsChart;
