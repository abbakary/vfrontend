import { TrendingUp, TrendingDown } from 'lucide-react';
import { useThemeColors } from '../../../utils/useThemeColors';

export default function StatCard({ title, value, change, icon }) {
  const colors = useThemeColors();
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div style={{
      borderRadius: 16,
      backgroundColor: colors.card,
      padding: '24px',
      border: `1px solid ${colors.border}`,
      boxShadow: colors.isDarkMode ? '0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -1px rgba(0,0,0,0.2)' : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
      transition: 'transform 0.2s',
      cursor: 'default'
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: colors.text, margin: '8px 0 0', letterSpacing: '-0.02em' }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 14, fontWeight: 600,
              color: isPositive ? '#10B981' : isNegative ? '#EF4444' : colors.textMuted,
              padding: '2px 8px', borderRadius: 20,
              background: isPositive ? 'rgba(16, 185, 129, 0.15)' : isNegative ? 'rgba(239, 68, 68, 0.15)' : colors.bgSecondary,
              width: 'fit-content'
            }}>
              {isPositive && <TrendingUp size={14} />}
              {isNegative && <TrendingDown size={14} />}
              <span>{isPositive ? '+' : ''}{change}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div style={{
            padding: 12, borderRadius: 12,
            background: colors.isDarkMode ? 'rgba(32, 178, 170, 0.15)' : 'rgba(32, 178, 170, 0.1)',
            color: '#20B2AA',
            boxShadow: colors.isDarkMode ? 'inset 0 2px 4px rgba(32,178,170,0.2)' : 'inset 0 2px 4px rgba(32,178,170,0.1)'
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
