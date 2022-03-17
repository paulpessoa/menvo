import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Site em Manutenção.
        </p>
        <a
          className="App-link"
          href="https://instagram.com/menvobr"
          target="_blank"
          rel="noopener noreferrer"
        >
          Menvo - Mentores Voluntários
        </a>
      </header>
    </div>
  );
}

export default App;
