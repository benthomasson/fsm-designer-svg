import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

if (process.env.REACT_APP_PRODUCTION === 'true') {
  console.log = function () {};
}

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
