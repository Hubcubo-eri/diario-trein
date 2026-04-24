// styles.js - Constantes de estilo minimalista Apple

export const colors = {
  // Backgrounds
  bgPrimary: 'linear-gradient(135deg, #0a0a0f 0%, #10131a 100%)',
  bgCard: 'rgba(255, 255, 255, 0.03)',
  bgCardHover: 'rgba(255, 255, 255, 0.06)',
  bgAccent: 'rgba(16, 185, 129, 0.1)',
  
  // Text
  textPrimary: '#f9fafb',
  textSecondary: '#d1d5db',
  textTertiary: '#9ca3af',
  
  // Accent
  accent: '#10b981',
  accentDark: '#059669',
  accentLight: 'rgba(16, 185, 129, 0.2)',
  
  // Semantic
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#0ea5e9',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const shadows = {
  sm: '0 2px 8px rgba(0, 0, 0, 0.1)',
  md: '0 4px 16px rgba(0, 0, 0, 0.15)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.2)',
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const getCardStyle = () => ({
  background: colors.bgCard,
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: radius.lg,
  padding: `${spacing.lg}px ${spacing.lg}px`,
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
});

export const getButtonStyle = (variant = 'primary') => {
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
      color: '#fff',
      border: 'none',
      boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
    },
    secondary: {
      background: colors.bgCard,
      color: colors.textSecondary,
      border: `1px solid rgba(255, 255, 255, 0.06)`,
    },
    ghost: {
      background: 'transparent',
      color: colors.textSecondary,
      border: 'none',
    },
  };
  
  return {
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: radius.md,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'DM Sans', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    ...variants[variant],
  };
};

export const getTabStyle = (isActive) => ({
  padding: `${spacing.sm}px ${spacing.md}px`,
  borderRadius: radius.md,
  border: 'none',
  background: isActive ? colors.bgAccent : 'transparent',
  color: isActive ? colors.accent : colors.textTertiary,
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
});

export const getInputStyle = () => ({
  background: colors.bgCard,
  border: `1px solid rgba(255, 255, 255, 0.06)`,
  borderRadius: radius.md,
  color: colors.textPrimary,
  padding: `${spacing.sm}px ${spacing.md}px`,
  fontSize: 13,
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  outline: 'none',
  transition: 'all 0.2s ease',
  '&:focus': {
    borderColor: colors.accent,
    boxShadow: `0 0 0 3px ${colors.accentLight}`,
  },
});
