const inputBaseStyle = {
  width: "100%",
  margin: "8px 0",
  padding: "8px",
  borderRadius: 4,
  border: "1px solid #ccc",
  fontSize: "1rem",
  boxSizing: "border-box",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const errorStyle = {
  color: "#db4437",
  fontSize: "0.92em",
  margin: "4px 0 0 0",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const labelStyle = {
  display: "block",
  marginBottom: 4,
  fontWeight: 500,
  fontSize: "1em",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const Input = ({
  label,
  id,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  error,
  autoFocus = false,
  ...props
}) => {
  const inputId = id || name;
  return (
    <div style={{ margin: "10px 0" }}>
      {label && (
        <label htmlFor={inputId} style={labelStyle}>
          {label}
          {required && <span style={{ color: "#b00" }}> *</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        aria-label={label || placeholder}
        aria-required={required}
        aria-invalid={!!error}
        autoFocus={autoFocus}
        style={{
          ...inputBaseStyle,
          borderColor: error ? "#db4437" : "#ccc",
          outline: error ? "#db4437 solid 1px" : undefined,
        }}
        {...props}
      />
      {error && (
        <div style={errorStyle} role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default Input;
