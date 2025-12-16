import { MessageCircle, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const FloatingChatButton = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [visible, setVisible] = useState(true);

    // Reaparecer al cambiar de ruta
    useEffect(() => {
        setVisible(true);
    }, [location.pathname]);

    // No mostrar el botón si ya estamos en la página del chatbot
    if (location.pathname === '/chatbot') {
        return null;
    }

    // No mostrar si fue cerrado temporalmente
    if (!visible) {
        return null;
    }

    return (
        <div className="floating-chat-container">
            <button
                onClick={() => navigate('/chatbot')}
                className="floating-chat-button group"
                title="Abrir Asistente Académico"
            >
                <MessageCircle className="w-6 h-6 text-white" />

                {/* Texto que aparece al hacer hover */}
                <span className="floating-chat-tooltip">
                    Asistente Académico
                </span>

                {/* Punto de notificación animado */}
                <span className="floating-chat-pulse"></span>
            </button>

            {/* Botón para cerrar temporalmente */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setVisible(false);
                }}
                className="floating-chat-close"
                title="Cerrar temporalmente"
            >
                <X className="w-3 h-3 text-white" />
            </button>

            <style jsx>{`
                .floating-chat-container {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    z-index: 1000;
                }

                .floating-chat-button {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: none;
                    position: relative;
                }

                .floating-chat-button:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
                }

                .floating-chat-button:active {
                    transform: scale(0.95);
                }

                .floating-chat-close {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #ef4444;
                    border: 2px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    z-index: 10;
                }

                .floating-chat-container:hover .floating-chat-close {
                    opacity: 1;
                }

                .floating-chat-close:hover {
                    background: #dc2626;
                }

                .floating-chat-tooltip {
                    position: absolute;
                    right: 70px;
                    background: #1f2937;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 14px;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s ease;
                }

                .floating-chat-button:hover .floating-chat-tooltip {
                    opacity: 1;
                }

                .floating-chat-pulse {
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    width: 14px;
                    height: 14px;
                    background: #ef4444;
                    border-radius: 50%;
                    border: 2px solid white;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.2);
                        opacity: 0.8;
                    }
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .floating-chat-container {
                        bottom: 20px;
                        right: 20px;
                    }

                    .floating-chat-button {
                        width: 50px;
                        height: 50px;
                    }

                    .floating-chat-tooltip {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default FloatingChatButton;
