// Shared dataset card matching /public/datasets card structure exactly
import { Calendar, FileIcon, HardDrive, Download, ChevronUp, MoreVertical } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useThemeColors } from '../../../utils/useThemeColors';

const PRIMARY = '#FF8C00'; // Orange
const SECONDARY = '#20B2AA'; // Teal

export function DatasetCard({ dataset, onAction, actionLabel, actionStyle, showStatus = false, compact = false }) {
  const { isDarkMode } = useTheme();
  const themeColors = useThemeColors();

  const statusColors = {
    approved: { bg: isDarkMode ? '#1e3a1e' : '#F0FFF4', color: '#38A169', label: 'Approved' },
    pending: { bg: isDarkMode ? '#3a2f1b' : '#FFFAF0', color: '#DD6B20', label: 'Pending' },
    rejected: { bg: isDarkMode ? '#3a1e1e' : '#FFF5F5', color: '#E53E3E', label: 'Rejected' },
  };
  const sc = statusColors[dataset.status] || statusColors.approved;

  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden', backgroundColor: themeColors.card,
      border: `1px solid ${themeColors.border}`,
      boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0,0,0,0.3)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column',
      cursor: 'pointer',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = isDarkMode ? '0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.3)' : '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)';
        e.currentTarget.style.borderColor = PRIMARY;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 6px -1px rgba(0,0,0,0.3)' : '0 4px 6px -1px rgba(0,0,0,0.05)';
        e.currentTarget.style.borderColor = themeColors.border;
      }}
    >
      {/* Image */}
      <div style={{ height: compact ? 120 : 160, backgroundImage: `url(${dataset.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', flexShrink: 0 }}>
        {showStatus && (
          <span style={{ 
            position: 'absolute', top: 12, right: 12, padding: '4px 10px', borderRadius: 8, 
            fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            {sc.label}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: compact ? '16px' : '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <p style={{ fontSize: compact ? 14 : 16, fontWeight: 700, color: themeColors.text, margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {dataset.title}
          </p>
          <MoreVertical size={16} color={themeColors.textMuted} style={{ flexShrink: 0, marginTop: 2 }} />
        </div>

        <p style={{ fontSize: 13, color: themeColors.textMuted, fontWeight: 600, margin: '0 0 10px' }}>{dataset.author}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12, color: themeColors.textMuted }}>
          <span>Visibility <b style={{ color: PRIMARY }}>{dataset.usability}</b></span>
          <Calendar size={12} />
          <span>{dataset.updated}</span>
        </div>

        {/* File Details Grid */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${themeColors.border}` }}>
          {[
            { icon: <FileIcon size={16} color={SECONDARY} />, label: dataset.files },
            { icon: <HardDrive size={16} color={SECONDARY} />, label: dataset.size },
            { icon: <Download size={16} color={SECONDARY} />, label: dataset.downloads },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 10, background: themeColors.hoverBg, transition: 'background 0.2s', flex: 1, justifyContent: 'center' }}>
              {item.icon}
              <span style={{ fontSize: 10, color: themeColors.textMuted, fontWeight: 600, whiteSpace: 'nowrap' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${themeColors.border}`, borderRadius: 8, overflow: 'hidden', background: themeColors.card }}>
            <div style={{ padding: '4px 10px', borderRight: `1px solid ${themeColors.border}`, display: 'flex', alignItems: 'center', color: themeColors.textMuted }}>
              <ChevronUp size={14} />
            </div>
            <div style={{ padding: '4px 12px' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: themeColors.text }}>{dataset.votes}</span>
            </div>
          </div>

          {onAction ? (
            <button onClick={(e) => { e.stopPropagation(); onAction(dataset); }}
              style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', background: PRIMARY, color: '#fff', boxShadow: isDarkMode ? '0 4px 6px rgba(255,140,0,0.4)' : '0 4px 6px rgba(255,140,0,0.2)', transition: 'all 0.2s', ...actionStyle }}>
              {actionLabel || 'View'}
            </button>
          ) : (
            <div style={{ padding: '6px 14px', background: isDarkMode ? `${SECONDARY}25` : `${SECONDARY}15`, borderRadius: 8, fontSize: 14, fontWeight: 700, color: SECONDARY }}>
              ${dataset.price} USD
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DatasetCard;
