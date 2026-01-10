import React from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare } from 'lucide-react';

const ContactSection = () => {
    return (
        <section className="py-24 bg-black relative">
            <div className="max-w-4xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-slate-900 to-black rounded-3xl p-12 shadow-2xl relative overflow-hidden text-white border border-white/10"
                >
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

                    <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">¿Interesado en implementar KAI?</h2>
                    <p className="text-gray-300 mb-10 max-w-2xl mx-auto font-light relative z-10">
                        Si perteneces a otra facultad o institución y te gustaría llevar la optimización académica a tus estudiantes, contáctame.
                    </p>

                    <div className="flex flex-col md:flex-row justify-center items-center gap-6 relative z-10">
                        <a
                            href="mailto:2070753360116@ingeniera.usac.edu.gt"
                            className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center gap-3"
                        >
                            <Mail size={20} />
                            2070753360116@ingeniera.usac.edu.gt
                        </a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default ContactSection;
