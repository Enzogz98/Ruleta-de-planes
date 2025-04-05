import React, { useEffect, useState } from 'react';
import Wheel from './components/Wheel';
import axios from 'axios';
import './App.css'

function App() {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    axios.get('https://TU-BACKEND.cleverapps.io/opciones')
      .then(res => setOptions(res.data))
      .catch(() => setOptions(["Opción 1", "Opción 2", "Opción 3", "Opción 4"])); // fallback
  }, []);

  return (
    <div style={{ background: '#121212', padding: 20 }}>
      <h2 style={{color: 'white', textAlign: 'center' }}>🎡 Ruleta de planes</h2>
      <Wheel options={options} />
    </div>
  );
}

export default App;
