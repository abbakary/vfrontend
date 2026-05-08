import { useThemeColors } from './useThemeColors';

export function useChartColors() {
  const colors = useThemeColors();

  // Chart colors that work in both light and dark modes
  const chartColors = {
    grid: colors.isDarkMode ? '#334155' : '#e2e8f0',
    text: colors.isDarkMode ? '#cbd5e1' : '#718096',
    axisTick: colors.isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
    tooltipBg: colors.isDarkMode ? '#1e293b' : '#ffffff',
    tooltipBorder: colors.isDarkMode ? '#334155' : '#e2e8f0',
    tooltipText: colors.isDarkMode ? '#f1f5f9' : '#1a202c',
    tooltipShadow: colors.isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
    
    // Primary chart colors
    primary: '#FF8C00',
    secondary: '#20B2AA',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    
    // Palette
    palette: ['#FF8C00', '#20B2AA', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'],
  };

  // Tooltip style object for recharts
  const tooltipStyle = {
    backgroundColor: chartColors.tooltipBg,
    border: `1px solid ${chartColors.tooltipBorder}`,
    borderRadius: 12,
    color: chartColors.tooltipText,
    boxShadow: chartColors.tooltipShadow,
  };

  return {
    ...chartColors,
    tooltipStyle,
  };
}

export default useChartColors;
