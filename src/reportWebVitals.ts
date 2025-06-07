// Simple reportWebVitals implementation without web-vitals dependency
const reportWebVitals = (onPerfEntry?: any) => {
  // For now, we'll just log that web vitals would be reported here
  // You can install web-vitals package later if needed: npm install web-vitals
  if (onPerfEntry && onPerfEntry instanceof Function) {
    console.log('Web Vitals reporting would happen here');
  }
};

export default reportWebVitals;