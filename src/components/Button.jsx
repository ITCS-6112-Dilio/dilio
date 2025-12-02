// src/components/Button.jsx
import { BUTTON_COLORS, BUTTON_SIZES } from '../styles/buttonStyles';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  ...props
}) => {
  const styles = {
    padding: BUTTON_SIZES[size] || BUTTON_SIZES.md,
    background: BUTTON_COLORS[variant] || BUTTON_COLORS.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    width: '100%',
    fontSize: '1rem',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };
  return (
    <button onClick={onClick} style={styles} {...props}>
      {children}
    </button>
  );
};

export default Button;
