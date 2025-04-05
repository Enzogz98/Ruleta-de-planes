import React, { useRef, useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import './Wheel.css'

const Wheel = () => {
  const canvasRef = useRef(null);
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [options, setOptions] = useState([]);
  const [colors, setColors] = useState([]);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const size = 300;
  const centerImageRadius = 45;
  const textOffset = 50;

  const generateUniqueColors = (count) => {
    const generated = new Set();
    while (generated.size < count) {
      const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
      generated.add(color);
    }
    return [...generated];
  };

  const fetchOptions = useCallback(async () => {
    try {
      const res = await fetch('/.netlify/functions/get-opciones');
      const data = await res.json();
      setOptions(data);
      setColors(generateUniqueColors(data.length));
    } catch (error) {
      console.error("Error al cargar opciones:", error);
      const fallback = ["Fallback A", "Fallback B", "Fallback C"];
      setOptions(fallback);
      setColors(generateUniqueColors(fallback.length));
    }
  }, []);

  const truncateText = (ctx, text, maxWidth) => {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let truncated = text;
    while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '...';
  };

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    const slice = 2 * Math.PI / options.length;
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(angle);
    ctx.translate(-size / 2, -size / 2);

    for (let i = 0; i < options.length; i++) {
      const start = i * slice;
      const end = start + slice;
      ctx.beginPath();
      ctx.moveTo(size / 2, size / 2);
      ctx.arc(size / 2, size / 2, size / 2, start, end);
      ctx.fillStyle = colors[i];
      ctx.fill();

      if (winnerIndex === i) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.moveTo(size / 2, size / 2);
        ctx.arc(size / 2, size / 2, size / 2, start, end);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate(start + slice / 2);
      ctx.fillStyle = '#000';
      ctx.font = '14px Montserrat, sans-serif';
      const maxTextWidth = size / 3;
      const truncated = truncateText(ctx, options[i], maxTextWidth);
      ctx.fillText(truncated, textOffset, 0);
      ctx.restore();
    }

    const img = new Image();
    img.src = "/assets/panda.jpg";
    img.onload = () => {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, centerImageRadius, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.save();
      ctx.clip();
      ctx.drawImage(img, size / 2 - centerImageRadius, size / 2 - centerImageRadius, centerImageRadius * 2, centerImageRadius * 2);
      ctx.restore();
    };

    ctx.restore();
  }, [angle, options, colors, winnerIndex]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    if (options.length > 0) drawWheel();
  }, [options, angle, winnerIndex, drawWheel]);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - size / 2;
    const dy = y - size / 2;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= centerImageRadius) {
      Swal.fire({
        title: '🐼 Panda lindo',
        imageUrl: '/assets/panda.jpg',
        imageWidth: 200,
        imageHeight: 200,
        imageAlt: 'Panda',
        background: '#FFD1DC',
        color: '#000',
        confirmButtonText: '¡Aww!',
        customClass: {
          popup: 'custom-popup',
          confirmButton: 'custom-confirm'
        },
        timer: 3000,
        timerProgressBar: true
      });
    }
  };

  const spinWheel = () => {
    if (spinning || options.length === 0) return;
    const spins = Math.random() * 5 + 5;
    const targetAngle = angle + spins * 2 * Math.PI;
    const duration = 4000;
    const start = performance.now();

    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = easeOutCubic(t);
      const newAngle = eased * targetAngle;
      setAngle(newAngle);
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        const finalAngle = newAngle % (2 * Math.PI);
        const index = Math.floor(((2 * Math.PI - finalAngle) / (2 * Math.PI)) * options.length) % options.length;
        setWinnerIndex(index);
        const winner = options[index];
        Swal.fire({
          title: 'Resultado',
          text: `Ganó: ${winner}`,
          imageUrl: '/assets/gif.gif',
          imageWidth: 150,
          imageAlt: 'Celebración',
          background: '#FDE3EE',
          color: '#000',
          confirmButtonText: '¡Felicidades!',
          customClass: {
            popup: 'custom-popup',
            confirmButton: 'custom-confirm'
          }
        });
        deleteOption(winner);
      }
    };

    setSpinning(true);
    requestAnimationFrame(animate);
  };

  const deleteOption = async (value) => {
    try {
      await fetch('/.netlify/functions/delete-opcion', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: value })
      });
      fetchOptions();
    } catch (error) {
      console.error("Error al eliminar opcion:", error);
    }
  };

  const handleAddOption = async () => {
    const { value: texto } = await Swal.fire({
      title: 'Agregar nueva opción',
      input: 'text',
      inputPlaceholder: 'Escribí una opción...'
    });
    if (texto) {
      try {
        await fetch('/.netlify/functions/add-opcion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto })
        });
        fetchOptions();
      } catch (error) {
        console.error("Error al agregar opcion:", error);
      }
    }
  };

  const easeOutCubic = t => (--t) * t * t + 1;

  return (
    <div style={{ minHeight: '100vh', background: '#121212', color: '#fff', textAlign: 'center', paddingTop: 20 }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={{ maxWidth: '90vw', backgroundColor: '#333', borderRadius: '50%' }}
          onClick={handleCanvasClick}
          onTouchStart={handleCanvasClick}
        />
      </div>
      <div style={{ marginTop: 20 }}>
        <button  className='btn' onClick={spinWheel} disabled={spinning || options.length === 0} style={{ borderRadius:"32px", background:"#FDE3EE" , margin: 10, padding: 10 }}>Girar</button>
        <button className='btn' onClick={handleAddOption} style={{borderRadius:"32px", background:"#FDE3EE", margin: 10, padding: 10 }}>Agregar Opción</button>
      </div>
    </div>
  );
};

export default Wheel;
