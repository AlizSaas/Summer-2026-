
const reportWebVitals = (onPerfEntry?: () => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS(onPerfEntry)
      onINP(onPerfEntry)
      onFCP(onPerfEntry)
      onLCP(onPerfEntry)
      onTTFB(onPerfEntry)
    })
  }
}

export default reportWebVitals
  // this code is based on the default create-react-app web vitals reporting, 
  // but modified to use dynamic imports and only
  //  import the web-vitals library if a callback is provided. 
  // This helps reduce the bundle size for users who don't care about web vitals.