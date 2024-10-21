const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'API FOR Automated Invocing System',
    description: '...API...'
  },
  host: 'localhost:2000',
  schemes: ['http'],
};
// his-50kt.onrender.com
const outputFile = './swagger-output.json';
const endpointsFiles = ['./index.js'];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    require('./index')
});