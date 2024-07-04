import React from 'react'
'use client';
import CountUp from 'react-countup';


const AnimatedCounter=({amount}:{amount:number})=>{
    return(
        <div className='w-full'>
            <CountUp
             decimal="."
             decimals={2} 
             prefix="₹"
             separator=","
             end={amount}/>
        </div>
    )
}
export default AnimatedCounter