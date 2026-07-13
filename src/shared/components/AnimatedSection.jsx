const AnimatedSection = ({ children, className = '', delay = 0, as = 'div' }) => {
  const Component = as;

  return (
    <Component
      className={`native-animated-section ${className}`.trim()}
      style={{ '--native-reveal-delay': `${Math.max(0, delay)}s` }}
    >
      {children}
    </Component>
  );
};

export default AnimatedSection;
