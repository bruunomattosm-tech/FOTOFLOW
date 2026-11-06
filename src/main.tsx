import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suprimir logs puramente informativos do TensorFlow Lite / MediaPipe XNNPACK
// que o ambiente de preview do navegador interpreta como erros
const filterTfliteInfo = (method: 'log' | 'info' | 'warn' | 'error') => {
  const original = console[method];
  console[method] = (...args: any[]) => {
    if (
      args.some(
        (arg) =>
          typeof arg === 'string' &&
          (arg.includes('XNNPACK delegate') ||
            arg.includes('Created TensorFlow Lite XNNPACK delegate for CPU') ||
            arg.includes('TensorFlow Lite'))
      )
    ) {
      return;
    }
    original.apply(console, args);
  };
};

filterTfliteInfo('log');
filterTfliteInfo('info');
filterTfliteInfo('warn');
filterTfliteInfo('error');

createRoot(document.getElementById('root')!).render(<App />);

