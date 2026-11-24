'use client';
export default function Error({reset}:{reset:()=>void}){return <main id="main" className="empty-state"><h2>No hemos podido cargar la agenda.</h2><button className="primary-button" onClick={reset}>Reintentar</button></main>}
