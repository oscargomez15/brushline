import React from 'react'
import { LuPaintbrush } from "react-icons/lu";
import { motion } from 'framer-motion'
export const SignatureDivider = () => {
  return (
    <div className='signature-divider'>
        <motion.div className="divider-container"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}>
            <div className="left-line"></div>
            <LuPaintbrush/>
            <div className="right-line"></div>
        </motion.div>
    </div>
  )
}
