module.exports = (fn) => {
    return (req, res, next) => {
      fn(req, res, next).catch(next);
    };
  };
  
  // Alternative version with more features:
  /*
  module.exports = (fn) => {
    return (req, res, next) => {
      fn(req, res, next).catch((err) => {
        // You can add additional error handling here if needed
        // For example, logging errors or transforming error messages
        
        // Default behavior - pass to Express error handler
        next(err);
      });
    };
  };
  */