import React from 'react'
import { LuPaintbrush } from "react-icons/lu";
export const SignatureDivider = () => {
  return (
    <div className='signature-divider'>
        <div className="left-line"></div>
        <LuPaintbrush/>
        <div className="right-line"></div>
        <hr/>
    </div>
  )
}
